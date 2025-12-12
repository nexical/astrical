/**
 * src/utils/forms.ts
 *
 * This module provides form processing functionality for handling form submissions
 * and sending notifications via configured handlers. It integrates with the site's data configuration
 * system to retrieve form-specific settings and uses the FormHandlerRegistry for extensible processing.
 */

import { FORM_HANDLERS } from 'site:config';
import { getSpecs } from '~/utils/loader';
import { formHandlers } from '~/form-registry';

/**
 * Processes form submissions and sends notifications via configured handlers.
 *
 * This function handles the backend processing of form submissions by retrieving
 * form configuration, determining active handlers, and delegating execution.
 *
 * @param name - The name/identifier of the form being processed
 * @param values - Object containing form field names and their submitted values
 * @param attachments - Array of file attachments with filename and data Buffer
 * @throws Error - When all configured handlers fail
 */
export async function formProcessor(
  name: string,
  values: Record<string, string | string[]>,
  attachments: { filename: string; data: Buffer }[]
) {
  // Get form configuration
  const forms = getSpecs('forms');
  const form = forms[name] as { recipients?: string | string[] };

  // Identify handlers to run
  // We use the defaults list from site configuration
  const handlerNames = FORM_HANDLERS.defaults || ['mailgun'];
  const errors: string[] = [];
  let successCount = 0;

  for (const handlerName of handlerNames) {
    const handler = formHandlers.get(handlerName);
    if (!handler) {
      console.warn(`FormProcessor: Handler '${handlerName}' not found in registry.`);
      continue;
    }

    // Check if handler is explicitly disabled in config
    const handlerConfig = FORM_HANDLERS.handlers?.[handlerName] || {};
    if (handlerConfig.enabled === false) {
      continue;
    }

    // Merge form-specific recipients into handler config
    const executionConfig = {
      ...handlerConfig,
      recipients: form?.recipients,
    };

    try {
      await handler.handle(name, values, attachments, executionConfig);
      successCount++;
    } catch (error) {
      console.error(`FormProcessor: Handler '${handlerName}' failed:`, error);
      errors.push(`${handlerName}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // If we attempted to run handlers but all failed, throw an error
  if (handlerNames.length > 0 && successCount === 0 && errors.length > 0) {
    throw new Error(`Form processing failed: ${errors.join('; ')}`);
  }

  // If no handlers were run (e.g. empty defaults), we might want to log a warning
  if (successCount === 0 && errors.length === 0) {
    console.warn(`FormProcessor: No handlers executed for form '${name}'. Check 'site:config' defaults.`);
  }
}
