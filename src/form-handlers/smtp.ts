/**
 * src/utils/form-handlers/smtp.ts
 *
 * This module implements the SMTP form handler using nodemailer.
 */

import type { FormHandler } from '~/types';
import nodemailer from 'nodemailer';
import { getSecret } from 'astro:env/server';

export class SMTPHandler implements FormHandler {
  name = 'smtp';
  description = 'Sends form submissions via SMTP.';

  async handle(
    formName: string,
    data: Record<string, string | string[]>,
    attachments: { filename: string; data: Buffer }[],
    config?: { recipients?: string | string[] }
  ): Promise<void> {
    // Retrieve global SMTP settings from environment variables
    // In a real generic module, we might want these passed in config too,
    // but typically credentials are env vars.
    const host = getSecret('SMTP_HOST') as string;
    const port = parseInt((getSecret('SMTP_PORT') as string) || '587', 10);
    const user = getSecret('SMTP_USER') as string;
    const pass = getSecret('SMTP_PASS') as string;
    const from = (getSecret('SMTP_FROM') as string) || user;
    const secure = getSecret('SMTP_SECURE') === 'true'; // true for 465, false for other ports

    if (!host || !user || !pass) {
      throw new Error('SMTPHandler: Missing SMTP environment variables (SMTP_HOST, SMTP_USER, SMTP_PASS).');
    }

    if (!config?.recipients) {
      console.warn(`SMTPHandler: No recipients configured for form '${formName}'. Skipping.`);
      return;
    }

    // Create reusable transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });

    const subject = `New Form Submission: ${formName}`;
    const text = Object.entries(data)
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
      .join('\n');
    const html = `<p>${text.replace(/\n/g, '<br>')}</p>`;

    // Prepare attachments for nodemailer
    const mailAttachments = attachments.map((att) => ({
      filename: att.filename,
      content: att.data,
    }));

    const to = Array.isArray(config.recipients) ? config.recipients.join(', ') : config.recipients;

    try {
      await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
        attachments: mailAttachments,
      });
      console.log(`SMTPHandler: Email sent successfully for form '${formName}'`);
    } catch (error) {
      throw new Error(`SMTPHandler failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
