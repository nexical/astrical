/**
 * src/utils/mailgun.ts
 *
 * This module provides email sending functionality through the Mailgun API.
 * It handles the construction and transmission of email messages with support
 * for multiple recipients, text/html content, and file attachments. The module
 * integrates with Astro's server-side environment variables for secure API
 * credential management and uses FormData for proper multipart encoding.
 *
 * Features:
 * - Secure email sending via Mailgun REST API
 * - Multiple recipient support (to, cc, bcc)
 * - Text and HTML content formatting
 * - File attachment handling with Buffer conversion
 * - Environment variable integration for API credentials
 * - Error handling with detailed logging
 * - Cloudflare Worker compatibility
 *
 * Component Integration:
 * - Astro Environment Variables: Secure credential management
 * - Mailgun REST API: Email delivery service
 * - FormData: Multipart form data construction
 * - Fetch API: HTTP request handling
 *
 * Data Flow:
 * 1. Receive email parameters (recipients, subject, content, attachments)
 * 2. Load Mailgun configuration from environment variables
 * 3. Construct FormData with email content and attachments
 * 4. Send HTTP POST request to Mailgun API endpoint
 * 5. Handle API response and errors appropriately
 * 6. Return success response or throw detailed errors
 *
 * Security Considerations:
 * - API credentials loaded from server-side environment variables
 * - Basic authentication with btoa encoding
 * - No client-side exposure of sensitive information
 * - Secure Buffer handling for file attachments
 *
 * Cloudflare Compatibility:
 * - Buffer to ArrayBuffer conversion for Worker environment
 * - Blob construction for attachment handling
 * - Standard fetch API for HTTP requests
 *
 * Usage Context:
 * - Form submission processing and notifications
 * - User registration and account management emails
 * - Contact form message delivery
 * - Automated system notifications
 */

import { getSecret } from 'astro:env/server';

/**
 * EmailParams interface defines the structure for email message configuration.
 * Provides type safety and documentation for email sending parameters.
 *
 * @property to - Recipient email address(es) as string or array of strings
 * @property subject - Email subject line
 * @property text - Plain text version of email content
 * @property html - HTML version of email content
 * @property attachments - Optional array of file attachments with filename and data
 */
interface EmailParams {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
  attachments?: { filename: string; data: Buffer }[];
}

/**
 * Sends an email message through the Mailgun API.
 *
 * This function constructs and sends email messages with support for multiple
 * recipients, rich content formatting, and file attachments. It handles the
 * complete Mailgun API integration including authentication, request construction,
 * and response processing.
 *
 * @param params - Email configuration parameters
 * @param params.to - Recipient email address(es)
 * @param params.subject - Email subject line
 * @param params.text - Plain text email content
 * @param params.html - HTML email content
 * @param params.attachments - Optional file attachments
 * @returns Promise resolving to Mailgun API response object
 * @throws Error - When email sending fails with detailed error information
 */
export async function sendEmail({ to, subject, text, html, attachments }: EmailParams) {
  // Load Mailgun configuration from environment variables
  const mailgunUrl = getSecret('MAILGUN_URL') as string;
  const mailgunApiKey = getSecret('MAILGUN_API_KEY') as string;
  const mailgunDomain = getSecret('MAILGUN_DOMAIN') as string;
  const mailgunSenderEmail = getSecret('MAILGUN_SENDER_EMAIL') as string;

  // Construct sender address with friendly name
  const from = mailgunSenderEmail;

  // Normalize recipients to array format
  const toArray = Array.isArray(to) ? to : [to];

  // Construct FormData for multipart email submission
  const formData = new FormData();
  formData.append('from', from);

  // Add all recipients to the email
  toArray.forEach((recipient) => formData.append('to', recipient));

  // Add email content
  formData.append('subject', subject);
  formData.append('text', text);
  formData.append('html', html);

  // Process file attachments if provided
  if (attachments && attachments.length > 0) {
    attachments.forEach((attachment) => {
      // Convert Node.js Buffer to Uint8Array then to ArrayBuffer for Cloudflare compatibility
      const uint8Array = new Uint8Array(attachment.data);
      const arrayBuffer = uint8Array.buffer;

      // Create Blob for attachment with proper MIME type
      const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });

      // Add attachment to form data with original filename
      formData.append('attachment', blob, attachment.filename);
    });
  }

  try {
    // Send email via Mailgun REST API
    const response = await fetch(`${mailgunUrl}/v3/${mailgunDomain}/messages`, {
      method: 'POST',
      headers: {
        // Basic authentication with API key
        Authorization: `Basic ${btoa(`api:${mailgunApiKey}`)}`,
      },
      body: formData,
    });

    // Handle unsuccessful API responses
    if (!response.ok) {
      // Attempt to get detailed error information from response
      const responseText = await response.text();
      console.error('Failed to send email:', response.status, response.statusText, responseText);
      throw new Error(`Failed to send email: ${response.status} ${response.statusText}`);
    }

    // Process successful API response
    const result = await response.json();
    console.log('Email sent successfully', result);
    return result;
  } catch (error) {
    // Log and re-throw errors with context
    console.error('Failed to send email', error);
    throw new Error('Failed to send email');
  }
}
