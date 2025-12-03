/**
 * src/utils/router.ts
 *
 * This module provides routing utilities for the site's page generation and layout configuration.
 * It handles the enumeration of available routes for static site generation and extracts
 * page-specific layout configurations from YAML data files. The router integrates with
 * Astro's getStaticPaths functionality and provides metadata processing for page layouts.
 *
 * Features:
 * - Route enumeration for static site generation
 * - Page-specific layout configuration extraction
 * - Metadata processing and organization
 * - Integration with YAML data loading system
 * - Support for announcement, header, and footer customization
 *
 * Component Integration:
 * - getSpecs: Data loading utility for retrieving YAML configurations
 * - Page metadata from YAML files
 * - Astro's static site generation system
 *
 * Data Flow:
 * 1. Load page configurations from YAML data files
 * 2. Enumerate all available routes for static generation
 * 3. Extract page-specific layout configurations
 * 4. Process metadata to separate layout-specific properties
 * 5. Provide structured data for page rendering components
 *
 * Route Enumeration:
 * - Scans all page configurations from YAML files
 * - Creates route objects with name and props
 * - Integrates with Astro's getStaticPaths for dynamic routes
 *
 * Layout Configuration:
 * - Extracts announcement, header, and footer settings
 * - Processes page metadata for SEO and layout purposes
 * - Separates layout properties from general metadata
 * - Provides default values for missing configurations
 *
 * Usage Context:
 * - Static site generation route enumeration
 * - Page layout configuration processing
 * - Metadata organization for page components
 * - Dynamic route parameter generation
 */

import type { RouterConfig as Card } from '~/types';
import { getSpecs } from '~/utils/loader';

/**
 * Enumerates all available routes from page configurations.
 *
 * Scans the loaded page configurations and creates route objects
 * for each page. This is used by Astro's getStaticPaths to generate
 * static pages for all configured routes.
 *
 * @returns Array of route configuration objects containing page names and props
 */
export function routes(): Array<Card> {
  const pages = getSpecs('pages');
  const paths: Array<Card> = [];

  for (const path in pages) {
    const card: Card = {
      name: path,
      props: pages[path] as Record<string, unknown>,
    };
    paths.push(card);
  }
  return paths;
}

/**
 * Extracts and processes layout configuration for a specific page.
 *
 * Takes a page name and retrieves its metadata configuration, separating
 * layout-specific properties (announcement, header, footer) from general
 * metadata. This allows pages to customize their layout components
 * independently from SEO and content metadata.
 *
 * @param name - Page name/identifier to retrieve layout configuration for
 * @returns Object containing layout configuration properties
 */
export function getLayout(name: string | undefined): Record<string, unknown> {
  const props: Record<string, unknown> = {};

  if (name) {
    const loadCache = getSpecs('pages');

    if (Object.hasOwn(loadCache, name) && (loadCache[name] as Record<string, unknown>).metadata) {
      const metadata = (loadCache[name] as Record<string, unknown>).metadata as object;

      // Extract announcement configuration if present
      if (Object.hasOwn(metadata, 'announcement')) {
        props['announcement'] = metadata['announcement'];
        delete metadata['announcement'];
      }

      // Extract header configuration if present
      if (Object.hasOwn(metadata, 'header')) {
        props['header'] = metadata['header'];
        delete metadata['header'];
      }

      // Extract footer configuration if present
      if (Object.hasOwn(metadata, 'footer')) {
        props['footer'] = metadata['footer'];
        delete metadata['footer'];
      }

      // Store remaining metadata as general metadata
      props['metadata'] = Object.assign({}, metadata);
    }
  }
  return props;
}
