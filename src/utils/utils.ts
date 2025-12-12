/**
 * src/utils/utils.ts
 *
 * This module provides general-purpose utility functions for string manipulation,
 * object handling, number formatting, and date formatting. These utilities are
 * used throughout the site for common operations that don't fit into more
 * specialized utility modules.
 *
 * Features:
 * - String trimming with custom character support
 * - Object type checking and deep merging
 * - Number formatting for UI display (K, M, B suffixes)
 * - Date formatting with internationalization support
 * - Recursive object manipulation utilities
 *
 * Component Integration:
 * - I18N: Site configuration for internationalization settings
 * - Intl.DateTimeFormat: Browser API for date formatting
 *
 * Data Flow:
 * 1. Load internationalization settings from site configuration
 * 2. Initialize date formatter with appropriate locale settings
 * 3. Provide utility functions for common operations
 * 4. Handle edge cases and type safety appropriately
 *
 * Usage Context:
 * - General string manipulation throughout the site
 * - Object merging for configuration processing
 * - Number formatting for statistics and metrics
 * - Date formatting for content metadata
 * - Utility support for other modules
 */

import { I18N } from 'site:config';

/**
 * Internationalized date formatter for consistent date display.
 *
 * Creates a DateTimeFormat instance configured with the site's language
 * settings to ensure consistent date formatting across the application.
 * Uses UTC timezone to avoid timezone-related inconsistencies.
 *
 * Format: "Jan 1, 2023" (month abbreviated, day numeric, year numeric)
 */
export const formatter: Intl.DateTimeFormat = new Intl.DateTimeFormat(I18N?.language, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

/**
 * Formats a date using the internationalized formatter.
 *
 * Provides consistent date formatting across the site using the configured
 * internationalization settings. Returns empty string for invalid dates.
 *
 * @param date - Date object to format
 * @returns Formatted date string or empty string if date is invalid
 */
export const getFormattedDate = (date: Date): string => (date ? formatter.format(date) : '');

/**
 * Trims specified characters from both ends of a string.
 *
 * Removes specified character (or whitespace if not specified) from the
 * beginning and end of a string. More flexible than String.trim() as it
 * allows specifying which character to trim.
 *
 * @param str - String to trim (defaults to empty string)
 * @param ch - Character to trim (defaults to whitespace)
 * @returns Trimmed string
 */
export const trim = (str = '', ch = ' ') => {
  let start = 0,
    end = str.length || 0;
  while (start < end && str[start] === ch) ++start;
  while (end > start && str[end - 1] === ch) --end;
  return start > 0 || end < str.length ? str.substring(start, end) : str;
};

/**
 * Checks if a value is a plain object (not array or null).
 *
 * Type guard that determines if a value is a plain JavaScript object
 * (created with {} or new Object()). Excludes arrays and null values
 * which are technically objects in JavaScript.
 *
 * @param item - Value to check
 * @returns True if item is a plain object, false otherwise
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isObject = (item: any): item is object => {
  return !!(item && typeof item === 'object' && !Array.isArray(item));
};

/**
 * Deep merges source objects into a target object recursively.
 *
 * Combines properties from multiple source objects into a target object.
 * For object properties, recursively merges nested objects. For other
 * properties, source values overwrite target values. Handles multiple
 * sources in order from left to right.
 *
 * @param target - Target object to merge into
 * @param sources - Source objects to merge from
 * @returns Merged target object
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mergeDeep = (target: any, ...sources: any[]): any => {
  if (!sources.length) {
    return target;
  }
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) {
          Object.assign(target, { [key]: {} });
        }
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }
  return mergeDeep(target, ...sources);
};

/**
 * Formats a number in thousands (K), millions (M), or billions (B) format.
 *
 * Converts large numbers to more readable formats by dividing by appropriate
 * factors and adding suffixes. Removes unnecessary decimal places when
 * the result is a whole number.
 *
 * Examples:
 * - 1000 -> "1K"
 * - 1500 -> "1.5K"
 * - 1000000 -> "1M"
 * - 1500000 -> "1.5M"
 * - 1000000000 -> "1B"
 * - 1500000000 -> "1.5B"
 *
 * @param amount - Number to format
 * @returns Formatted string with appropriate suffix
 */
export const toUiAmount = (amount: number) => {
  if (!amount) return 0;

  let value: string;

  if (amount >= 1000000000) {
    const formattedNumber = (amount / 1000000000).toFixed(1);
    if (Number(formattedNumber) === parseInt(formattedNumber)) {
      value = parseInt(formattedNumber) + 'B';
    } else {
      value = formattedNumber + 'B';
    }
  } else if (amount >= 1000000) {
    const formattedNumber = (amount / 1000000).toFixed(1);
    if (Number(formattedNumber) === parseInt(formattedNumber)) {
      value = parseInt(formattedNumber) + 'M';
    } else {
      value = formattedNumber + 'M';
    }
  } else if (amount >= 1000) {
    const formattedNumber = (amount / 1000).toFixed(1);
    if (Number(formattedNumber) === parseInt(formattedNumber)) {
      value = parseInt(formattedNumber) + 'K';
    } else {
      value = formattedNumber + 'K';
    }
  } else {
    value = Number(amount).toFixed(0);
  }

  return value;
};

/**
 * Checks if the environment is production.
 *
 * @returns True if running in production mode (determined by import.meta.env.DEV)
 */
export const isProd = (): boolean => {
  /* v8 ignore next 5 */
  try {
    return !import.meta.env.DEV;
  } catch {
    return false;
  }
};
