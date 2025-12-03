/**
 * src/types/media.ts
 *
 * This file defines the TypeScript interfaces for media-related data structures
 * used throughout the site's content management system. These interfaces provide
 * type safety and documentation for handling images and videos in a flexible,
 * data-driven architecture where media configurations are defined in YAML files.
 *
 * The types support a comprehensive media system where:
 * - Images can be local assets or remote URLs with optimization support
 * - Videos can be various formats with type detection
 * - Media components integrate with responsive design and optimization
 *
 * Features:
 * - Type safety for media configuration files
 * - Comprehensive documentation for content authors
 * - Support for both local and remote media assets
 * - Integration with image optimization utilities
 * - Flexible video format handling
 *
 * Data Flow:
 * 1. YAML configuration files define media structures
 * 2. Media components consume typed media configurations
 * 3. Image optimization utilities process ImageMedia objects
 * 4. Video components handle VideoMedia playback configuration
 *
 * Usage Context:
 * - Data validation for YAML media configuration files
 * - Type definitions for media rendering components
 * - Integration with image optimization pipelines
 * - Content management system media handling
 */

import type { ImageMetadata } from 'astro';
import type { ImageProps } from '~/utils/images-optimization';

/**
 * ImageMedia interface defines the structure for image content in the site.
 * Extends the base ImageProps interface while providing flexibility for
 * both local Astro assets and remote image URLs. Supports responsive
 * image optimization and various layout options.
 *
 * @property src - Image source as either a string URL or Astro ImageMetadata object
 *                 for local assets. Enables optimization of both local and remote images.
 * @property alt - Alternative text for accessibility (required in ImageProps)
 * @property width - Image width for layout calculations (optional in ImageProps)
 * @property height - Image height for layout calculations (optional in ImageProps)
 * @property loading - Loading strategy ('eager' | 'lazy') (optional in ImageProps)
 * @property decoding - Image decoding strategy ('sync' | 'async' | 'auto') (optional in ImageProps)
 * @property href - Optional link URL for the image (optional in ImageProps)
 * @property target - Link target attribute (_blank, _self, etc.) (optional in ImageProps)
 * @property sizes - Responsive sizes attribute for different breakpoints (optional in ImageProps)
 * @property aspectRatio - Aspect ratio for responsive sizing (optional in ImageProps)
 * @property layout - Layout strategy ('fixed', 'constrained', 'fullWidth', 'cover', 'responsive', 'contained')
 * @property breakpoints - Array of breakpoint widths for responsive images (optional in ImageProps)
 * @property backgroundColor - Background color for image placeholders (optional in ImageProps)
 * @property formats - Array of image formats for optimization (optional in ImageProps)
 * @property placeholder - Placeholder strategy ('dominantColor', 'blurred', 'none', 'tracedSVG') (optional in ImageProps)
 */
export interface ImageMedia extends Omit<ImageProps, 'src'> {
  src: string | ImageMetadata;
}

/**
 * VideoMedia interface defines the structure for video content in the site.
 * Provides basic video source and type information for HTML5 video elements.
 * Supports various video formats and external video sources.
 *
 * @property src - Video source URL as a string. Can be local paths or remote URLs.
 *                 Supports various video hosting services and CDNs.
 * @property type - Optional MIME type for the video format. Helps browsers
 *                  determine video compatibility. Examples: 'video/mp4', 'video/webm', 'video/ogg'
 */
export interface VideoMedia {
  src: string;
  type?: string;
}
