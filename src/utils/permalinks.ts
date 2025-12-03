/**
 * src/utils/permalinks.ts
 *
 * This module provides utility functions for generating and managing permalinks
 * (permanent links) throughout the site. It handles URL construction, canonical
 * URL generation, and asset path resolution while respecting the site's base
 * path and trailing slash configuration.
 *
 * Features:
 * - Consistent permalink generation across the site
 * - Canonical URL construction with proper trailing slash handling
 * - Asset path resolution with base path support
 * - External URL detection and passthrough
 * - Trailing slash configuration compliance
 * - Base path (subdirectory) support for deployments
 *
 * Component Integration:
 * - SITE: Site configuration from astro:config for base path and URL settings
 * - trim: Internal utility for string trimming operations
 *
 * Data Flow:
 * 1. Load site configuration (base path, trailing slash settings, site URL)
 * 2. Process input paths through trimming and normalization functions
 * 3. Generate permalinks with proper base path and slash handling
 * 4. Construct canonical URLs with appropriate formatting
 * 5. Resolve asset paths relative to site base
 *
 * URL Construction:
 * - Base path is prepended to all generated URLs
 * - Trailing slashes are added/removed based on site configuration
 * - External URLs are passed through without modification
 * - Asset paths are resolved relative to site root
 *
 * Path Normalization:
 * - Leading/trailing slashes are trimmed for consistency
 * - Empty path segments are filtered out
 * - Paths are joined with proper separator handling
 *
 * Usage Context:
 * - Generating navigation links in components
 * - Creating canonical URLs for SEO metadata
 * - Resolving asset paths for images and other resources
 * - Building permalinks for dynamic content
 */

import { SITE } from 'site:config';

import { trim } from '~/utils/utils';

/**
 * Removes leading and trailing slashes from a string.
 *
 * Normalizes path segments by removing extraneous slashes that could
 * cause URL construction issues. This ensures consistent path joining.
 *
 * @param s - String to trim slashes from
 * @returns String with leading and trailing slashes removed
 */
export const trimSlash = (s: string) => trim(trim(s, '/'));

/**
 * Creates a normalized path from multiple path segments.
 *
 * Joins path segments with forward slashes while ensuring proper formatting
 * including trailing slash handling based on site configuration. Filters
 * out empty segments and normalizes slash placement.
 *
 * @param params - Path segments to join
 * @returns Normalized path string with proper slash handling
 */
const createPath = (...params: string[]) => {
  const paths = params
    .map((el) => trimSlash(el))
    .filter((el) => !!el)
    .join('/');
  return '/' + paths + (SITE.trailingSlash && paths ? '/' : '');
};

/**
 * Base pathname from site configuration for asset path resolution.
 *
 * Extracts the base path from site configuration for use in asset URL
 * construction. This supports deployments in subdirectories.
 */
const BASE_PATHNAME = SITE.base || '/';

/**
 * Generates a canonical URL for a given path.
 *
 * Constructs properly formatted canonical URLs that respect the site's
 * trailing slash configuration. Ensures consistency for SEO purposes
 * by normalizing URL format based on site settings.
 *
 * @param path - Path to generate canonical URL for (defaults to empty)
 * @returns String or URL object representing the canonical URL
 */
export const getCanonical = (path = ''): string | URL => {
  const url = String(new URL(path, SITE.site));
  if (SITE.trailingSlash == false && path && url.endsWith('/')) {
    return url.slice(0, -1);
  } else if (SITE.trailingSlash == true && path && !url.endsWith('/')) {
    return url + '/';
  }
  return url;
};

/**
 * Generates a permalink for a given slug and content type.
 *
 * Creates properly formatted permalinks that respect site configuration
 * including base path and trailing slash settings. Handles special URL
 * types (external, assets) appropriately.
 *
 * @param slug - Content identifier or URL path
 * @param type - Type of permalink to generate ('home', 'asset', 'page')
 * @returns Fully qualified permalink URL
 */
export const getPermalink = (slug = '', type = 'page'): string => {
  let permalink: string;

  // Pass through external URLs without modification
  if (
    slug.startsWith('https://') ||
    slug.startsWith('http://') ||
    slug.startsWith('://') ||
    slug.startsWith('#') ||
    slug.startsWith('javascript:')
  ) {
    return slug;
  }

  // Generate permalink based on content type
  switch (type) {
    case 'home':
      permalink = getHomePermalink();
      break;

    case 'asset':
      permalink = getAsset(slug);
      break;

    case 'page':
    default:
      permalink = createPath(slug);
      break;
  }

  return definitivePermalink(permalink);
};

/**
 * Generates the home page permalink.
 *
 * Provides a consistent way to reference the site's home page URL.
 *
 * @returns Home page permalink URL
 */
export const getHomePermalink = (): string => getPermalink('/');

/**
 * Generates an asset path URL.
 *
 * Constructs URLs for static assets (images, CSS, JS, etc.) relative
 * to the site's base path. Ensures assets are properly referenced
 * regardless of deployment location.
 *
 * @param path - Asset path relative to site root
 * @returns Fully qualified asset URL
 */
export const getAsset = (path: string): string =>
  '/' +
  [BASE_PATHNAME, path]
    .map((el) => trimSlash(el))
    .filter((el) => !!el)
    .join('/');

/**
 * Applies base path to a permalink for final URL construction.
 *
 * Ensures all permalinks include the site's configured base path
 * for proper URL resolution in subdirectory deployments.
 *
 * @param permalink - Permalink to apply base path to
 * @returns Permalink with base path applied
 */
const definitivePermalink = (permalink: string): string => createPath(BASE_PATHNAME, permalink);
