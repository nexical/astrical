/**
 * data.yaml.ts
 *
 * This is a static API route that generates a comprehensive YAML dump of all site data.
 * It provides a single endpoint that returns the complete site configuration, content,
 * and metadata in YAML format. This enables programmatic access to the entire site's
 * data structure for applications, APIs, and other services that need bulk data access
 * in YAML format.
 *
 * Features:
 * - Complete site data export in YAML format
 * - Static site generation with prerendering
 * - YAML content-type response headers
 *
 * Data Flow:
 * 1. generateSite() loads and processes all site data from YAML configuration
 * 2. GET() function returns YAML response with complete site data
 *
 * Component Integration:
 * - generateSite: Loads and processes all site data from YAML configuration
 * - yaml: js-yaml library for YAML serialization
 *
 * Prerendering:
 * - prerender = true: Enables static site generation for better performance
 * - Complete site data is generated at build time for fast API responses
 *
 * Response Handling:
 * - Returns YAML serialized complete site data using js-yaml library
 * - Sets content-type header to application/yaml;charset=UTF-8
 * - Uses UTF-8 encoding for proper international character support
 * - Sorts keys alphabetically for consistent output
 *
 * Usage Context:
 * - API endpoint for complete site data export in YAML format
 * - Programmatic access to entire site content in YAML
 * - Integration with external applications and services
 * - Configuration export and backup functionality
 * - Headless CMS-like bulk data export in YAML format
 */

import yaml from 'js-yaml';

import { generateSite } from '~/utils/generator';

/**
 * Enables static site generation for better performance.
 * Complete site data is generated at build time rather than on each request.
 */
export const prerender = true;

/**
 * Handles GET requests to return complete site data in YAML format.
 *
 * This function is called to generate the YAML response containing
 * all site data. It loads the complete site configuration, content,
 * and metadata, serializes it to YAML format, and returns it with
 * proper headers.
 *
 * @returns Response object with complete site data and appropriate headers
 */
export async function GET() {
  return new Response(yaml.dump(generateSite(), { sortKeys: true }), {
    headers: {
      'content-type': 'application/yaml;charset=UTF-8',
    },
  });
}
