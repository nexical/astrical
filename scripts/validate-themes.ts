#!/usr/bin/env tsx

/**
 * Theme Validator Script
 *
 * This script validates all theme style.yaml files in the `src/themes` directory
 * against the specification defined in `src/themes/style.spec.yaml`.
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

const SPEC_FILE = path.join(CWD, 'dev/theme.spec.yaml');
const THEMES_DIRECTORY = path.join(CWD, 'src/themes');

/**
 * Loads the specification file.
 * @returns A promise that resolves to the specification object.
 */
async function loadSpecification(): Promise<unknown> {
  const content = await fs.promises.readFile(SPEC_FILE, 'utf-8');
  return yaml.load(content);
}

/**
 * Loads all theme style.yaml files.
 * @returns A promise that resolves to an array of theme file paths.
 */
async function loadThemeFiles(): Promise<string[]> {
  return glob(path.join(THEMES_DIRECTORY, '**', 'style.yaml'), {
    ignore: SPEC_FILE,
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
    console.log(`Found specification file: ${path.relative(CWD, SPEC_FILE)}`);
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
