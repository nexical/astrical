/**
 * [...page].json.ts
 *
 * This is a dynamic API route that generates JSON data for all content pages.
 * It uses Astro's spread parameter syntax ([...page]) to capture all URL paths
 * and return structured JSON data based on the site's data configuration.
 * This enables programmatic access to page content for applications, APIs,
 * and other services that need structured data rather than HTML.
 *
 * Features:
 * - Dynamic route handling for all content page data
 * - Data-driven JSON generation from YAML configuration
 * - Static site generation with prerendering
 * - Automatic static path generation
 * - JSON content-type response headers
 *
 * Route Parameters:
 * - [...page]: Spread parameter capturing the full URL path
 *   - Enables handling of nested page structures (e.g., /about/team/john)
 *   - Maps directly to page slugs in the data configuration
 *
 * Data Flow:
 * 1. getStaticPaths() generates static paths for all available pages
 * 2. Astro.params extracts the page parameter from the URL
 * 3. generateLinks() creates list of all available page paths
 * 4. generateData() loads and processes page data from YAML configuration
 * 5. GET() function returns JSON response with page data
 *
 * Component Integration:
 * - generateLinks: Generates list of all available page paths
 * - generateData: Loads and processes page data from YAML configuration
 *
 * Static Path Generation:
 * - getStaticPaths(): Generates static paths at build time
 * - Maps each path to params object for Astro's static generation
 * - Enables pre-rendering of JSON data for better performance
 *
 * Prerendering:
 * - prerender = true: Enables static site generation for better performance
 * - JSON data is generated at build time for fast API responses
 *
 * Response Handling:
 * - Returns JSON stringified page data
 * - Sets content-type header to application/json;charset=UTF-8
 * - Uses UTF-8 encoding for proper international character support
 *
 * Usage Context:
 * - Dynamic API endpoint for page data
 * - Programmatic access to site content
 * - Integration with external applications and services
 * - Headless CMS-like functionality for content delivery
 */

import { generateLinks, generateData } from '~/utils/generator';

/**
 * Enables static site generation for better performance.
 * JSON data is generated at build time rather than on each request.
 */
export const prerender = true;

/**
 * Generates static paths for all available pages at build time.
 *
 * This function is called by Astro during the build process to determine
 * which page data endpoints should be pre-rendered as static JSON files.
 * It uses the generateLinks utility to create a list of all available
 * page paths from the site's data configuration.
 *
 * @returns Array of path objects with params for static generation
 */
export function getStaticPaths() {
  return generateLinks().map((path) => {
    return { params: { page: path } };
  });
}

/**
 * Handles GET requests to return JSON data for a specific page.
 *
 * This function is called for each dynamic route to generate the JSON
 * response containing the page data. It uses the page parameter from
 * the URL to load the appropriate content and return it as JSON.
 *
 * @param params - Object containing route parameters
 * @param params.page - The page slug extracted from the URL
 * @returns Response object with JSON data and appropriate headers
 */
export async function GET({ params }) {
  // Return a Response object with JSON data and proper content-type header
  return new Response(JSON.stringify(generateData(params.page)), {
    headers: {
      'content-type': 'application/json;charset=UTF-8',
    },
  });
}
