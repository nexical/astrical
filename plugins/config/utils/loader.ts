/**
 * plugins/config/utils/loader.ts
 *
 * This module provides a utility function for loading configuration data from
 * various sources including YAML files and object literals. It serves as a
 * flexible configuration loader that can handle both file-based and in-memory
 * configuration data, making it suitable for different deployment scenarios
 * and development workflows.
 *
 * Features:
 * - YAML file parsing with js-yaml library
 * - File system integration for reading configuration files
 * - Support for both YAML and plain text configuration files
 * - Type-safe configuration loading with proper error handling
 * - Flexible input handling (file paths or object literals)
 *
 * Component Integration:
 * - fs: Node.js file system module for reading files
 * - yaml: js-yaml library for YAML parsing
 * - loadConfig: Main export function for configuration loading
 *
 * Data Flow:
 * 1. Receive configuration path or data object
 * 2. If string path is provided, read file from filesystem
 * 3. If YAML file is detected, parse with js-yaml
 * 4. Return parsed configuration or raw content
 * 5. If object is provided, return as-is
 *
 * File Handling:
 * - Reads UTF-8 encoded files from filesystem
 * - Detects YAML files by .yaml or .yml extension
 * - Parses YAML content using js-yaml library
 * - Returns raw content for non-YAML files
 * - Passes through object literals without modification
 *
 * Error Handling:
 * - Synchronous file reading with potential exceptions
 * - YAML parsing errors handled by js-yaml
 * - No explicit error handling (relies on caller)
 *
 * Usage Context:
 * - Loading site configuration from YAML files
 * - Processing configuration data in build process
 * - Supporting both file-based and programmatic configuration
 * - Enabling flexible configuration management
 */

import fs from 'node:fs';
import yaml from 'js-yaml';

/**
 * Loads configuration data from a file path or returns an object directly.
 *
 * This function provides flexible configuration loading by accepting either
 * a file path string or a configuration object. For file paths, it reads
 * and parses YAML files, while object inputs are returned unchanged.
 *
 * @param configPathOrData - File path string or configuration object
 * @returns Promise resolving to parsed configuration data or raw object
 *
 * @example
 * // Load from YAML file
 * const config = await loadConfig('./content/config.yaml');
 *
 * @example
 * // Pass through object
 * const config = await loadConfig({ site: { name: 'My Site' } });
 */
const loadConfig = async (configPathOrData: string | object) => {
  // Handle string paths (file-based configuration)
  if (typeof configPathOrData === 'string') {
    // Read file content synchronously
    const content = fs.readFileSync(configPathOrData, 'utf8');

    // Parse YAML files
    if (configPathOrData.endsWith('.yaml') || configPathOrData.endsWith('.yml')) {
      return yaml.load(content);
    }

    // Return raw content for non-YAML files
    return content;
  }

  // Pass through object literals unchanged
  return configPathOrData;
};

// Export the loadConfig function for use in other modules
export { loadConfig };
