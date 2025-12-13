/**
 * src/utils/loader.ts
 *
 * This module provides a comprehensive YAML-based data loading system for the site.
 * It recursively loads YAML configuration files from the content directory, processes
 * shared component references, and provides a caching mechanism for efficient data
 * retrieval. The loader supports a hierarchical data structure where shared components
 * can be referenced and merged with page-specific configurations.
 *
 * Features:
 * - Recursive YAML file loading from content directory
 * - Shared component reference resolution and merging
 * - Development and production caching strategies
 * - Deep copying to prevent mutation of shared data
 * - Error handling for missing specification types
 *
 * Component Integration:
 * - fs: Node.js file system for reading YAML files
 * - path: Node.js path utilities for file path manipulation
 * - yaml: js-yaml library for YAML parsing
 * - lodash.merge: Deep merging of configuration objects
 * - cache utilities: Client-side caching for performance
 *
 * Data Flow:
 * 1. Recursively scan content directory for YAML files
 * 2. Parse YAML files into JavaScript objects
 * 3. Organize data by specification type (pages, shared, menus, etc.)
 * 4. Resolve shared component references in page configurations
 * 5. Merge shared components with page-specific overrides
 * 6. Cache processed data for performance optimization
 * 7. Provide getSpecs function for data retrieval
 *
 * File Organization:
 * - YAML files are organized in subdirectories by specification type
 * - File paths determine data structure hierarchy
 * - Shared components are stored in 'shared' directory
 * - Page configurations are stored in 'pages' directory
 *
 * Shared Component System:
 * - Components can reference shared configurations using 'component' property
 * - Shared components are deep copied to prevent mutation
 * - Page-specific properties override shared component properties
 * - Uses lodash.merge for intelligent deep merging
 *
 * Caching Strategy:
 * - Development mode: Always reload data (no caching)
 * - Production mode: Cache data after first load
 * - Uses client-side cache utilities for storage
 * - JSON serialization for cache compatibility
 *
 * Usage Context:
 * - Loading page configurations for dynamic routing
 * - Retrieving menu structures for navigation components
 * - Loading form configurations for form processing
 * - Accessing shared component definitions
 * - Providing data for API endpoints
 */

import { SITE } from 'site:config';
import { getVar, setVar, checkVar } from '~/utils/cache';
import { isProd } from '~/utils/utils';
import { scanContent } from './content-scanner';

/**
 * Retrieves and processes content data with caching and shared component resolution.
 *
 * Loads content data from YAML files, resolves shared component references,
 * and implements caching for performance optimization. In development mode,
 * data is always reloaded. In production, data is cached after first load.
 *
 * @returns Record containing processed content data organized by specification type
 */
function getContent(): Record<string, unknown> {
  const cacheKey = 'content';

  // In production, use cached data if available
  if (isProd() && checkVar(cacheKey)) {
    return getVar(cacheKey) as Record<string, unknown>;
  }

  // Delegate the heavy lifting to the content scanner
  // SITE.contentDir is resolved by the site:config plugin
  const content = scanContent(SITE.contentDir);

  // Cache processed content for performance in production
  setVar(cacheKey, content);

  return content;
}

/**
 * Retrieves specifications of a specific type from the loaded content data.
 *
 * Provides access to processed configuration data organized by specification type.
 * Returns a deep copy of the requested data to prevent accidental mutation.
 * Throws an error if the requested specification type doesn't exist.
 *
 * @param specType - Type of specifications to retrieve (e.g., 'pages', 'menus', 'forms')
 * @returns Record containing specifications of the requested type
 * @throws Error if requested specification type is not found
 */
export function getSpecs(specType: string): Record<string, unknown> {
  const content = getContent();

  // Validate that requested specification type exists
  if (!(specType in content)) {
    throw new Error(`Data specifications are missing requested type: ${specType}`);
  }

  // Return deep copy to prevent mutation of cached data
  return JSON.parse(JSON.stringify(content[specType]));
}
