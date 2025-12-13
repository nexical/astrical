/**
 * src/pages/[...build].yaml.ts
 *
 * This is a static API route that generates YAML data for all content pages found at build time.
 *
 * Features:
 * - Dynamic route handling for all content page data
 * - Data-driven YAML generation from YAML configuration
 * - Static site generation with prerendering enabled
 * - Automatic static path generation
 * - YAML content-type response headers
 */

import yaml from 'js-yaml';
import { generateLinks, generateData } from '~/utils/generator';

/**
 * Enables static site generation for better performance.
 * YAML data is generated at build time rather than on each request.
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
 * Handles GET requests to return YAML data for a specific page.
 */
export async function GET({ params }) {
  return new Response(yaml.dump(generateData(params.page), { sortKeys: true }), {
    headers: {
      'content-type': 'application/yaml;charset=UTF-8',
    },
  });
}
