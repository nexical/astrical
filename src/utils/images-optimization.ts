/**
 * src/utils/images-optimization.ts
 *
 * This module provides comprehensive image optimization functionality for the site,
 * supporting both local Astro assets and remote image URLs. It handles responsive
 * image generation, format optimization, and various layout strategies while
 * integrating with Astro's built-in image processing and the unpic library for
 * external image optimization.
 *
 * Features:
 * - Responsive image optimization with automatic breakpoint generation
 * - Support for multiple image formats (WebP, etc.)
 * - Various layout strategies (fixed, constrained, fullWidth, cover, responsive, contained)
 * - Aspect ratio handling and automatic dimension calculation
 * - Integration with Astro assets and remote CDNs via unpic
 * - Style generation for proper image presentation
 * - Lazy loading and performance optimization
 *
 * Component Integration:
 * - Astro Assets: Built-in image optimization for local assets
 * - unpic: External image optimization for remote URLs
 * - getImage: Astro's image processing utility
 * - transformUrl: unpic's URL transformation utility
 * - parseUrl: unpic's URL parsing utility
 *
 * Data Flow:
 * 1. Receive image source and configuration props
 * 2. Determine image type (local asset or remote URL)
 * 3. Calculate appropriate dimensions and breakpoints
 * 4. Generate optimized image URLs for different resolutions
 * 5. Create responsive srcset and sizes attributes
 * 6. Generate appropriate styling based on layout strategy
 * 7. Return optimized image data for rendering
 *
 * Layout Strategies:
 * - fixed: Fixed dimensions with 1x/2x resolutions
 * - constrained: Max-width constrained with responsive breakpoints
 * - fullWidth: 100vw width with device-sized breakpoints
 * - cover: Full container coverage with object-fit
 * - responsive: Width-responsive with auto height
 * - contained: Contained within container with object-fit: contain
 *
 * Optimization Process:
 * - Local Assets: Processed through Astro's getImage utility
 * - Remote URLs: Processed through unpic's transformUrl utility
 * - Format Conversion: Automatic WebP generation when supported
 * - Breakpoint Generation: Device-appropriate resolution sets
 *
 * Usage Context:
 * - Image component optimization in UI components
 * - Responsive image handling throughout the site
 * - Performance optimization for page loading
 * - Cross-browser compatibility for image formats
 */

import { getImage } from 'astro:assets';
import { transformUrl, parseUrl } from 'unpic';

import type { ImageMetadata } from 'astro';
import type { HTMLAttributes } from 'astro/types';

/**
 * Layout type definitions for image presentation strategies.
 *
 * @property fixed - Fixed dimensions with no resizing
 * @property constrained - Max-width constrained with responsive behavior
 * @property fullWidth - 100vw width with responsive breakpoints
 * @property cover - Full container coverage with object-fit
 * @property responsive - Width-responsive with auto height
 * @property contained - Contained within container with object-fit: contain
 */
type Layout = 'fixed' | 'constrained' | 'fullWidth' | 'cover' | 'responsive' | 'contained';

/**
 * ImageProps interface defines the configuration options for image optimization.
 * Extends HTML img attributes while adding optimization-specific properties.
 *
 * @property href - Optional link URL for the image
 * @property target - Link target attribute (_blank, _self, etc.)
 * @property src - Image source (string URL, ImageMetadata, or null)
 * @property width - Image width in pixels (string or number)
 * @property height - Image height in pixels (string or number)
 * @property alt - Alternative text for accessibility (required)
 * @property loading - Loading strategy ('eager' or 'lazy')
 * @property decoding - Image decoding strategy ('sync', 'async', 'auto')
 * @property style - Custom CSS styles to apply
 * @property srcset - Custom srcset attribute for responsive images
 * @property sizes - Custom sizes attribute for responsive images
 * @property fetchpriority - Fetch priority hint ('high', 'low', 'auto')
 * @property layout - Layout strategy for image presentation
 * @property widths - Custom breakpoints for responsive images
 * @property aspectRatio - Aspect ratio for dimension calculation
 * @property objectPosition - CSS object-position value
 */
export interface ImageProps extends Omit<HTMLAttributes<'img'>, 'src'> {
  href?: string | null;
  target?: string | null;

  src?: string | ImageMetadata | null;
  width?: string | number | null;
  height?: string | number | null;
  alt?: string | null;
  loading?: 'eager' | 'lazy' | null;
  decoding?: 'sync' | 'async' | 'auto' | null;
  style?: string;
  srcset?: string | null;
  sizes?: string | null;
  fetchpriority?: 'high' | 'low' | 'auto' | null;

  layout?: Layout;
  widths?: number[] | null;
  aspectRatio?: string | number | null;
  objectPosition?: string;
  background?: string;
}

/**
 * ImagesOptimizer type defines the function signature for image optimization utilities.
 * Takes image source, breakpoints, and dimensions to generate optimized image URLs.
 *
 * @param image - Image source (ImageMetadata or string URL)
 * @param breakpoints - Array of width breakpoints for responsive images
 * @param width - Original image width for dimension calculation
 * @param height - Original image height for dimension calculation
 * @returns Promise resolving to array of optimized image objects
 */
export type ImagesOptimizer = (
  image: ImageMetadata | string,
  breakpoints: number[],
  width?: number,
  height?: number
) => Promise<Array<{ src: string; width: number }>>;

/**
 * Configuration constants for image optimization.
 * Defines standard image sizes, device breakpoints, and supported formats.
 */
const config = {
  // FIXME: Use this when image.width is minor than deviceSizes
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

  deviceSizes: [
    640, // older and lower-end phones
    750, // iPhone 6-8
    828, // iPhone XR/11
    960, // older horizontal phones
    1080, // iPhone 6-8 Plus
    1280, // 720p
    1668, // Various iPads
    1920, // 1080p
    2048, // QXGA
    2560, // WQXGA
    3200, // QHD+
    3840, // 4K
    4480, // 4.5K
    5120, // 5K
    6016, // 6K
  ],

  formats: ['image/webp'],
};

/**
 * Computes image height based on width and aspect ratio.
 *
 * @param width - Image width in pixels
 * @param aspectRatio - Width/height ratio
 * @returns Calculated height in pixels
 */
const computeHeight = (width: number, aspectRatio: number) => {
  return Math.floor(width / aspectRatio);
};

/**
 * Parses aspect ratio from various input formats.
 * Supports numeric values, "width:height" strings, and "width/height" strings.
 *
 * @param aspectRatio - Aspect ratio in various formats
 * @returns Parsed numeric aspect ratio or undefined
 */
const parseAspectRatio = (aspectRatio: number | string | null | undefined): number | undefined => {
  if (typeof aspectRatio === 'number') return aspectRatio;

  if (typeof aspectRatio === 'string') {
    const match = aspectRatio.match(/(\d+)\s*[/:]\s*(\d+)/);

    if (match) {
      const [, num, den] = match.map(Number);
      if (den && !isNaN(num)) return num / den;
    } else {
      const numericValue = parseFloat(aspectRatio);
      if (!isNaN(numericValue)) return numericValue;
    }
  }

  return undefined;
};

/**
 * Gets the `sizes` attribute for an image based on layout and width.
 * Provides responsive sizing hints for browser image selection.
 *
 * @param width - Image width in pixels
 * @param layout - Layout strategy for the image
 * @returns Appropriate sizes attribute string or undefined
 */
export const getSizes = (width?: number, layout?: Layout): string | undefined => {
  if (!width || !layout) {
    return undefined;
  }
  switch (layout) {
    // If screen is wider than the max size, image width is the max size,
    // otherwise it's the width of the screen
    case `constrained`:
      return `(min-width: ${width}px) ${width}px, 100vw`;

    // Image is always the same width, whatever the size of the screen
    case `fixed`:
      return `${width}px`;

    // Image is always the width of the screen
    case `fullWidth`:
      return `100vw`;

    default:
      return undefined;
  }
};

/**
 * Converts pixel values to CSS pixel strings.
 *
 * @param value - Numeric pixel value
 * @returns CSS pixel string or undefined
 */
const pixelate = (value?: number) => (value || value === 0 ? `${value}px` : undefined);

/**
 * Generates CSS styles for image presentation based on layout and dimensions.
 * Handles various layout strategies and positioning options.
 *
 * @param options - Style configuration options
 * @param options.width - Image width in pixels
 * @param options.height - Image height in pixels
 * @param options.aspectRatio - Width/height ratio
 * @param options.objectFit - CSS object-fit value
 * @param options.objectPosition - CSS object-position value
 * @param options.layout - Layout strategy
 * @param options.background - Background styling
 * @returns CSS style string for image presentation
 */
const getStyle = ({
  width,
  height,
  aspectRatio,
  objectFit = 'cover',
  objectPosition = 'center',
  layout,
  background,
}: {
  width?: number;
  height?: number;
  aspectRatio?: number;
  objectFit?: string;
  objectPosition?: string;
  layout?: string;
  background?: string;
}) => {
  const styleEntries: Array<[prop: string, value: string | undefined]> = [
    ['object-fit', objectFit],
    ['object-position', objectPosition],
  ];

  // If background is a URL, set it to cover the image and not repeat
  if (background?.startsWith('https:') || background?.startsWith('http:') || background?.startsWith('data:')) {
    styleEntries.push(['background-image', `url(${background})`]);
    styleEntries.push(['background-size', 'cover']);
    styleEntries.push(['background-repeat', 'no-repeat']);
  } else {
    styleEntries.push(['background', background]);
  }
  if (layout === 'fixed') {
    styleEntries.push(['width', pixelate(width)]);
    styleEntries.push(['height', pixelate(height)]);
    styleEntries.push(['object-position', 'top left']);
  }
  if (layout === 'constrained') {
    styleEntries.push(['max-width', pixelate(width)]);
    styleEntries.push(['max-height', pixelate(height)]);
    styleEntries.push(['aspect-ratio', aspectRatio ? `${aspectRatio}` : undefined]);
    styleEntries.push(['width', '100%']);
  }
  if (layout === 'fullWidth') {
    styleEntries.push(['width', '100%']);
    styleEntries.push(['aspect-ratio', aspectRatio ? `${aspectRatio}` : undefined]);
    styleEntries.push(['height', pixelate(height)]);
  }
  if (layout === 'responsive') {
    styleEntries.push(['width', '100%']);
    styleEntries.push(['height', 'auto']);
    styleEntries.push(['aspect-ratio', aspectRatio ? `${aspectRatio}` : undefined]);
  }
  if (layout === 'contained') {
    styleEntries.push(['max-width', '100%']);
    styleEntries.push(['max-height', '100%']);
    styleEntries.push(['object-fit', 'contain']);
    styleEntries.push(['aspect-ratio', aspectRatio ? `${aspectRatio}` : undefined]);
  }
  if (layout === 'cover') {
    styleEntries.push(['max-width', '100%']);
    styleEntries.push(['max-height', '100%']);
  }

  const styles = Object.fromEntries(styleEntries.filter(([, value]) => value));

  return Object.entries(styles)
    .map(([key, value]) => `${key}: ${value};`)
    .join(' ');
};

/**
 * Generates appropriate breakpoints based on layout strategy and image dimensions.
 * Creates resolution sets for responsive image optimization.
 *
 * @param options - Breakpoint generation options
 * @param options.width - Image width in pixels
 * @param options.breakpoints - Custom breakpoints to use
 * @param options.layout - Layout strategy
 * @returns Array of breakpoint widths
 */
const getBreakpoints = ({
  width,
  breakpoints,
  layout,
}: {
  width?: number;
  breakpoints: number[];
  layout: Layout;
}): number[] => {
  if (layout === 'fullWidth' || layout === 'cover' || layout === 'responsive' || layout === 'contained') {
    return breakpoints;
  }
  if (!width) {
    return [];
  }
  const doubleWidth = width * 2;
  if (layout === 'fixed') {
    return [width, doubleWidth];
  }
  if (layout === 'constrained') {
    return [
      // Always include the image at 1x and 2x the specified width
      width,
      doubleWidth,
      // Filter out any resolutions that are larger than the double-res image
      ...breakpoints.filter((w) => w < doubleWidth),
    ];
  }

  return [];
};

/**
 * Astro Assets optimizer for local image processing.
 * Uses Astro's built-in getImage utility to generate optimized images.
 *
 * @param image - Image source (ImageMetadata or string)
 * @param breakpoints - Array of width breakpoints
 * @param _width - Original image width (unused)
 * @param _height - Original image height (unused)
 * @returns Promise resolving to array of optimized image objects
 */
export const astroAssetsOptimizer: ImagesOptimizer = async (image, breakpoints, _width, _height) => {
  if (!image) {
    return [];
  }

  return Promise.all(
    breakpoints.map(async (w: number) => {
      const url = (await getImage({ src: image, width: w, inferSize: true })).src;
      return {
        src: url,
        width: w,
      };
    })
  );
};

/**
 * Checks if an image URL is compatible with unpic optimization.
 *
 * @param image - Image URL string
 * @returns Boolean indicating unpic compatibility
 */
export const isUnpicCompatible = (image: string) => {
  return typeof parseUrl(image) !== 'undefined';
};

/**
 * Unpic optimizer for remote image processing.
 * Uses unpic's transformUrl utility to generate optimized remote images.
 *
 * @param image - Image URL string
 * @param breakpoints - Array of width breakpoints
 * @param width - Original image width for dimension calculation
 * @param height - Original image height for dimension calculation
 * @returns Promise resolving to array of optimized image objects
 */
export const unpicOptimizer: ImagesOptimizer = async (image, breakpoints, width, height) => {
  if (!image || typeof image !== 'string') {
    return [];
  }

  const urlParsed = parseUrl(image);
  if (!urlParsed) {
    return [];
  }

  return Promise.all(
    breakpoints.map(async (w: number) => {
      const url =
        transformUrl({
          url: image,
          width: w,
          height: width && height ? computeHeight(w, width / height) : height,
          cdn: urlParsed.cdn,
        }) || image;
      return {
        src: String(url),
        width: w,
      };
    })
  );
};

/**
 * Main function for generating optimized image data.
 * Processes image source and configuration to create responsive image attributes.
 *
 * @param image - Image source (ImageMetadata or string)
 * @param props - Image configuration properties
 * @param transform - Image optimization function to use
 * @returns Promise resolving to optimized image data
 */
export async function getImagesOptimized(
  image: ImageMetadata | string,
  {
    href,
    target,
    src: _,
    width,
    height,
    sizes,
    aspectRatio,
    objectPosition,
    widths,
    layout = 'constrained',
    style = '',
    background,
    ...rest
  }: ImageProps,
  transform: ImagesOptimizer = () => Promise.resolve([])
): Promise<{
  src: string;
  attributes: HTMLAttributes<'img'>;
  href: string | undefined;
  target: string | undefined;
}> {
  if (typeof image !== 'string') {
    width ||= Number(image.width) || undefined;
    height ||= typeof width === 'number' ? computeHeight(width, image.width / image.height) : undefined;
  }

  width = (width && Number(width)) || undefined;
  height = (height && Number(height)) || undefined;

  widths ||= config.deviceSizes;
  sizes ||= getSizes(Number(width) || undefined, layout);
  aspectRatio = parseAspectRatio(aspectRatio);

  // Calculate dimensions from aspect ratio
  if (aspectRatio) {
    if (width) {
      if (height) {
        /* empty */
      } else {
        height = width / aspectRatio;
      }
    } else if (height) {
      width = Number(height * aspectRatio);
    } else if (layout !== 'fullWidth') {
      // Fullwidth images have 100% width, so aspectRatio is applicable
      console.error('When aspectRatio is set, either width or height must also be set');
      console.error('Image', image);
    }
  } else if (width && height) {
    aspectRatio = width / height;
  } else if (layout !== 'fullWidth') {
    // Fullwidth images don't need dimensions
    console.error('Either aspectRatio or both width and height must be set');
    console.error('Image', image);
  }

  let breakpoints = getBreakpoints({ width: width, breakpoints: widths, layout: layout });
  breakpoints = [...new Set(breakpoints)].sort((a, b) => a - b);

  const srcset = (await transform(image, breakpoints, Number(width) || undefined, Number(height) || undefined))
    .map(({ src, width }) => `${src} ${width}w`)
    .join(', ');

  return {
    src: typeof image === 'string' ? image : image.src,
    attributes: {
      width: width,
      height: height,
      srcset: srcset || undefined,
      sizes: sizes,
      style: `${getStyle({
        width: width,
        height: height,
        aspectRatio: aspectRatio,
        objectPosition: objectPosition,
        layout: layout,
        background: background,
      })}${style ?? ''}`,
      ...rest,
    },
    href: href || undefined,
    target: target || undefined,
  };
}
