#!/usr/bin/env tsx

/**
 * core/scripts/generate-context.ts
 *
 * ==============================================================================
 * 🤖 THE "SENSORY SYSTEM" GENERATOR
 * ==============================================================================
 *
 * This script is the "Wake-Up Routine" for AI Agents working on the Astrical platform.
 * It scans the current project state and generates two critical artifacts in `core/dev/00_context/`:
 *
 * 1. current_state.md: A human-readable summary for the AI to "read" and orient itself.
 * 2. project_manifest.yaml: A structured dataset for the AI to reference specific paths/modules.
 *
 * ARCHITECTURAL GOAL:
 * Prevent "Context Drift" where an Agent hallucinates files or modules that do not exist.
 * By running this script (via `npm run context:refresh`), the Agent gets a real-time
 * snapshot of the "World View" before attempting any tasks.
 *
 * USAGE:
 * $ npm run context:refresh
 *
 * DEPENDENCIES:
 * - node:fs/promises
 * - node:path
 * - glob (Ensure this is in devDependencies: `npm install -D glob`)
 * - js-yaml (Ensure this is in devDependencies: `npm install -D js-yaml`)
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { glob } from 'glob';
import yaml from 'js-yaml';

// --- Configuration ---
const PATHS = {
    config: 'content/config.yaml',
    modulesDir: 'modules',
    pagesDir: 'content/pages',
    styleConfig: 'content/style.yaml',
    outputDir: 'dev/00_context',
    outputMd: 'dev/00_context/current_state.md',
    outputYaml: 'dev/00_context/project_manifest.yaml',
};

// --- Types ---
interface ProjectManifest {
    timestamp: string;
    config: {
        exists: boolean;
        snippet: string;
    };
    modules: string[];
    theme: {
        active: string;
        hasUserOverrides: boolean;
    };
    content: {
        pages: Record<string, string[]>; // dir -> [files]
        total_pages: number;
        structure: string[]; // Flat list of relative paths
    };
}

/**
 * Main Execution Function
 */
async function main() {
    console.log('🤖 [SENSORY SYSTEM] Initiating project scan...');
    const startTime = performance.now();

    try {
        // 1. Prepare Data
        const manifest = await buildManifest();

        // 2. Write Artifacts
        await ensureDirectory(PATHS.outputDir);
        await writeMarkdown(manifest);
        await writeYaml(manifest);

        const duration = (performance.now() - startTime).toFixed(2);
        console.log(`✅ [SENSORY SYSTEM] Context refreshed in ${duration}ms.`);
        console.log(`   📄 Human Readable: ${PATHS.outputMd}`);
        console.log(`   💾 Machine Data:   ${PATHS.outputYaml}`);

    } catch (error) {
        console.error('❌ [SENSORY SYSTEM] Critical Error:', error);
        process.exit(1);
    }
}

/**
 * Scans the filesystem to build the Project Manifest object.
 */
async function buildManifest(): Promise<ProjectManifest> {
    const manifest: ProjectManifest = {
        timestamp: new Date().toISOString(),
        config: { exists: false, snippet: '' },
        modules: [],
        theme: { active: 'unknown', hasUserOverrides: false },
        content: { pages: {}, total_pages: 0, structure: [] },
    };

    // --- 1. Active Configuration ---
    try {
        const configRaw = await fs.readFile(PATHS.config, 'utf-8');
        manifest.config.exists = true;
        // Heuristic: Capture the first 50 lines to give context without token overload
        const lines = configRaw.split('\n');
        manifest.config.snippet = lines.slice(0, 50).join('\n') + (lines.length > 50 ? '\n... (truncated)' : '');

        // Try to parse theme from config if simple YAML
        try {
            const parsed = yaml.load(configRaw) as any;
            manifest.theme.active = parsed?.ui?.theme || 'default';
        } catch { /* ignore parse errors for snippet extraction */ }

    } catch (e) {
        console.warn(`⚠️  Warning: Could not read ${PATHS.config}`);
    }

    // --- 2. Installed Modules ---
    try {
        const moduleFiles = await glob(`${PATHS.modulesDir}/*/module.yaml`);
        manifest.modules = moduleFiles.map(file => path.dirname(file).split(path.sep).pop() || 'unknown');
    } catch (e) {
        console.warn(`⚠️  Warning: Could not scan modules directory.`);
    }

    // --- 3. Content Structure ---
    try {
        const pageFiles = await glob(`${PATHS.pagesDir}/**/*.yaml`);
        manifest.content.total_pages = pageFiles.length;
        manifest.content.structure = pageFiles.map(p => path.relative(process.cwd(), p));

        // Group by directory for the human-readable report
        pageFiles.forEach(p => {
            const relPath = path.dirname(p).replace(PATHS.pagesDir, '') || '/root';
            const dir = relPath.startsWith('/') ? relPath : `/${relPath}`;

            if (!manifest.content.pages[dir]) {
                manifest.content.pages[dir] = [];
            }
            manifest.content.pages[dir].push(path.basename(p, '.yaml'));
        });
    } catch (e) {
        console.warn(`⚠️  Warning: Could not scan content directory.`);
    }

    // --- 4. Theme State ---
    try {
        await fs.access(PATHS.styleConfig);
        manifest.theme.hasUserOverrides = true;
    } catch {
        manifest.theme.hasUserOverrides = false;
    }

    return manifest;
}

/**
 * Generates and writes the `current_state.md` file.
 * This is optimized for an LLM to "read" quickly.
 */
async function writeMarkdown(manifest: ProjectManifest) {
    const lines: string[] = [];

    lines.push(`# 🤖 Project State Manifest`);
    lines.push(`> **Generated**: ${manifest.timestamp}`);
    lines.push(`> **Purpose**: Read this file to orient yourself. Do not edit manually.\n`);

    // Section 1: Configuration
    lines.push(`## 1. Active Configuration`);
    if (manifest.config.exists) {
        lines.push(`- **Source**: \`${PATHS.config}\``);
        lines.push(`- **Active Theme**: \`${manifest.theme.active}\``);
        lines.push('```yaml');
        lines.push(manifest.config.snippet);
        lines.push('```');
    } else {
        lines.push(`❌ **CRITICAL**: Configuration file missing at \`${PATHS.config}\``);
    }
    lines.push('');

    // Section 2: Modules
    lines.push(`## 2. Installed Modules`);
    if (manifest.modules.length === 0) {
        lines.push(`- *No external modules detected. Running in Core-only mode.*`);
    } else {
        manifest.modules.forEach(m => lines.push(`- **${m}**`));
    }
    lines.push('');

    // Section 3: Content Structure
    lines.push(`## 3. Content Structure`);
    lines.push(`- **Total Pages**: ${manifest.content.total_pages}`);
    lines.push(`- **User Overrides**: ${manifest.theme.hasUserOverrides ? '✅ Active (`content/style.yaml`)' : '❌ None'}`);
    lines.push('');
    lines.push(`### Page Hierarchy`);

    const sortedDirs = Object.keys(manifest.content.pages).sort();
    sortedDirs.forEach(dir => {
        const files = manifest.content.pages[dir].sort().join(', ');
        lines.push(`- **\`${dir}\`**: ${files}`);
    });

    await fs.writeFile(PATHS.outputMd, lines.join('\n'), 'utf-8');
}

/**
 * Generates and writes the `project_manifest.yaml` file.
 * This is optimized for scripts or agents to look up specific paths.
 */
async function writeYaml(manifest: ProjectManifest) {
    const yamlContent = yaml.dump(manifest);
    await fs.writeFile(PATHS.outputYaml, yamlContent, 'utf-8');
}

/**
 * Helper to ensure the output directory exists.
 */
async function ensureDirectory(dirPath: string) {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
        if ((error as any).code !== 'EEXIST') throw error;
    }
}

// Run the script
main();
