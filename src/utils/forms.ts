/**
 * src/utils/forms.ts
 *
 * This module provides form processing functionality for handling form submissions
 * and sending notifications via email. It integrates with the site's data configuration
 * system to retrieve form-specific settings and uses the Mailgun utility for email delivery.
 *
 * Features:
 * - Dynamic form processing based on form name
 * - Email notification sending via Mailgun integration
 * - Form recipient configuration through YAML data files
 * - File attachment handling with Buffer support
 * - Error handling and user-friendly error messages
 *
 * Component Integration:
 * - sendEmail: Mailgun utility function for email delivery
 * - getSpecs: Data loader utility for retrieving form configurations
 *
 * Data Flow:
 * 1. Receives form name, values, and attachments from form submission
 * 2. Loads form configuration from YAML data files
 * 3. Constructs email message with form data
 * 4. Sends email to configured recipients via Mailgun
 * 5. Handles errors and provides user feedback
 *
 * Form Configuration:
 * - Forms are defined in YAML data files under the 'forms' specification type
 * - Each form can specify recipient email addresses
 * - Form data is retrieved using getSpecs('forms') utility
 *
 * Email Processing:
 * - Recipients are retrieved from form configuration
 * - Subject line includes form name for identification
 * - Text and HTML versions of form data are generated
 * - File attachments are included in email sending
 *
 * Error Handling:
 * - Catches email sending errors
 * - Logs errors to console for debugging
 * - Throws user-friendly error messages
 * - Provides fallback contact information when email fails
 *
 * Usage Context:
 * - Form submission processing endpoint
 * - Email notification system for form submissions
 * - Integration with Mailgun email delivery service
 * - File attachment support for upload fields
 */

import { sendEmail } from '~/utils/mailgun';
import { getSpecs } from '~/utils/loader';

/**
 * Processes form submissions and sends email notifications.
 *
 * This function handles the backend processing of form submissions by retrieving
 * form configuration, constructing email messages from form data, and sending
 * notifications to configured recipients via Mailgun.
 *
 * @param name - The name/identifier of the form being processed
 * @param values - Object containing form field names and their submitted values
 * @param attachments - Array of file attachments with filename and data Buffer
 * @throws Error - When email sending fails, provides user-friendly error message
 */
export async function formProcessor(
  name: string,
  values: Record<string, string | string[]>,
  attachments: { filename: string; data: Buffer }[]
) {
  // Send email notification for form submission
  const forms = getSpecs('forms');
  const form = forms[name] as { recipients?: string | string[] };

  // Only process email sending if form configuration exists with recipients
  if (form && form.recipients) {
    // Configure email recipients from form configuration
    const to = form.recipients;

    // Create descriptive subject line including form name
    const subject = `New Form Submission: ${name}`;

    // Generate plain text version of form data
    const text = Object.entries(values)
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
      .join('\n');

    // Generate HTML version of form data with line breaks
    const html = `<p>${text.replace(/\n/g, '<br>')}</p>`;

    try {
      // Attempt to send email with form data and attachments
      await sendEmail({ to, subject, text, html, attachments });
    } catch (error) {
      // Log detailed error information for debugging
      console.error('Failed to send email', error);

      // Throw user-friendly error message with fallback contact information
      throw new Error(`There was an error contacting the server, please reach out to ${form.recipients[0]}`);
    }
  }
}
