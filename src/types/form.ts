/**
 * src/types/form.ts
 *
 * This file defines the TypeScript interfaces for form-related data structures
 * used throughout the site's form handling system. These interfaces provide
 * type safety and documentation for the data-driven form architecture where
 * form configurations are defined in YAML data files.
 *
 * The types support a flexible form system where:
 * - Forms are defined with configurable fields and validation
 * - Field types map to specific form components
 * - Options support select, checkbox, and radio field types
 * - Base field properties provide common attributes
 *
 * Features:
 * - Type safety for form configuration files
 * - Comprehensive documentation for content authors
 * - Support for various form field types
 * - Flexible validation and default value handling
 * - Integration with form processing and rendering components
 *
 * Data Flow:
 * 1. YAML configuration files define form structures
 * 2. Form components consume typed field configurations
 * 3. Form processing utilities validate and handle submissions
 * 4. Field components render based on type and configuration
 *
 * Usage Context:
 * - Data validation for form YAML configuration files
 * - Type definitions for form rendering components
 * - Form processing utility function parameters
 * - API request/response typing for form submissions
 */

/**
 * Option interface defines the structure for form field options.
 * Used for select, checkbox, and radio field types to provide choice values.
 *
 * @property name - Unique identifier for the option value
 * @property label - Display text for the option (defaults to name if not provided)
 */
export interface Option {
  name: string;
  label?: string;
}

/**
 * FormItem interface defines the structure for individual form fields.
 * Represents a single input element within a form with its configuration.
 *
 * @property type - Field type identifier that maps to form component (e.g., 'ShortText', 'Email', 'Select')
 * @property name - Unique identifier for the field (used in form data and validation)
 * @property label - Display text for the field label
 * @property multiple - Whether multiple values can be selected (for Select fields)
 * @property options - Array of Option objects for choice-based fields
 * @property default - Default value for the field
 * @property validator - Validation function identifier for custom validation
 */
export interface FormItem {
  type: string;
  name: string;
  label?: string;
  multiple?: boolean;
  options?: Array<Option>;
  default?: unknown;
  validator?: string;
}

/**
 * BaseField interface defines common properties for form field components.
 * Provides shared attributes that all form fields inherit.
 *
 * @property name - Unique identifier for the field (used in form data)
 * @property label - Display text for the field label
 * @property required - Whether the field is required for form submission
 * @property value - Current field value (from cache for pre-filling)
 */
export interface BaseField {
  name: string;
  label?: string;
  required?: boolean;
  value?: string | Array<string>;
}
