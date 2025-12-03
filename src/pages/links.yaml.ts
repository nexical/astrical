/**
 * links.yaml.ts
 *
 * This is a static API route that generates a YAML array of all available page links/paths
 * on the site. It provides a programmatic way to access the complete list of valid page
 * routes for navigation, sitemaps, or other applications that need to know all available
 * content paths in YAML format.
 *
 * Features:
 * - Complete list of all page paths in YAML array format
 * - Static site generation with prerendering
 * - YAML content-type response headers
 *
 * Data Flow:
 * 1. generateLinks() creates list of all available page paths from site configuration
 * 2. GET() function returns YAML response with array of page paths
 *
 * Component Integration:
 * - generateLinks: Generates list of all available page paths from YAML configuration
 * - yaml: js-yaml library for YAML serialization
 *
 * Prerendering:
 * - prerender = true: Enables static site generation for better performance
 * - Links data is generated at build time for fast API responses
 *
 * Response Handling:
 * - Returns YAML serialized array of page paths using js-yaml library
 * - Sets content-type header to application/yaml;charset=UTF-8
 * - Uses UTF-8 encoding for proper international character support
 * - Sorts keys alphabetically for consistent output
 *
 * Usage Context:
 * - API endpoint for site navigation data in YAML format
 * - Sitemap generation in YAML format
 * - Programmatic access to all available page routes in YAML
 * - Integration with external applications and services
 * - Automated link checking and validation in YAML format
 */

import yaml from 'js-yaml';

import { generateLinks } from '~/utils/generator';

/**
 * Enables static site generation for better performance.
 * Links data is generated at build time rather than on each request.
 */
export const prerender = true;

/**
 * Handles GET requests to return complete list of page links in YAML format.
 *
 * This function is called to generate the YAML response containing
 * all available page paths on the site. It loads the complete list
 * of valid routes, serializes it to YAML format, and returns it with
 * proper headers.
 *
 * @returns Response object with array of page paths and appropriate headers
 */
export async function GET() {
  return new Response(yaml.dump(generateLinks(), { sortKeys: true }), {
    headers: {
      'content-type': 'application/yaml;charset=UTF-8',
    },
  });
}
