/**
 * src/utils/cache.ts
 *
 * This module provides a client-side caching system using nanostores for state management.
 * It offers a simple key-value store interface for temporarily storing data during
 * form processing, error handling, and other transient operations. The cache is
 * particularly useful for preserving form state between submissions and displaying
 * validation errors without full page reloads.
 *
 * Features:
 * - In-memory key-value storage using nanostores
 * - Type-safe cache operations with default value support
 * - Object merging for complex data structures
 * - Form state preservation and error handling
 * - Client-side only (no persistence across sessions)
 *
 * Component Integration:
 * - nanostores: Reactive state management library for client-side caching
 * - map: Nanostores map store for key-value storage
 *
 * Data Flow:
 * 1. Initialize empty cache store using nanostores map
 * 2. Provide functions for checking, getting, setting, and deleting cache entries
 * 3. Support object merging for complex data structures
 * 4. Enable form state preservation and error handling
 *
 * Usage Context:
 * - Form validation error persistence
 * - Form field value pre-filling after submission errors
 * - Temporary data storage during user interactions
 * - Client-side state management for UI components
 *
 * Cache Lifecycle:
 * - Data is stored in memory during user session
 * - Cache is cleared when page is refreshed/reloaded
 * - Individual entries can be deleted or overwritten
 * - No persistence across browser sessions
 */

import { map } from 'nanostores';

// Initialize the cache store as a nanostores map for reactive key-value storage
const $cache = map({});

/**
 * Checks if a variable exists in the cache.
 *
 * @param name - The key to check for existence in the cache
 * @returns boolean - True if the key exists, false otherwise
 */
export function checkVar(name: string): boolean {
  return name in $cache ? true : false;
}

/**
 * Retrieves a variable from the cache with optional default value.
 *
 * @param name - The key of the variable to retrieve
 * @param defaultValue - Optional default value to return if key doesn't exist
 * @returns unknown | null - The cached value or default value/null
 */
export function getVar(name: string, defaultValue: unknown | null = null): unknown | null {
  if (checkVar(name)) {
    return $cache[name];
  }
  return defaultValue;
}

/**
 * Retrieves an object from the cache, returning a copy to prevent mutation.
 *
 * @param name - The key of the object to retrieve
 * @returns object - A copy of the cached object or empty object if not found
 */
export function getObject(name: string): object {
  return Object.assign({}, getVar(name, {}));
}

/**
 * Sets a variable in the cache, overwriting any existing value.
 *
 * @param name - The key to store the value under
 * @param value - The value to store (can be any type)
 */
export function setVar(name: string, value: unknown): void {
  $cache[name] = value;
}

/**
 * Adds multiple variables to an object in the cache, merging with existing data.
 *
 * @param name - The key of the object to add variables to
 * @param values - Object containing key-value pairs to add/merge
 */
export function addVars(name: string, values: object): void {
  for (const key in values) {
    if (!$cache[name]) {
      $cache[name] = {};
    }
    $cache[name][key] = values[key];
  }
}

/**
 * Deletes a variable from the cache if it exists.
 *
 * @param name - The key of the variable to delete
 */
export function deleteVar(name: string): void {
  if (checkVar(name)) {
    delete $cache[name];
  }
}
