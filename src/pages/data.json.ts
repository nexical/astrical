/**
 * data.json.ts
 *
 * This is a static API route that generates a comprehensive JSON dump of all site data.
 * It provides a single endpoint that returns the complete site configuration, content,
 * and metadata in JSON format. This enables programmatic access to the entire site's
 * data structure for applications, APIs, and other services that need bulk data access.
 *
 * Features:
 * - Complete site data export in JSON format
 * - Static site generation with prerendering
 * - JSON content-type response headers
 *
 * Data Flow:
 * 1. generateSite() loads and processes all site data from YAML configuration
 * 2. GET() function returns JSON response with complete site data
 *
 * Component Integration:
 * - generateSite: Loads and processes all site data from YAML configuration
 *
 * Prerendering:
 * - prerender = true: Enables static site generation for better performance
 * - Complete site data is generated at build time for fast API responses
 *
 * Response Handling:
 * - Returns JSON stringified complete site data
 * - Sets content-type header to application/json;charset=UTF-8
 * - Uses UTF-8 encoding for proper international character support
 *
 * Usage Context:
 * - API endpoint for complete site data export
 * - Programmatic access to entire site content
 * - Integration with external applications and services
 * - Backup and migration functionality
 * - Headless CMS-like bulk data export
 */

import { generateSite } from '~/utils/generator';

/**
 * Enables static site generation for better performance.
 * Complete site data is generated at build time rather than on each request.
 */
export const prerender = true;

/**
 * Handles GET requests to return complete site data in JSON format.
 *
 * This function is called to generate the JSON response containing
 * all site data. It loads the complete site configuration, content,
 * and metadata, then returns it as JSON with proper headers.
 *
 * @returns Response object with complete site data and appropriate headers
 */
export async function GET() {
  return new Response(JSON.stringify(generateSite()), {
    headers: {
      'content-type': 'application/json;charset=UTF-8',
    },
  });
}
