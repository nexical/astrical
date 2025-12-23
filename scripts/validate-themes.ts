#!/usr/bin/env tsx

/**
 * Theme Validator Script
 *
 * This script validates all theme style.yaml files in the `src/themes` directory
 * against the specification defined in `src/themes/style.spec.yaml` and all
 * modules defined in `modules/{*}/src/theme/style.spec.yaml`.
 *
 * Usage:
 * `npm run validate-themes`
 *
 * Options:
 * `--debug`: Show all validated files and other detailed information.
 * `--quiet`: Only show errors.
 */

import path from 'path';
import fs from 'fs';
import { glob } from 'glob';
import yaml from 'js-yaml';
import { exit } from 'process';

const CWD = process.cwd();

// Core spec location (symlinked or direct)
const CORE_SPEC_FILE = path.join(CWD, 'src/themes/style.spec.yaml');
// Pattern to find module specs (check both root theme and src/theme)
const MODULE_SPECS_PATTERN = path.join(CWD, 'modules/*/src/theme/style.spec.yaml');

const THEMES_DIRECTORY = path.join(CWD, 'src/themes');

/**
 * Deep merges source object into target object.
 * Simple implementation for merging specs.
 */
function deepMerge(target: any, source: any): any {
  if (typeof target !== 'object' || target === null) {
    return source;
  }
  if (typeof source !== 'object' || source === null) {
    return target; // source is not object, don't overwrite with primitive unless standard merge? valid for spec?
  }

  const output = { ...target };
  Object.keys(source).forEach(key => {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (key in target) {
        output[key] = deepMerge(target[key], source[key]);
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    } else {
      Object.assign(output, { [key]: source[key] });
    }
  });
  return output;
}

/**
 * Loads the core specification file.
 */
async function loadCoreSpec(): Promise<Record<string, unknown>> {
  try {
    const content = await fs.promises.readFile(CORE_SPEC_FILE, 'utf-8');
    return yaml.load(content) as Record<string, unknown>;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.warn(`Warning: Core spec file not found at ${CORE_SPEC_FILE}`);
      return {};
    }
    throw error;
  }
}

/**
 * Loads and merges all module specification files.
 */
async function loadModuleSpecs(): Promise<Record<string, unknown>> {
  const moduleSpecFiles = await glob(MODULE_SPECS_PATTERN);
  // Temporary debug log
  console.log('Found module spec files:', moduleSpecFiles.map(f => path.relative(CWD, f)));

  let mergedSpecs: Record<string, unknown> = {};

  for (const file of moduleSpecFiles) {
    try {
      const content = await fs.promises.readFile(file, 'utf-8');
      const spec = yaml.load(content) as Record<string, unknown>;
      // We assume module specs are top-level objects that can be merged
      mergedSpecs = deepMerge(mergedSpecs, spec);
    } catch (error) {
      console.warn(`Warning: Failed to load module spec at ${file}`, error);
    }
  }
  return mergedSpecs;
}

/**
 * Loads the full concatenated specification.
 */
async function loadSpecification(): Promise<unknown> {
  const coreSpec = await loadCoreSpec();
  const moduleSpecs = await loadModuleSpecs();

  // Merge module specs INTO core spec (modules extend core)
  // We'll merge module specs into core specs.
  return deepMerge(coreSpec, moduleSpecs);
}

/**
 * Loads all theme style.yaml files.
 * @returns A promise that resolves to an array of theme file paths.
 */
async function loadThemeFiles(): Promise<string[]> {
  // We might want to validate module themes too? 
  // The prompt said "load the component style specs... and concatenate them... so that we capture all core and module components."
  // It didn't explicitly say to validate module themes, but "validates all theme style.yaml files in the src/themes directory".
  // Keeping original behavior for theme files to validate, plus validating against the extended spec.
  return glob(path.join(THEMES_DIRECTORY, '**', 'style.yaml'), {
    ignore: CORE_SPEC_FILE,
  });
}

/**
 * Validates a node against a schema.
 * @param node The node to validate.
 * @param schema The schema to validate against.
 * @param path The path to the current node for error reporting.
 */
function validateNode(node: unknown, schema: Record<string, unknown> | null, path: string): string[] {
  if (!schema) {
    return []; // No schema to validate against.
  }

  if (node === undefined) {
    // Property is not present in the theme file. This is okay for optional properties.
    // The spec doesn't define required properties, so we assume all are optional.
    return [];
  }

  const errors: string[] = [];
  const expectedType = schema.type as string;
  const actualType = Array.isArray(node) ? 'array' : typeof node;

  if (expectedType) {
    let typeIsValid = expectedType === actualType;
    // Allow null for properties expected to be strings.
    if (expectedType === 'string' && node === null) {
      typeIsValid = true;
    }
    if (!typeIsValid) {
      errors.push(`Invalid type for ${path}. Expected ${expectedType}, got ${actualType}`);
      return errors; // Stop validation for this branch if type is wrong.
    }
  }

  if (actualType === 'object' && node !== null) {
    if (schema.properties && typeof schema.properties === 'object') {
      const nodeAsRecord = node as Record<string, unknown>;
      const schemaProps = schema.properties as Record<string, Record<string, unknown>>;
      // Check for unknown properties in the node.
      for (const key in nodeAsRecord) {
        if (!schemaProps[key]) {
          errors.push(`Unknown property: ${path}.${key}`);
        }
      }

      // Validate known properties recursively.
      for (const key in schemaProps) {
        errors.push(...validateNode(nodeAsRecord[key], schemaProps[key], `${path}.${key}`));
      }
    }
  }

  return errors;
}

/**
 * Validates a single theme file.
 * @param filePath The path to the theme file.
 * @param specification The specification.
 */
async function validateFile(filePath: string, specification: Record<string, unknown>): Promise<string[]> {
  const content = await fs.promises.readFile(filePath, 'utf-8');
  const data = yaml.load(content) as Record<string, unknown>;
  const errors: string[] = [];

  if (!data) return [];

  const relativePath = path.relative(CWD, filePath);

  // Validate top-level properties against the spec.
  for (const key in data) {
    if (specification[key]) {
      errors.push(
        ...validateNode(data[key], specification[key] as Record<string, unknown> | null, `${relativePath}.${key}`)
      );
    } else {
      errors.push(`Unknown style group or property: '${key}' in ${relativePath}`);
    }
  }

  return errors;
}

/**
 * The main function for the theme validator script.
 */
async function main() {
  const args = process.argv.slice(2);
  const isDebug = args.includes('--debug');
  const isQuiet = args.includes('--quiet');

  if (!isQuiet) {
    console.log('Starting theme validation...');
  }

  const specification = (await loadSpecification()) as Record<string, unknown>;
  const themeFiles = await loadThemeFiles();
  const allErrors: string[] = [];

  if (isDebug) {
    console.log(`Core spec: ${path.relative(CWD, CORE_SPEC_FILE)}`);
    // Re-resolve keys to show what's loaded
    console.log(`Loaded ${Object.keys(specification).length} top-level spec keys.`);

    console.log('\nFound theme files:');
    themeFiles.forEach((file) => console.log(`- ${path.relative(CWD, file)}`));
    console.log(`Total: ${themeFiles.length} files\n`);
  }

  for (const file of themeFiles) {
    allErrors.push(...(await validateFile(file, specification)));
  }

  if (allErrors.length > 0) {
    console.error('\nValidation failed with the following errors:');
    allErrors.forEach((error) => console.error(`- ${error}`));
    exit(1);
  } else if (!isQuiet) {
    console.log('\nAll theme files are valid!');
  }

  if (!isQuiet) {
    console.log('\nTheme validation finished.');
  }
}

main().catch((error) => {
  console.error('Error during theme validation:', error);
  exit(1);
});
