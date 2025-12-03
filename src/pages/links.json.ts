/**
 * links.json.ts
 *
 * This is a static API route that generates a JSON array of all available page links/paths
 * on the site. It provides a programmatic way to access the complete list of valid page
 * routes for navigation, sitemaps, or other applications that need to know all available
 * content paths.
 *
 * Features:
 * - Complete list of all page paths in JSON array format
 * - Static site generation with prerendering
 * - JSON content-type response headers
 *
 * Data Flow:
 * 1. generateLinks() creates list of all available page paths from site configuration
 * 2. GET() function returns JSON response with array of page paths
 *
 * Component Integration:
 * - generateLinks: Generates list of all available page paths from YAML configuration
 *
 * Prerendering:
 * - prerender = true: Enables static site generation for better performance
 * - Links data is generated at build time for fast API responses
 *
 * Response Handling:
 * - Returns JSON stringified array of page paths
 * - Sets content-type header to application/json;charset=UTF-8
 * - Uses UTF-8 encoding for proper international character support
 *
 * Usage Context:
 * - API endpoint for site navigation data
 * - Sitemap generation
 * - Programmatic access to all available page routes
 * - Integration with external applications and services
 * - Automated link checking and validation
 */

import { generateLinks } from '~/utils/generator';

/**
 * Enables static site generation for better performance.
 * Links data is generated at build time rather than on each request.
 */
export const prerender = true;

/**
 * Handles GET requests to return complete list of page links in JSON format.
 *
 * This function is called to generate the JSON response containing
 * all available page paths on the site. It loads the complete list
 * of valid routes and returns them as a JSON array with proper headers.
 *
 * @returns Response object with array of page paths and appropriate headers
 */
export async function GET() {
  return new Response(JSON.stringify(generateLinks()), {
    headers: {
      'content-type': 'application/json;charset=UTF-8',
    },
  });
}
