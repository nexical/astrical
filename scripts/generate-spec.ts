#!/usr/bin/env tsx

/**
 * Specification Generator Script
 *
 * This script generates aggregated specification files for content and themes.
 * It merges all *.spec.yaml files from `src/components` into `dev/03_content_ops/content.spec.yaml`
 * and copies `src/themes/style.spec.yaml` to `dev/04_design_system/theme.spec.yaml`.
 *
 * Usage:
 * `npm run generate-specs`
 *
 * Options:
 * `--debug`: Show all processed files and other detailed information.
 * `--quiet`: Only show errors.
 */

import path from 'path';
import fs from 'fs';
import { glob } from 'glob';
import yaml from 'js-yaml';
import { exit } from 'process';

const CWD = process.cwd();

const CONTENT_SPEC_DIRECTORIES = ['src/components'];
const THEME_SPEC_FILE = path.join(CWD, 'src/themes/style.spec.yaml');
const OUTPUT_DIR = path.join(CWD, 'dev');
const CONTENT_SPEC_OUTPUT_FILE = path.join(OUTPUT_DIR, '03_content_ops', 'content.spec.yaml');
const THEME_SPEC_OUTPUT_FILE = path.join(OUTPUT_DIR, '04_design_system', 'theme.spec.yaml');

/**
 * Deeply merges two objects. The source object's properties overwrite the target's.
 * This is a non-mutating version.
 * @param target The target object.
 * @param source The source object.
 * @returns A new object with the merged properties.
 */
function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...target };
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = merged[key];
      if (sourceValue && typeof sourceValue === 'object' && targetValue && typeof targetValue === 'object') {
        merged[key] = deepMerge(targetValue as Record<string, unknown>, sourceValue as Record<string, unknown>);
      } else {
        merged[key] = sourceValue;
      }
    }
  }
  return merged;
}

/**
 * Loads all content specification files from the defined directories.
 * @returns A promise that resolves to an array of spec file paths.
 */
async function loadContentSpecFiles(): Promise<string[]> {
  const specFiles: string[] = [];
  for (const dir of CONTENT_SPEC_DIRECTORIES) {
    const files = await glob(path.join(CWD, dir, '**', '*.spec.yaml'));
    specFiles.push(...files);
  }
  return specFiles;
}

/**
 * Loads and merges specifications from a list of files.
 * @param specFiles An array of file paths to load.
 * @returns A promise that resolves to the merged specification object.
 */
async function loadAndMergeSpecifications(specFiles: string[]): Promise<Record<string, unknown>> {
  let mergedSpec: Record<string, unknown> = {};
  for (const file of specFiles) {
    const content = await fs.promises.readFile(file, 'utf-8');
    const spec = yaml.load(content);
    if (spec && typeof spec === 'object' && spec !== null) {
      mergedSpec = deepMerge(mergedSpec, spec as Record<string, unknown>);
    }
  }
  return mergedSpec;
}

/**
 * The main function for the specification generator script.
 */
async function main() {
  const args = process.argv.slice(2);
  const isDebug = args.includes('--debug');
  const isQuiet = args.includes('--quiet');

  if (!isQuiet) {
    console.log('Starting specification generation...');
  }

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    if (isDebug) {
      console.log(`Created output directory: ${path.relative(CWD, OUTPUT_DIR)}`);
    }
  }

  // Generate content spec
  if (isDebug) {
    console.log('\nProcessing content specifications...');
  }
  const contentSpecFiles = await loadContentSpecFiles();
  if (isDebug) {
    console.log(`Found ${contentSpecFiles.length} content specification files to merge.`);
    contentSpecFiles.forEach((file) => console.log(`- ${path.relative(CWD, file)}`));
  }

  const mergedContentSpec = await loadAndMergeSpecifications(contentSpecFiles);

  // Dynamically add sections layouts to EmbeddableSection
  if (mergedContentSpec?.sections) {
    const layouts = Object.keys(mergedContentSpec.sections);
    const layoutRefs = layouts.map((layout) => ({ $ref: `#/sections/${layout}` }));

    (mergedContentSpec.definitions as Record<string, Record<string, Array<object>>>).EmbeddableSection.oneOf.push(
      ...layoutRefs
    );

    if (isDebug) {
      console.log(`\nAdded ${layouts.length} section layouts to EmbeddableSection definition.`);
      layouts.forEach((layout) => console.log(`- ${layout}`));
    }
  }

  // Dynamically add components to EmbeddableComponent
  if (mergedContentSpec?.components) {
    const components = Object.keys(mergedContentSpec.components);
    const componentRefs = components.map((component) => ({ $ref: `#/components/${component}` }));

    (mergedContentSpec.definitions as Record<string, Record<string, Array<object>>>).EmbeddableComponent.oneOf.push(
      ...componentRefs
    );

    // Inject 'access' property into all component definitions
    for (const componentName of components) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const componentDef = (mergedContentSpec.components as Record<string, any>)[componentName];
      if (componentDef && componentDef.properties) {
        componentDef.properties.access = {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'Roles required to access this component.'
        };
      }
    }

    if (isDebug) {
      console.log(`\nAdded ${components.length} components to EmbeddableComponent definition.`);
      components.forEach((component) => console.log(`- ${component}`));
    }
  }

  const contentSpecYaml = yaml.dump(mergedContentSpec, { sortKeys: true });
  await fs.promises.writeFile(CONTENT_SPEC_OUTPUT_FILE, contentSpecYaml);

  if (!isQuiet) {
    console.log(`\nSuccessfully generated content specification: ${path.relative(CWD, CONTENT_SPEC_OUTPUT_FILE)}`);
  }

  // Generate theme spec
  if (isDebug) {
    console.log('\nProcessing theme specification...');
    console.log(`Copying ${path.relative(CWD, THEME_SPEC_FILE)} to ${path.relative(CWD, THEME_SPEC_OUTPUT_FILE)}`);
  }
  await fs.promises.copyFile(THEME_SPEC_FILE, THEME_SPEC_OUTPUT_FILE);

  if (!isQuiet) {
    console.log(`Successfully generated theme specification: ${path.relative(CWD, THEME_SPEC_OUTPUT_FILE)}`);
  }

  if (!isQuiet) {
    console.log('\nSpecification generation finished.');
  }
}

main().catch((error) => {
  console.error('Error during specification generation:', error);
  exit(1);
});
