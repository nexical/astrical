/**
 * src/utils/form-handlers/mailgun.ts
 *
 * This module implements the Mailgun form handler.
 */

import type { FormHandler } from '~/types';
import { sendEmail } from '~/utils/mailgun';

export class MailgunHandler implements FormHandler {
  name = 'mailgun';
  description = 'Sends form submissions via Mailgun API.';

  async handle(
    formName: string,
    data: Record<string, string | string[]>,
    attachments: { filename: string; data: Buffer }[],
    config?: { recipients?: string | string[] }
  ): Promise<void> {
    if (!config?.recipients) {
      // If no recipients configured for this specific handler/form combo,
      // it might rely on global defaults or it might be a no-op if misconfigured.
      // However, the original logic prioritized the 'recipients' field on the form config itself.
      // We will assume 'config' here is passed from the form's handler-specific config.
      // If the user defines 'recipients' at the top level of form config, it should be passed here.
      console.warn(`MailgunHandler: No recipients configured for form '${formName}'. Skipping.`);
      return;
    }

    const to = config.recipients;
    const subject = `New Form Submission: ${formName}`;

    const text = Object.entries(data)
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
      .join('\n');

    const html = `<p>${text.replace(/\n/g, '<br>')}</p>`;

    try {
      await sendEmail({ to, subject, text, html, attachments });
    } catch (error) {
      // Re-throw to be caught by the processor
      throw new Error(`MailgunHandler failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
