/**
 * src/utils/validators.js
 *
 * This module provides client-side form field validation functions for the site's
 * contact forms. It implements custom validation logic for specific field types
 * including name validation (requiring first and last name) and message validation
 * (requiring minimum character length). These validators are referenced by name
 * in form field configurations and executed during form submission processing.
 *
 * Features:
 * - Name field validation requiring first and last name
 * - Message field validation requiring minimum character length
 * - Error throwing for validation failures with user-friendly messages
 * - Integration with form processing system through named exports
 *
 * Component Integration:
 * - Form field configurations reference validator names
 * - Form processing system imports and executes validators
 * - Error messages displayed to users through form error handling
 *
 * Data Flow:
 * 1. Form field configuration specifies validator name
 * 2. Form processing system imports validator functions
 * 3. Validators execute with field values during submission
 * 4. Validation errors throw with descriptive messages
 * 5. Form system catches and displays errors to user
 *
 * Validation Functions:
 * - validateName: Ensures name fields contain first and last name
 * - validateMessage: Ensures message fields meet minimum length
 *
 * Error Handling:
 * - Validators throw Error objects with user-friendly messages
 * - Form system catches errors and displays to user
 * - No silent failures - all validation issues are communicated
 *
 * Usage Context:
 * - Contact form field validation
 * - User registration form validation
 * - Any form requiring custom validation logic
 * - Integration with YAML form field configurations
 */

/**
 * Validates that a name field contains both first and last name.
 *
 * Splits the input value by spaces and checks that there are at least
 * two words present. This ensures users provide both first and last names
 * for proper identification and communication.
 *
 * @param {string} value - The name field value to validate
 * @throws {Error} When value doesn't contain at least two words
 * @returns {void}
 *
 * Example:
 * - "John Doe" - Valid (2 words)
 * - "John" - Invalid (1 word)
 * - "John Michael Doe" - Valid (3 words)
 */
export function validateName(value) {
  const words = value.split(' ');
  if (words.length < 2) {
    throw new Error('We need your first and last name');
  }
}

/**
 * Validates that a message field contains sufficient detail.
 *
 * Checks that the message length meets the minimum requirement of 50 characters
 * to ensure users provide meaningful detail about their inquiry. This prevents
 * submission of overly brief or unhelpful messages.
 *
 * @param {string} value - The message field value to validate
 * @throws {Error} When value is less than 50 characters
 * @returns {void}
 *
 * Example:
 * - "This is a detailed message with more than fifty characters" - Valid
 * - "Short message" - Invalid (less than 50 characters)
 */
export function validateMessage(value) {
  if (value.length < 50) {
    throw new Error('You need to provide us a little more detail (at least 50 characters)');
  }
}
