/**
 * plugins/config/index.ts
 *
 * This Astro integration plugin provides site configuration management by loading
 * configuration data from YAML files and exposing it as a virtual module ('site:config')
 * that can be imported throughout the Astro project. It also handles robots.txt updates
 * during the build process to include sitemap references.
 *
 * Features:
 * - Virtual module creation for site configuration access
 * - YAML configuration file loading and parsing
 * - Configuration building with default value merging
 * - Robots.txt sitemap integration during build
 * - File watching for configuration hot-reloading
 * - Type-safe configuration access through virtual modules
 *
 * Component Integration:
 * - Astro Integration API for hook registration
 * - Vite plugin system for virtual module creation
 * - fs: Node.js file system for robots.txt manipulation
 * - os: Node.js OS module for platform-appropriate line endings
 * - path: Node.js path utilities for file path manipulation
 * - loadConfig: Configuration file loading utility
 * - buildConfig: Configuration object building utility
 *
 * Data Flow:
 * 1. Plugin initializes during Astro config setup
 * 2. Loads configuration from specified YAML file
 * 3. Builds structured configuration objects with defaults
 * 4. Creates virtual module for configuration access
 * 5. Adds configuration file to watch list for hot-reloading
 * 6. Updates robots.txt during build to include sitemap reference
 *
 * Virtual Module System:
 * - Creates 'site:config' virtual module
 * - Exposes SITE, I18N, METADATA, UI, ANALYTICS configuration objects
 * - Uses Vite's resolveId and load hooks for module creation
 * - Provides type-safe configuration access throughout project
 *
 * Build Process Integration:
 * - Updates robots.txt with sitemap reference during build
 * - Checks for @astrojs/sitemap integration presence
 * - Appends or updates Sitemap directive in robots.txt
 * - Handles file system operations with error tolerance
 *
 * File Watching:
 * - Watches configuration file for changes
 * - Triggers hot-reloading when configuration changes
 * - Integrates with Astro's file watching system
 *
 * Usage Context:
 * - Site configuration management for Astro projects
 * - Centralized configuration access through imports
 * - Build-time robots.txt optimization
 * - Development-time configuration hot-reloading
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'path';
import type { AstroConfig, AstroIntegration } from 'astro';

import buildConfig, { type Config } from './utils/builder';
import { loadConfig } from './utils/loader';
import { scanContent } from '../../src/utils/content-scanner';

/**
 * Extracts the directory path from a file path.
 *
 * Takes a full file path and returns the directory portion,
 * handling both absolute and relative paths appropriately.
 * Used to determine content directory for configuration files.
 *
 * @param rootDir - Root directory for path resolution
 * @param filePath - File path to extract directory from
 * @returns Directory path portion of the file path
 */
function getContentPath(rootDir: string, filePath: string): string {
  const lastSlashIndex = filePath.lastIndexOf('/');
  if (lastSlashIndex === -1) {
    return rootDir;
  }
  return path.join(rootDir, filePath.substring(0, lastSlashIndex));
}

/**
 * Creates an Astro integration for site configuration management.
 *
 * This function returns an AstroIntegration object that handles site configuration
 * loading, virtual module creation, and build-time optimizations. It integrates
 * with Astro's lifecycle hooks to provide configuration management throughout
 * the development and build processes.
 *
 * @param options - Configuration options for the integration
 * @param options.config - Path to configuration file (defaults to 'content/config.yaml')
 * @returns AstroIntegration object for site configuration management
 */
export default ({ config: _themeConfig = 'content/config.yaml' } = {}): AstroIntegration => {
  // Store Astro configuration for build hook access
  let cfg: AstroConfig;

  return {
    name: 'site-config',
    hooks: {
      /**
       * Astro config setup hook.
       *
       * Called during Astro configuration initialization to set up the integration.
       * Loads configuration files, creates virtual modules, and sets up file watching.
       *
       * @param params - Hook parameters from Astro
       * @param params.config - Current Astro configuration
       * @param params.logger - Astro logger for informational messages
       * @param params.updateConfig - Function to update Astro configuration
       * @param params.addWatchFile - Function to add files to Astro's watch system
       */
      'astro:config:setup': async ({ config, logger, updateConfig, addWatchFile }) => {
        // Create logger for integration messages
        const buildLogger = logger.fork('site-config');

        // Virtual module identifiers for configuration access
        const virtualModuleId = 'site:config';
        const resolvedVirtualModuleId = '\0' + virtualModuleId;

        // Load raw configuration from file or object
        const rawJsonConfig = (await loadConfig(_themeConfig)) as Config;

        // Build structured configuration objects with defaults
        const { SITE, I18N, METADATA, UI, ANALYTICS, FORM_HANDLERS } = buildConfig(rawJsonConfig);

        // Set content directory based on configuration file location
        SITE.contentDir = getContentPath(config.root.pathname, _themeConfig);

        // Scan ALL content at build time to find forms and their handlers
        // We use the same content scanning logic that the loader uses runtime
        // This effectively bundles the form configurations (recipients, etc.)
        const content = scanContent(SITE.contentDir);
        const forms = content['forms'] as Record<string, { handlers?: Record<string, unknown> }>;

        // Extract just the handler configurations for each form
        // Map<FormName, { handlers: { ... } }>
        const FORMS: Record<string, { handlers: Record<string, unknown> }> = {};
        for (const [formName, formDef] of Object.entries(forms)) {
          if (formDef.handlers) {
            FORMS[formName] = { handlers: formDef.handlers };
          }
        }

        // Update Astro configuration with site settings
        updateConfig({
          // Set site URL from configuration
          site: SITE.site,

          // Set base path from configuration
          base: SITE.base,

          // Set trailing slash behavior from configuration
          trailingSlash: SITE.trailingSlash ? 'always' : 'never',

          // Configure Vite with virtual module plugin
          vite: {
            plugins: [
              {
                name: 'vite-plugin-site_config',

                /**
                 * Vite resolveId hook for virtual module resolution.
                 *
                 * Intercepts imports of 'site:config' and resolves them
                 * to the virtual module identifier.
                 *
                 * @param id - Module identifier being resolved
                 * @returns Resolved virtual module identifier or undefined
                 */
                resolveId(id) {
                  if (id === virtualModuleId) {
                    return resolvedVirtualModuleId;
                  }
                },

                /**
                 * Vite load hook for virtual module content generation.
                 *
                 * Generates JavaScript code that exports the configuration
                 * objects as module exports when the virtual module is imported.
                 *
                 * @param id - Module identifier being loaded
                 * @returns JavaScript code for module exports or undefined
                 */
                load(id) {
                  if (id === resolvedVirtualModuleId) {
                    return `
                    export const SITE = ${JSON.stringify(SITE)};
                    export const I18N = ${JSON.stringify(I18N)};
                    export const METADATA = ${JSON.stringify(METADATA)};
                    export const UI = ${JSON.stringify(UI)};
                    export const ANALYTICS = ${JSON.stringify(ANALYTICS)};
                    export const FORM_HANDLERS = ${JSON.stringify(FORM_HANDLERS)};
                    export const FORMS = ${JSON.stringify(FORMS)};
                    `;
                  }
                },
              },
            ],
          },
        });

        // Add configuration file to Astro's watch system for hot-reloading
        addWatchFile(new URL(_themeConfig, config.root));

        // Log successful configuration loading
        buildLogger.info(`Site configuration \`${_themeConfig}\` has been loaded.`);
      },

      /**
       * Astro config done hook.
       *
       * Called after Astro configuration is complete to store
       * the final configuration for use in build hooks.
       *
       * @param params - Hook parameters from Astro
       * @param params.config - Final Astro configuration
       */
      'astro:config:done': async ({ config }) => {
        cfg = config;
      },

      /**
       * Astro build done hook.
       *
       * Called after Astro build is complete to perform post-build
       * optimizations such as updating robots.txt with sitemap references.
       *
       * @param params - Hook parameters from Astro
       * @param params.logger - Astro logger for informational messages
       */
      'astro:build:done': async ({ logger }) => {
        // Create logger for integration messages
        const buildLogger = logger.fork('site-config');

        // Log robots.txt update process
        buildLogger.info('Updating `robots.txt` with `sitemap-index.xml` ...');

        try {
          // Determine file paths for robots.txt and sitemap
          const outDir = cfg.outDir;
          const publicDir = cfg.publicDir;
          const sitemapName = 'sitemap-index.xml';
          const sitemapFile = new URL(sitemapName, outDir);
          const robotsTxtFile = new URL('robots.txt', publicDir);
          const robotsTxtFileInOut = new URL('robots.txt', outDir);

          // Check if sitemap integration is present and sitemap exists
          const hasIntegration =
            Array.isArray(cfg?.integrations) &&
            cfg.integrations?.find((e) => e?.name === '@astrojs/sitemap') !== undefined;
          const sitemapExists = fs.existsSync(sitemapFile);

          // Update robots.txt with sitemap reference if conditions are met
          if (hasIntegration && sitemapExists) {
            // Read existing robots.txt content
            const robotsTxt = fs.readFileSync(robotsTxtFile, { encoding: 'utf8', flag: 'a+' });

            // Construct full sitemap URL
            const sitemapUrl = new URL(sitemapName, String(new URL(cfg.base, cfg.site)));

            // Regular expression to match existing Sitemap directive
            const pattern = /^Sitemap:(.*)$/m;

            // Add or update Sitemap directive in robots.txt
            if (!pattern.test(robotsTxt)) {
              // Append new Sitemap directive
              fs.writeFileSync(robotsTxtFileInOut, `${robotsTxt}${os.EOL}${os.EOL}Sitemap: ${sitemapUrl}`, {
                encoding: 'utf8',
                flag: 'w',
              });
            } else {
              // Update existing Sitemap directive
              fs.writeFileSync(robotsTxtFileInOut, robotsTxt.replace(pattern, `Sitemap: ${sitemapUrl}`), {
                encoding: 'utf8',
                flag: 'w',
              });
            }
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          // Continue regardless of error (silent failure)
          /* empty */
        }
      },
    },
  };
};
