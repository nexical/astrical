/**
 * src/form-handlers/smtp.ts
 *
 * This module implements a Hybrid SMTP form handler that works in both
 * standard Node.js environments and Cloudflare Workers (Edge) runtime.
 *
 * Features:
 * - Environment detection (Node.js vs Edge)
 * - Dynamic loading of appropriate transport library
 * - Nodemailer support for Node.js
 * - worker-mailer support for Cloudflare Workers
 * - Unified configuration interface
 *
 * Component Integration:
 * - nodemailer: Standard Node.js SMTP library
 * - worker-mailer: Cloudflare-compatible SMTP library
 * - ~/utils/utils: Environment detection utility
 *
 * Configuration:
 * - host: SMTP host
 * - port: SMTP port
 * - secure: true/false
 * - auth: { user, pass }
 * - recipients: Default recipients list
 *
 * Usage Context:
 * - Form submission handling
 * - Email notification delivery
 */

import type { FormHandler } from '~/types';
import { getSecret } from 'astro:env/server';
import { isEdge } from '~/utils/utils';

export class SMTPHandler implements FormHandler {
    name = 'smtp';
    description = 'Sends email via SMTP (Hybrid: Node/Edge).';

    async handle(
        formName: string,
        data: Record<string, string | string[]>,
        attachments: { filename: string; data: Uint8Array }[],
        config?: any
    ): Promise<void> {
        const recipients = config?.recipients;
        if (!recipients) {
            console.warn(`SMTPHandler: No recipients configured for form '${formName}'.`);
            return;
        }

        // Prepare email content
        const subject = `New Submission: ${formName}`;
        const text = Object.entries(data)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('\n');
        const html = `<p>${text.replace(/\n/g, '<br>')}</p>`;

        // Default SMTP config if not provided in handler config
        // In a real app, these should come from config or env secrets
        const smtpConfig = {
            host: config?.host || getSecret('SMTP_HOST') || '',
            port: Number(config?.port || getSecret('SMTP_PORT') || 587),
            secure: config?.secure ?? false,
            auth: {
                user: config?.user || getSecret('SMTP_USER') || '',
                pass: config?.password || getSecret('SMTP_PASS') || '',
            },
            from: config?.from || getSecret('SMTP_FROM') || 'noreply@example.com',
        };

        if (isEdge()) {
            // --- Edge Runtime (Cloudflare) Path ---
            try {
                // Dynamically import worker-mailer to avoid Node.js crashes
                const { WorkerMailer } = await import('worker-mailer');

                const mailer = await (WorkerMailer as any).connect({
                    transport: {
                        host: smtpConfig.host,
                        port: smtpConfig.port,
                        secure: smtpConfig.secure,
                        auth: smtpConfig.auth,
                    },
                    defaults: {
                        from: { name: 'Website Form', address: smtpConfig.from },
                    }
                });

                // Convert attachments for worker-mailer if needed
                // worker-mailer handles Uint8Array/Buffer in 'content' field usually
                const edgeAttachments = attachments.map(a => ({
                    filename: a.filename,
                    content: a.data, // Assuming worker-mailer supports Uint8Array/Buffer
                    contentType: 'application/octet-stream' // Fallback
                }));

                await mailer.send({
                    to: Array.isArray(recipients) ? recipients.join(',') : recipients,
                    subject,
                    text,
                    html,
                    attachments: edgeAttachments.length ? edgeAttachments : undefined
                });

            } catch (e: any) {
                console.error('SMTPHandler (Edge) failed:', e);
                throw new Error(`Edge SMTP Error: ${e.message}`);
            }

        } else {
            // --- Node.js Runtime Path ---
            try {
                const nodemailer = await import('nodemailer');

                const transporter = nodemailer.createTransport({
                    host: smtpConfig.host,
                    port: smtpConfig.port,
                    secure: smtpConfig.secure,
                    auth: smtpConfig.auth,
                });

                await transporter.sendMail({
                    from: smtpConfig.from,
                    to: Array.isArray(recipients) ? recipients.join(',') : recipients,
                    subject,
                    text,
                    html,
                    attachments: attachments.map(a => ({
                        filename: a.filename,
                        content: Buffer.from(a.data), // Convert Uint8Array back to Buffer for Nodemailer
                    })),
                });

            } catch (e: any) {
                console.error('SMTPHandler (Node) failed:', e);
                throw new Error(`Node SMTP Error: ${e.message}`);
            }
        }
    }
}
