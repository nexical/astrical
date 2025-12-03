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
import merge from 'lodash.merge';
import fs from 'node:fs';
import path from 'path';
import yaml from 'js-yaml';
import { getVar, setVar, checkVar } from '~/utils/cache';

/**
 * Recursively loads all YAML files from a directory and its subdirectories.
 *
 * Scans the specified root directory for YAML files and organizes them into
 * a hierarchical data structure based on their file paths. Each YAML file's
 * content is parsed and stored according to its directory structure.
 *
 * @param rootDir - Root directory path to scan for YAML files
 * @returns Record mapping specification types to their data objects
 */
function loadContent(rootDir: string) {
  // Initialize content structure to hold parsed YAML data
  const content: Record<string, Record<string, unknown>> = {};

  /**
   * Internal recursive function to process directory contents.
   *
   * @param dir - Current directory path being processed
   */
  function _loadContent(dir: string) {
    // Read all files and directories in current directory
    const files = fs.readdirSync(dir);

    // Process each file/directory
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      // Recursively process subdirectories
      if (stat.isDirectory()) {
        _loadContent(filePath);
      }
      // Process YAML files
      else if (file.endsWith('.yaml') || file.endsWith('.yml')) {
        // Read and parse YAML file content
        const rawContent = fs.readFileSync(filePath, 'utf-8');
        const parsedYaml = yaml.load(rawContent);

        // Determine specification type and path from file location
        const relativePath = path.relative(rootDir, filePath);
        const pathComponents = relativePath.split('.')[0].replace(/\\/g, '/').split('/');
        const specType = pathComponents[0]; // First directory level is spec type
        const specPath = pathComponents.slice(1).join('/'); // Remaining path is spec identifier

        // Initialize specification type in content structure if needed
        if (!(specType in content)) {
          content[specType] = {};
        }

        // Store parsed YAML content in appropriate location
        content[specType][specPath] = parsedYaml as object;
      }
    }
  }

  // Start recursive loading from root directory
  _loadContent(rootDir);

  return content;
}

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
  if (!import.meta.env.DEV && checkVar(cacheKey)) {
    return getVar(cacheKey) as Record<string, unknown>;
  }

  // Load raw content from YAML files
  const content = loadContent(SITE.contentDir);

  // Extract pages and shared components for processing
  const pages = content['pages'] || {};
  const shared = content['shared'] || {};
  const forms = {};

  /**
   * Recursively resolves shared component references in data structures.
   *
   * Traverses data objects and arrays to find components that reference
   * shared configurations. When found, merges shared component data with
   * page-specific overrides using deep merging.
   *
   * @param node - Data node to process (object, array, or primitive)
   * @returns Processed node with shared components resolved
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resolveComponents = (node: any): object => {
    // Process arrays by recursively resolving each element
    if (Array.isArray(node)) {
      return node.map((item) => resolveComponents(item));
    }

    // Process objects by resolving shared components and recursively processing properties
    if (node !== null && typeof node === 'object') {
      // Check if current node references a shared component
      if (node.component) {
        const componentPath = node.component;

        // If shared component exists, merge it with page-specific overrides
        if (shared[componentPath]) {
          // Deep copy shared component to avoid modifying the original
          const sharedComponent = JSON.parse(JSON.stringify(shared[componentPath]));

          // Extract overrides (everything except the component reference)
          const overrides = { ...node };
          delete overrides.component;

          // Merge shared component with overrides
          return merge(sharedComponent, overrides);
        }
      }

      // Recursively process all object properties
      const newNode = {};
      for (const key in node) {
        newNode[key] = resolveComponents(node[key]);
      }

      // Check if node is a form component
      if (node.type && node.type == 'Form') {
        // Add form component to forms index
        forms[node.name] = node;
      }
      return newNode;
    }

    // Return primitive values unchanged
    return node;
  };

  // Resolve shared components in all page configurations
  for (const pagePath in pages) {
    content['pages'][pagePath] = resolveComponents(pages[pagePath]);
  }
  // Add forms index to content configurations
  content['forms'] = forms;

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
