/**
 * src/utils/content-scanner.ts
 *
 * This module provides the core logic for recursively scanning, loading, and processing
 * YAML configuration files from the content directory. It handles the hierarchical
 * data structure, module content integration, and shared component resolution.
 * This logic is decoupled from the runtime `site:config` and caching mechanisms
 * to allow reuse in build-time plugins.
 *
 * Features:
 * - Recursive YAML file scanning and parsing
 * - Module content discovery and integration
 * - Shared component resolution and deep merging
 * - Hierarchical data organization by specification type
 *
 * Component Integration:
 * - fs: Node.js file system for reading directory structures and files
 * - path: Node.js path utilities
 * - yaml: js-yaml for parsing configuration files
 * - lodash.merge: Deep merging of content and shared components
 *
 * Data Flow:
 * 1. `scanContent(rootDir)` is called with the project's content path.
 * 2. `loadModuleContent()` scans the global `modules/` directory for additional content.
 * 3. `loadContent(rootDir)` scans the project content.
 * 4. Content is merged (Project overrides Modules).
 * 5. `resolveComponents()` recursively traverses the tree to merge `shared` configurations.
 * 6. Form definitions are extracted and indexed.
 * 7. The fully processed content object is returned.
 *
 * Usage Context:
 * - Runtime data loading via `src/utils/loader.ts`
 * - Build-time configuration bundling in `plugins/config`
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import merge from 'lodash.merge';

const MODULES_DIR = path.resolve(process.cwd(), 'modules');

/**
 * Recursively loads all YAML files from a directory.
 *
 * Scans the directory tree, parses .yaml/.yml files, and builds a nested
 * object structure mirroring the file system.
 *
 * @param rootDir - The root directory to start scanning from
 * @returns Record mapping spec types (first dir) to specific content
 */
function loadContent(rootDir: string) {
    const content: Record<string, Record<string, unknown>> = {};

    function _loadContent(dir: string) {
        if (!fs.existsSync(dir)) return;

        const files = fs.readdirSync(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                _loadContent(filePath);
            } else if (file.endsWith('.yaml') || file.endsWith('.yml')) {
                const rawContent = fs.readFileSync(filePath, 'utf-8');
                const parsedYaml = yaml.load(rawContent);

                const relativePath = path.relative(rootDir, filePath);
                const pathComponents = relativePath.split('.')[0].replace(/\\/g, '/').split('/');

                // Structure: specType/path/to/item
                const specType = pathComponents[0];
                const specPath = pathComponents.slice(1).join('/');

                if (!(specType in content)) {
                    content[specType] = {};
                }

                content[specType][specPath] = parsedYaml as object;
            }
        }
    }

    _loadContent(rootDir);
    return content;
}

/**
 * Loads content from the global modules directory.
 *
 * Iterates through `modules/`, looks for a `content/` subdirectory in each,
 * and merges them. 'menus' are explicitly excluded from modules.
 *
 * @returns Combined content registry from all modules
 */
function loadModuleContent() {
    let moduleContent: Record<string, Record<string, unknown>> = {};

    if (!fs.existsSync(MODULES_DIR)) {
        return moduleContent;
    }

    const modules = fs.readdirSync(MODULES_DIR);

    for (const moduleName of modules) {
        const moduleContentDir = path.join(MODULES_DIR, moduleName, 'content');
        if (fs.existsSync(moduleContentDir) && fs.statSync(moduleContentDir).isDirectory()) {
            const content = loadContent(moduleContentDir);

            // Enforce constraint: Modules cannot contribute menus
            if (content['menus']) {
                delete content['menus'];
            }

            moduleContent = merge(moduleContent, content);
        }
    }

    return moduleContent;
}

/**
 * Scans, merges, and processes all content for the site.
 *
 * This is the main entry point for content loading. It combines module content
 * and project content, then performs the expensive operation of resolving
 * shared component references via deep traversal.
 *
 * @param projectContentDir - The absolute path to the project's content directory
 * @returns The fully processed and resolved content object
 */
export function scanContent(projectContentDir: string): Record<string, unknown> {
    // 1. Load base content from modules
    const moduleContent = loadModuleContent();

    // 2. Load project overrides
    const projectContent = loadContent(projectContentDir);

    // 3. Merge project over modules
    const content = merge(moduleContent, projectContent);

    // 4. Prepare for component resolution
    const pages = content['pages'] || {};
    const shared = content['shared'] || {};
    const forms: Record<string, unknown> = {};

    /**
     * Internal helper to recursively resolve 'component' references.
     * Merges the referenced shared component data with any local overrides.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resolveComponents = (node: any): any => {
        if (Array.isArray(node)) {
            return node.map((item) => resolveComponents(item));
        }

        if (node !== null && typeof node === 'object') {
            // Check for shared component reference
            if (node.component) {
                const componentPath = node.component;
                if (shared[componentPath]) {
                    const sharedComponent = JSON.parse(JSON.stringify(shared[componentPath]));
                    const overrides = { ...node };
                    delete overrides.component;

                    // Merge shared + overrides, then continue resolving recursively
                    return resolveComponents(merge(sharedComponent, overrides));
                }
            }

            const newNode: Record<string, unknown> = {};
            for (const key in node) {
                newNode[key] = resolveComponents(node[key]);
            }

            // Index forms found in the structure
            if (node.type && node.type === 'Form' && typeof node.name === 'string') {
                forms[node.name] = newNode; // Store the fully resolved node
            }

            return newNode;
        }

        return node;
    };

    // 5. Apply resolution to all pages
    if (content['pages']) {
        for (const pagePath in pages) {
            content['pages'][pagePath] = resolveComponents(pages[pagePath]);
        }
    }

    // 6. Attach the discovered forms index
    content['forms'] = forms;

    return content;
}
