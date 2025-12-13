/**
 * src/pages/[...build].json.ts
 *
 * This is a static API route that generates JSON data for all content pages found at build time.
 *
 * Features:
 * - Dynamic route handling for all content page data
 * - Data-driven JSON generation from YAML configuration
 * - Static site generation with prerendering enabled
 * - Automatic static path generation
 * - JSON content-type response headers
 */

import { generateLinks, generateData } from '~/utils/generator';

/**
 * Enables static site generation for better performance.
 * JSON data is generated at build time rather than on each request.
 */
export const prerender = true;

/**
 * Generates static paths for all available pages at build time.
 */
export function getStaticPaths() {
  return generateLinks().map((path) => {
    return { params: { page: path } };
  });
}

/**
 * Handles GET requests to return JSON data for a specific page.
 */
export async function GET({ params }) {
  // Return a Response object with JSON data and proper content-type header
  return new Response(JSON.stringify(generateData(params.page)), {
    headers: {
      'content-type': 'application/json;charset=UTF-8',
    },
  });
}
