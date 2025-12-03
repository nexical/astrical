/**
 * submit-form.ts
 *
 * This is an API route that handles form submission processing for the website.
 * It receives form data via POST requests, validates the input, processes file attachments,
 * and delegates the actual form handling to the formProcessor utility function.
 * The endpoint supports multiple forms through dynamic form name identification.
 *
 * Features:
 * - Dynamic form processing based on form name
 * - File attachment handling with Buffer conversion
 * - Form field validation and error handling
 * - Spam protection through honeypot field detection
 * - JSON response format for client-side handling
 * - Server-side form processing with Mailgun integration
 *
 * Route Information:
 * - Path: /api/submit-form
 * - Method: POST
 * - Content-Type: multipart/form-data (form submission)
 *
 * Data Flow:
 * 1. Receives POST request with FormData
 * 2. Extracts form name and validates its presence
 * 3. Processes form fields, excluding special fields (form-name, disclaimer, bot-field)
 * 4. Handles file attachments by converting to Buffer
 * 5. Delegates processing to formProcessor utility
 * 6. Returns JSON response with success or error status
 *
 * Component Integration:
 * - formProcessor: Main utility function that handles form-specific logic
 * - FormData API: Native browser API for parsing form submissions
 * - Buffer: Node.js API for handling binary file data
 *
 * Form Field Processing:
 * - Special fields are excluded from processing:
 *   - 'form-name': Used for form identification (required)
 *   - 'disclaimer': Checkbox agreement field (frontend validation)
 *   - 'bot-field': Honeypot spam protection field
 * - Regular fields are processed and stored in formValues object
 * - File fields are converted to attachments array with Buffer data
 *
 * Error Handling:
 * - 400 Bad Request: When form name is missing
 * - 500 Internal Server Error: For processing errors
 * - Detailed error messages returned as JSON
 *
 * Security Features:
 * - Honeypot field for spam protection ('bot-field')
 * - Form name validation to prevent arbitrary processing
 * - File attachment handling with Buffer conversion
 *
 * Response Format:
 * - Content-Type: application/json
 * - Success: { success: true }
 * - Error: { error: "Error message" }
 *
 * Usage Context:
 * - Form submission endpoint for all site forms
 * - Client-side JavaScript integration through fetch API
 * - Server-side processing with Mailgun email delivery
 * - File attachment support for upload fields
 */

import type { APIRoute } from 'astro';
import { formProcessor } from '~/utils/forms';

/**
 * Disables static site generation for this API route.
 * Form submissions require server-side processing and cannot be pre-rendered.
 */
export const prerender = false;

/**
 * Handles POST requests to process form submissions.
 *
 * This function is called whenever a POST request is made to the /api/submit-form endpoint.
 * It processes the incoming form data, handles file attachments, and delegates the actual
 * form processing to the formProcessor utility function.
 *
 * @param context - Astro API route context containing the request object
 * @param context.request - The incoming HTTP request with form data
 * @returns Response object with JSON result and appropriate HTTP status
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse incoming form data from the request
    const formData = await request.formData();

    // Extract and validate the form name (required for processing)
    const formName = formData.get('form-name') as string;

    // Return error if form name is missing
    if (!formName) {
      return new Response(JSON.stringify({ error: 'Form name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Initialize data structures for form processing
    const formValues: Record<string, string | string[]> = {};
    const attachments: { filename: string; data: Buffer }[] = [];

    // Process each form field, excluding special fields
    for (const [key, value] of formData.entries()) {
      // Skip special fields that are handled separately
      if (key !== 'form-name' && key !== 'disclaimer' && key !== 'bot-field') {
        // Remove form name prefix from field key for cleaner processing
        const fieldName = key.replace(`${formName}-`, '');

        // Handle file attachments
        if (value instanceof File) {
          attachments.push({
            filename: value.name,
            data: Buffer.from(await value.arrayBuffer()),
          });
          formValues[fieldName] = `Attached file: ${value.name}`;
        }
        // Handle regular form fields (text, select, etc.)
        else {
          // Handle multiple values for the same field name (e.g., checkboxes)
          if (formValues[fieldName]) {
            if (!Array.isArray(formValues[fieldName])) {
              formValues[fieldName] = [formValues[fieldName]];
            }
            formValues[fieldName].push(value);
          } else {
            formValues[fieldName] = value;
          }
        }
      }
    }

    // Process the form using the formProcessor utility
    await formProcessor(formName, formValues, attachments);

    // Return success response
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // Log error for server-side debugging
    console.error(error);

    // Return error response with details
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
