/**
 * src/utils/images.ts
 *
 * This module provides utilities for image handling and optimization in Astro projects.
 * It handles loading local images, resolving image paths, and adapting OpenGraph image
 * metadata for SEO purposes. The module integrates with Astro's asset system and
 * supports both local and remote image sources.
 *
 * Features:
 * - Dynamic loading of local image assets using import.meta.glob
 * - Path resolution for relative and absolute image references
 * - OpenGraph image metadata adaptation for SEO
 * - Integration with Astro's getImage utility for optimization
 * - Support for various image formats (jpeg, jpg, png, tiff, webp, gif, svg)
 *
 * Component Integration:
 * - Astro Assets: Built-in image processing and optimization
 * - import.meta.glob: Dynamic module loading for local images
 * - OpenGraph: SEO metadata handling from @astrolib/seo
 *
 * Data Flow:
 * 1. Load local images using import.meta.glob at startup
 * 2. Resolve image paths to actual image metadata objects
 * 3. Adapt OpenGraph image references to optimized URLs
 * 4. Generate optimized image variants for social sharing
 *
 * Image Loading:
 * - Uses import.meta.glob to discover image assets at build time
 * - Caches loaded images for performance optimization
 * - Supports common web image formats
 * - Handles error cases gracefully
 *
 * Path Resolution:
 * - Absolute URLs (http/https) passed through unchanged
 * - Relative paths passed through unchanged
 * - ~/assets/images paths resolved to local image metadata
 *
 * SEO Integration:
 * - Processes OpenGraph image metadata
 * - Generates optimized image variants for social sharing
 * - Ensures proper image dimensions for social platforms
 *
 * Usage Context:
 * - Image component source resolution
 * - SEO metadata generation for social sharing
 * - Local asset optimization and delivery
 * - Path normalization for image references
 */

import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import type { OpenGraph } from '@astrolib/seo';

/**
 * Asynchronously loads all local image assets from the assets/images directory.
 *
 * Uses import.meta.glob to dynamically discover and load image files at build time.
 * Supports common web image formats and handles errors gracefully.
 *
 * @returns Promise resolving to record of image import functions or undefined
 */
const load = async function () {
  let images: Record<string, () => Promise<unknown>> | undefined = undefined;
  try {
    images = import.meta.glob('~/assets/images/**/*.{jpeg,jpg,png,tiff,webp,gif,svg,JPEG,JPG,PNG,TIFF,WEBP,GIF,SVG}');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // continue regardless of error
  }
  return images;
};

// Cache for loaded images to avoid repeated loading
let _images: Record<string, () => Promise<unknown>> | undefined = undefined;

/**
 * Fetches and caches local image assets.
 *
 * Loads local images using the load function and caches the result for
 * performance optimization. Subsequent calls return the cached images.
 *
 * @returns Promise resolving to record of image import functions
 */
export const fetchLocalImages = async () => {
  _images = _images || (await load());
  return _images;
};

/**
 * Finds and resolves an image reference to actual image metadata.
 *
 * Takes an image path and resolves it to the appropriate image resource:
 * - Non-string values are returned as-is
 * - Absolute URLs are returned unchanged
 * - Relative paths are returned unchanged
 * - ~/assets/images paths are resolved to local image metadata
 *
 * @param imagePath - Image path string, ImageMetadata, or null/undefined
 * @returns Promise resolving to resolved image resource or null
 */
export const findImage = async (
  imagePath?: string | ImageMetadata | null
): Promise<string | ImageMetadata | undefined | null> => {
  // Not string - return as-is (ImageMetadata or null/undefined)
  if (typeof imagePath !== 'string') {
    return imagePath;
  }

  // Absolute paths - return unchanged
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('/')) {
    return imagePath;
  }

  // Relative paths or not "~/assets/" - return unchanged
  if (!imagePath.startsWith('~/assets/images')) {
    return imagePath;
  }

  // Resolve local image path to actual image metadata
  const images = await fetchLocalImages();
  const key = imagePath.replace('~/', '/src/');

  return images && typeof images[key] === 'function'
    ? ((await images[key]()) as { default: ImageMetadata })['default']
    : null;
};

/**
 * Adapts OpenGraph image metadata to use optimized image URLs.
 *
 * Takes OpenGraph metadata and processes the image references to generate
 * optimized image variants with proper URLs and dimensions. This ensures
 * that social sharing previews use correctly sized and formatted images.
 *
 * @param openGraph - OpenGraph metadata object
 * @param astroSite - Astro site URL for generating absolute image URLs
 * @returns Promise resolving to adapted OpenGraph metadata
 */
export const adaptOpenGraphImages = async (
  openGraph: OpenGraph = {},
  astroSite: URL | undefined
): Promise<OpenGraph> => {
  // No images to process - return as-is
  if (!openGraph?.images?.length) {
    return openGraph;
  }

  const images = openGraph.images;
  const defaultWidth = 1200;
  const defaultHeight = 626;

  // Process each image in the OpenGraph metadata
  const adaptedImages = await Promise.all(
    images.map(async (image) => {
      if (image?.url) {
        // Resolve the image reference to actual image metadata
        const resolvedImage = (await findImage(image.url)) as ImageMetadata | undefined;
        if (!resolvedImage) {
          return {
            url: '',
          };
        }

        // Generate optimized image variant with specified dimensions
        const _image = await getImage({
          src: resolvedImage,
          alt: 'Placeholder alt',
          width: image?.width || defaultWidth,
          height: image?.height || defaultHeight,
        });

        // Extract URL and dimensions from optimized image
        if (_image && typeof _image === 'object') {
          return {
            url: 'src' in _image && typeof _image.src === 'string' ? String(new URL(_image.src, astroSite)) : 'pepe',
            width: 'width' in _image && typeof _image.width === 'number' ? _image.width : undefined,
            height: 'height' in _image && typeof _image.height === 'number' ? _image.height : undefined,
          };
        }
        return {
          url: '',
        };
      }

      return {
        url: '',
      };
    })
  );

  // Return OpenGraph metadata with adapted images
  return { ...openGraph, ...(adaptedImages ? { images: adaptedImages } : {}) };
};
