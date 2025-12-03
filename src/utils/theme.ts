/**
 * src/utils/theme.ts
 *
 * This module provides theme management and CSS class resolution functionality
 * for the site. It loads theme configurations from YAML files, merges theme
 * and user styles, and resolves CSS class references to enable flexible,
 * configurable styling across components. The module supports a powerful
 * reference system where classes can reference predefined style groups.
 *
 * Features:
 * - Dynamic theme loading from YAML configuration files
 * - User style overrides with proper merging
 * - CSS class reference resolution with @ syntax
 * - Tailwind CSS class merging for conflict resolution
 * - Development and production caching strategies
 * - Deep merging of nested style configurations
 * - Support for component-specific class overrides
 *
 * Component Integration:
 * - fs: Node.js file system for reading YAML files
 * - path: Node.js path utilities for file path manipulation
 * - yaml: js-yaml library for YAML parsing
 * - twMerge: tailwind-merge utility for CSS class conflict resolution
 * - UI: Site configuration for theme settings
 * - cache utilities: Client-side caching for performance
 * - utils: Helper functions for object manipulation
 *
 * Data Flow:
 * 1. Load theme configuration from YAML files (theme + user styles)
 * 2. Merge theme and user styles with proper precedence
 * 3. Cache merged styles for performance optimization
 * 4. Resolve CSS class references using @ syntax
 * 5. Merge component theme styles with user overrides
 * 6. Provide final resolved class configurations to components
 *
 * Style Resolution:
 * - Theme styles loaded from src/themes/[theme]/style.yaml
 * - User overrides loaded from content/style.yaml
 * - References resolved using @groupname syntax
 * - Tailwind classes merged to resolve conflicts
 * - Component-specific overrides applied last
 *
 * Caching Strategy:
 * - Development mode: Always reload styles (no caching)
 * - Production mode: Cache styles after first load
 * - Uses client-side cache utilities for storage
 * - JSON serialization for cache compatibility
 *
 * Usage Context:
 * - Component styling with theme consistency
 * - User customization of site appearance
 * - Dynamic class resolution for complex styling
 * - Performance optimization through caching
 * - Tailwind CSS conflict resolution
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { twMerge } from 'tailwind-merge';

import { UI } from 'site:config';
import { getVar, setVar, checkVar } from '~/utils/cache';
import { isObject, mergeDeep } from '~/utils/utils';

/**
 * Loads and merges theme and user style configurations.
 *
 * Reads theme-specific and user-defined style configurations from YAML files,
 * merges them with proper precedence (user styles override theme styles),
 * and caches the result for performance optimization.
 *
 * @returns Record containing merged theme and user styles
 */
function loadStyles(): Record<string, unknown> {
  const cacheKey = 'styles';

  // In production, use cached styles if available
  if (!import.meta.env.DEV && checkVar(cacheKey)) {
    return getVar(cacheKey) as Record<string, unknown>;
  }

  // Determine theme and file paths
  const theme = UI.theme || 'default';
  const themeStylePath = path.resolve(process.cwd(), `src/themes/${theme}/style.yaml`);
  const userStylePath = path.resolve(process.cwd(), 'content/style.yaml');

  // Load theme styles
  let themeStyles = {};
  try {
    if (fs.existsSync(themeStylePath)) {
      themeStyles = yaml.load(fs.readFileSync(themeStylePath, 'utf-8')) || {};
    }
  } catch (e) {
    console.error(`Error loading theme style file: ${themeStylePath}`, e);
  }

  // Load user styles
  let userStyles = {};
  try {
    if (fs.existsSync(userStylePath)) {
      userStyles = yaml.load(fs.readFileSync(userStylePath, 'utf-8')) || {};
    }
  } catch (e) {
    console.error(`Error loading user style file: ${userStylePath}`, e);
  }

  // Merge theme and user styles with proper precedence
  const mergedStyles = mergeDeep({}, themeStyles, userStyles);

  // Cache merged styles for performance in production
  setVar(cacheKey, mergedStyles);
  return mergedStyles as Record<string, unknown>;
}

/**
 * Resolves component-specific CSS classes with style group references.
 *
 * Takes component class definitions and resolves any @group references
 * to their actual CSS class values from the loaded styles. Returns a
 * properly resolved class configuration object.
 *
 * @param classes - Component class definitions with potential @ references
 * @returns Record of resolved CSS classes
 */
export function getComponentClasses(classes: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!classes) {
    return {};
  }
  return _resolveComponentClasses(classes, loadStyles());
}

/**
 * Internal function to recursively resolve component class references.
 *
 * Processes a component's class configuration, resolving @group references
 * and recursively processing nested objects. Handles both string values
 * (resolved with _resolveClasses) and nested objects (recursive resolution).
 *
 * @param classes - Component class configuration to resolve
 * @param styleGroups - Loaded style groups for reference resolution
 * @returns Record of fully resolved CSS classes
 */
function _resolveComponentClasses(
  classes: Record<string, unknown>,
  styleGroups: Record<string, unknown>
): Record<string, unknown> {
  const resolvedClasses: Record<string, unknown> = {};

  for (const key in classes) {
    const value = classes[key];
    if (typeof value === 'string') {
      // Resolve string values which may contain @ references
      resolvedClasses[key] = _resolveClasses(value, styleGroups);
    } else if (isObject(value)) {
      // Recursively resolve nested object values
      resolvedClasses[key] = _resolveComponentClasses(value as Record<string, unknown>, styleGroups);
    } else {
      // Pass through non-string, non-object values unchanged
      resolvedClasses[key] = value;
    }
  }

  return resolvedClasses;
}

/**
 * Resolves CSS class strings with @group references.
 *
 * Takes a CSS class string that may contain @group references and resolves
 * them to their actual CSS class values from the style groups. Uses twMerge
 * to properly combine and resolve any conflicts between classes.
 *
 * @param classString - CSS class string with potential @ references
 * @param styleGroups - Loaded style groups for reference resolution
 * @returns Merged and resolved CSS class string
 */
function _resolveClasses(classString: string, styleGroups: Record<string, unknown>): string {
  if (!classString) return '';

  // Split class string by @ references while preserving the references
  const classParts = classString
    .split(/(@[a-zA-Z0-9_-]+)/g)
    .map((s) => s.trim())
    .filter(Boolean);

  // Resolve each part, replacing @ references with actual classes
  const resolvedParts = classParts.map((part) => {
    if (part.startsWith('@')) {
      // Extract group name and look up in style groups
      const groupName = part.substring(1);
      const group = styleGroups[groupName];
      if (typeof group === 'string') {
        // Recursively resolve referenced group
        return _resolveClasses(group, styleGroups);
      }
      return '';
    }
    // Return regular class part unchanged
    return part;
  });

  // Merge all resolved parts with twMerge to handle conflicts
  return twMerge(...resolvedParts);
}

/**
 * Gets resolved CSS classes for a specific component identifier.
 *
 * Retrieves theme styles for a component, resolves any @ references,
 * and merges with user-provided override classes. Returns a complete
 * class configuration object ready for component use.
 *
 * @param identifier - Component identifier (e.g., 'Component+Button')
 * @param overrideClasses - User-provided class overrides
 * @returns Record of resolved CSS classes for the component
 */
export function getClasses(
  identifier: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  overrideClasses: Record<string, any> = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, any> {
  const styles = loadStyles();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const themeStyleForComponent = (styles[identifier] as Record<string, any>) || {};

  // Resolve theme styles for the component
  const resolvedThemeStyle = getComponentClasses(themeStyleForComponent);

  // Resolve user override classes
  const resolvedOverrideClasses = getComponentClasses(overrideClasses);

  // Merge theme styles with user overrides (overrides take precedence)
  const finalClasses = mergeDeep(resolvedThemeStyle, resolvedOverrideClasses);

  return finalClasses;
}
