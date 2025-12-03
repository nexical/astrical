#!/usr/bin/env tsx

/**
 * Content Validator Script
 *
 * This script validates all content files in the `content/pages` and `content/shared` directories
 * against the specifications defined in `src/layouts` and `src/components/widgets`.
 *
 * Usage:
 * `npm run validate-content`
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

const SPEC_FILE = path.join(CWD, 'dev/content.spec.yaml');
const CONTENT_DIRECTORIES = ['content/pages', 'content/shared'];

/**
 * Loads the specification file.
 * @returns A promise that resolves to the specification object.
 */
async function loadSpecification(): Promise<unknown> {
  const content = await fs.promises.readFile(SPEC_FILE, 'utf-8');
  return yaml.load(content);
}

/**
 * Loads all content files from the predefined content directories.
 * @returns A promise that resolves to an array of content file paths.
 */
async function loadContentFiles(): Promise<string[]> {
  const contentFiles: string[] = [];
  for (const dir of CONTENT_DIRECTORIES) {
    const files = await glob(path.join(CWD, dir, '**', '*.yaml'));
    contentFiles.push(...files);
  }
  return contentFiles;
}

/**
 * Resolves a $ref pointer to its schema definition.
 * @param ref The reference string (e.g., '#/definitions/Image').
 * @param specification The root specification object.
 * @returns The resolved schema, or undefined if not found.
 */
function getSchema(ref: string, specification: Record<string, unknown>): unknown {
  const parts = ref.split('/').slice(1);
  let schema: unknown = specification;
  for (const part of parts) {
    if (schema && typeof schema === 'object' && part in schema) {
      schema = (schema as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return schema;
}

function getAllowedProperties(
  schema: Record<string, unknown>,
  specification: Record<string, unknown>
): Set<string> {
  const properties = new Set<string>();

  if (schema.$ref && typeof schema.$ref === 'string') {
    schema = getSchema(schema.$ref, specification) as Record<string, unknown>;
  }

  if (schema.properties && typeof schema.properties === 'object') {
    Object.keys(schema.properties).forEach((prop) => properties.add(prop));
  }

  if (schema.allOf && Array.isArray(schema.allOf)) {
    schema.allOf.forEach((subSchema: unknown) => {
      if (subSchema && typeof subSchema === 'object') {
        getAllowedProperties(subSchema as Record<string, unknown>, specification).forEach((prop) => properties.add(prop));
      }
    });
  }

  if (schema.oneOf && Array.isArray(schema.oneOf)) {
    schema.oneOf.forEach((subSchema: unknown) => {
      if (subSchema && typeof subSchema === 'object') {
        getAllowedProperties(subSchema as Record<string, unknown>, specification).forEach((prop) => properties.add(prop));
      }
    });
  }

  return properties;
}

/**
 * Validates a node against a schema.
 * @param node The node to validate.
 * @param schema The schema to validate against.
 * @param path The path to the current node for error reporting.
 * @param specification The root specification object.
 */
function validateNode(
  node: unknown,
  schema: Record<string, unknown> | null,
  path: string,
  specification: Record<string, unknown>
): string[] {
  if (!schema || !node) return [];

  if (schema.$ref && typeof schema.$ref === 'string') {
    const ref = schema.$ref;
    schema = getSchema(schema.$ref, specification) as Record<string, unknown> | null;
    if (!schema) {
      return [`Schema reference not found: ${ref} at ${path}`];
    }
  }

  const errors: string[] = [];

  if (schema.oneOf && Array.isArray(schema.oneOf)) {
    const componentType = (node as Record<string, unknown>).type;
    const sectionLayout = (node as Record<string, unknown>).layout;

    let matchingSchema: unknown = null;

    if (componentType && typeof componentType === 'string') {
      const components = specification.components as Record<string, unknown>;
      const componentTypeKey = Object.keys(components).find(
        (key) => key.toLowerCase() === componentType.toLowerCase()
      );
      if (componentTypeKey) {
        matchingSchema = schema.oneOf.find(
          (s: Record<string, unknown>) => s.$ref === `#/components/${componentTypeKey}`
        );
      }
    } else if (sectionLayout && typeof sectionLayout === 'string') {
      const sections = specification.sections as Record<string, unknown>;
      const sectionLayoutKey = Object.keys(sections).find(
        (key) => key.toLowerCase() === sectionLayout.toLowerCase()
      );
      if (sectionLayoutKey) {
        matchingSchema = schema.oneOf.find((s: Record<string, unknown>) => s.$ref === `#/sections/${sectionLayoutKey}`);
      }
    }

    if (matchingSchema) {
      return validateNode(node, matchingSchema as Record<string, unknown>, path, specification);
    }

    const oneOfErrors: string[][] = [];
    for (const subSchema of schema.oneOf) {
      const subErrors = validateNode(node, subSchema as Record<string, unknown>, path, specification);
      if (subErrors.length === 0) {
        return []; // Valid against one of the schemas
      }
      oneOfErrors.push(subErrors);
    }
    errors.push(`Invalid node at ${path}. It does not match any of the oneOf schemas.`);
    return errors;
  } else if (schema.allOf && Array.isArray(schema.allOf)) {
    for (const subSchema of schema.allOf) {
      errors.push(...validateNode(node, subSchema as Record<string, unknown>, path, specification));
    }
  } else {
    const allowedProperties = getAllowedProperties(schema, specification);
    if (node && typeof node === 'object' && !Array.isArray(node)) {
      for (const key in node) {
        if (key === 'component') continue;
        if (!allowedProperties.has(key) && !schema.additionalProperties) {
          errors.push(`Unknown property: ${path}.${key}`);
        }
      }
    }

    if (schema.properties && typeof schema.properties === 'object') {
      for (const key in schema.properties) {
        const prop = (schema.properties as Record<string, unknown>)[key] as { required?: boolean };
        if (prop.required && (node as Record<string, unknown>)[key] === undefined) {
          errors.push(`Missing required property: ${path}.${key}`);
        }
      }
    }

    for (const key in node as Record<string, unknown>) {
      let propSchema: unknown = null;
      if (schema.properties && typeof schema.properties === 'object' && (schema.properties as Record<string, unknown>)[key]) {
        propSchema = (schema.properties as Record<string, unknown>)[key];
      } else if (schema.additionalProperties) {
        propSchema = schema.additionalProperties;
      }

      if (propSchema && typeof propSchema === 'object') {
        const propPath = `${path}.${key}`;
        const propValue = (node as Record<string, unknown>)[key];
        const propSchemaRecord = propSchema as Record<string, unknown>;

        if (propSchemaRecord.type) {
          const types = Array.isArray(propSchemaRecord.type)
            ? (propSchemaRecord.type as string[])
            : [propSchemaRecord.type as string];
          let valid = false;
          for (const type of types) {
            if (type === 'integer') {
              if (Number.isInteger(propValue)) {
                valid = true;
                break;
              }
            } else if (type === 'array') {
              if (Array.isArray(propValue)) {
                valid = true;
                break;
              }
            } else {
              if (typeof propValue === type) {
                valid = true;
                break;
              }
            }
          }
          if (!valid) {
            errors.push(`Invalid type for ${propPath}. Expected ${types.join(' or ')}, got ${typeof propValue}`);
          }
        }

        if (propSchemaRecord.enum && Array.isArray(propSchemaRecord.enum)) {
          if (key === 'type' && typeof propValue === 'string') {
            const lowerCaseEnum = propSchemaRecord.enum.map((v: unknown) => String(v).toLowerCase());
            if (!lowerCaseEnum.includes(propValue.toLowerCase())) {
              errors.push(
                `Invalid value for ${propPath}. Expected one of ${propSchemaRecord.enum.join(', ')}, got ${propValue}`
              );
            }
          } else if (!propSchemaRecord.enum.includes(propValue)) {
            errors.push(
              `Invalid value for ${propPath}. Expected one of ${propSchemaRecord.enum.join(', ')}, got ${propValue}`
            );
          }
        }

        if (propValue && typeof propValue === 'object') {
          if (Array.isArray(propValue)) {
            if (propSchemaRecord.items) {
              propValue.forEach((item, index) => {
                errors.push(
                  ...validateNode(
                    item,
                    propSchemaRecord.items as Record<string, unknown>,
                    `${propPath}[${index}]`,
                    specification
                  )
                );
              });
            }
          } else {
            errors.push(...validateNode(propValue, propSchemaRecord, propPath, specification));
          }
        }
      }
    }
  }
  return errors;
}

/**
 * Validates a single content file.
 * @param filePath The path to the content file.
 * @param specification The merged specifications.
 */
async function validateFile(filePath: string, specification: Record<string, unknown>): Promise<string[]> {
  const content = await fs.promises.readFile(filePath, 'utf-8');
  const data = yaml.load(content);
  const errors: string[] = [];

  if (!data) return [];

  const relativePath = path.relative(CWD, filePath);

  if (relativePath.startsWith('content/pages')) {
    const pageSchema = specification.Page as Record<string, unknown> | null;
    if (!pageSchema) {
      return [`Page specification not found.`];
    }
    errors.push(...validateNode(data, pageSchema, relativePath, specification));
  } else if (relativePath.startsWith('content/shared')) {
    const componentSchema = getSchema('#/definitions/EmbeddableComponent', specification) as
      | Record<string, unknown>
      | null;
    if (!componentSchema) {
      return [`EmbeddableComponent specification not found.`];
    }
    errors.push(...validateNode(data, componentSchema, relativePath, specification));
  }

  return errors;
}

/**
 * The main function for the content validator script.
 */
async function main() {
  const args = process.argv.slice(2);
  const isDebug = args.includes('--debug');
  const isQuiet = args.includes('--quiet');

  if (!isQuiet) {
    console.log('Starting content validation...');
  }

  const specification = (await loadSpecification()) as Record<string, unknown>;
  const contentFiles = await loadContentFiles();
  const allErrors: string[] = [];

  if (isDebug) {
    console.log('\nFound content files:');
    contentFiles.forEach((file) => console.log(`- ${path.relative(CWD, file)}`));
    console.log(`Total: ${contentFiles.length} files`);
  }

  for (const file of contentFiles) {
    allErrors.push(...(await validateFile(file, specification)));
  }

  if (allErrors.length > 0) {
    console.error('\nValidation failed with the following errors:');
    allErrors.forEach((error) => console.error(`- ${error}`));
    exit(1);
  } else if (!isQuiet) {
    console.log('\nAll content files are valid!');
  }

  if (!isQuiet) {
    console.log('\nContent validation finished.');
  }
}

main().catch((error) => {
  console.error('Error during content validation:', error);
  exit(1);
});
