/**
 * src/types/page.ts
 *
 * This file defines the TypeScript interfaces for page and section data structures
 * used throughout the site. These interfaces provide type safety and documentation
 * for the data-driven architecture where content is defined in YAML configuration files.
 *
 * The types support a hierarchical structure where:
 * - Site contains multiple Pages
 * - Each Page contains multiple Sections
 * - Each Section contains Components
 * - Metadata provides SEO and page configuration
 *
 * Features:
 * - Type safety for data configuration files
 * - Comprehensive documentation for content authors
 * - Support for SEO metadata and social sharing
 * - Flexible section and component architecture
 * - Themeable styling through CSS class configuration
 *
 * Data Flow:
 * 1. YAML configuration files define site structure
 * 2. Loader utilities parse and validate configuration data
 * 3. Page components consume typed data structures
 * 4. Section components render based on layout and component data
 *
 * Usage Context:
 * - Data validation for YAML configuration files
 * - Type definitions for page rendering components
 * - API response typing for JSON/YAML endpoints
 * - Content management system integration
 */

/**
 * MetaDataRobots interface defines search engine indexing configuration.
 * Controls how search engines should crawl and index the page.
 *
 * @property index - Whether search engines should index the page (defaults to true)
 * @property follow - Whether search engines should follow links on the page (defaults to true)
 */
export interface MetaDataRobots {
  index?: boolean;
  follow?: boolean;
}

/**
 * MetaDataImage interface defines image metadata for social sharing.
 * Used for OpenGraph and Twitter card images to provide visual context.
 *
 * @property url - Absolute URL to the image file
 * @property width - Image width in pixels (optional but recommended)
 * @property height - Image height in pixels (optional but recommended)
 */
export interface MetaDataImage {
  url: string;
  width?: number;
  height?: number;
}

/**
 * MetaDataOpenGraph interface defines OpenGraph metadata for social sharing.
 * Controls how content appears when shared on Facebook, LinkedIn, and other platforms.
 *
 * @property url - Canonical URL of the page
 * @property siteName - Name of the website
 * @property images - Array of image metadata for sharing previews
 * @property locale - Language and locale of the content (e.g., 'en_US')
 * @property type - Type of content (e.g., 'website', 'article')
 */
export interface MetaDataOpenGraph {
  url?: string;
  siteName?: string;
  images?: Array<MetaDataImage>;
  locale?: string;
  type?: string;
}

/**
 * MetaDataTwitter interface defines Twitter card metadata for social sharing.
 * Controls how content appears when shared on Twitter.
 *
 * @property handle - Twitter username of the content creator
 * @property site - Twitter username of the website
 * @property cardType - Type of Twitter card ('summary', 'summary_large_image', etc.)
 */
export interface MetaDataTwitter {
  handle?: string;
  site?: string;
  cardType?: string;
}

/**
 * MetaData interface defines common metadata for SEO and social sharing.
 * Provides comprehensive metadata configuration for individual pages.
 *
 * @property title - Page title (overrides site default)
 * @property ignoreTitleTemplate - Whether to ignore the title template (default: false)
 * @property canonical - Canonical URL for the page (auto-generated if not provided)
 * @property robots - Robot indexing configuration (index/follow settings)
 * @property description - Page description for SEO and social sharing
 * @property openGraph - OpenGraph metadata for social sharing
 * @property twitter - Twitter card metadata for social sharing
 */
export interface MetaData {
  title?: string;
  ignoreTitleTemplate?: boolean;

  canonical?: string;

  robots?: MetaDataRobots;

  description?: string;

  openGraph?: MetaDataOpenGraph;
  twitter?: MetaDataTwitter;
}

/**
 * PageMetaData interface defines page-specific metadata configuration.
 * Controls header, footer, and announcement content for individual pages.
 *
 * @property title - Page title override
 * @property description - Page description override
 * @property announcement - Announcement banner configuration
 * @property header - Header navigation configuration
 * @property footer - Footer navigation configuration
 */
export interface PageMetaData {
  title?: string;
  description?: string;
  announcement?: Record<string, unknown>;
  header?: Record<string, unknown>;
  footer?: Record<string, unknown>;
}

/**
 * Page interface defines the structure of a complete page.
 * Represents a single URL path with its content sections and metadata.
 *
 * @property metadata - Page-specific metadata configuration
 * @property sections - Array of content sections in display order
 */
export interface Page {
  metadata: PageMetaData;
  sections: Array<Section>;
}

/**
 * Section interface defines the structure of a page content section.
 * Represents a distinct content area within a page with configurable layout.
 *
 * @property layout - Layout component identifier (e.g., 'SingleColumn', 'TwoColumn')
 * @property id - Optional HTML id attribute for anchor linking
 * @property bg - Optional background image URL
 * @property classes - Optional CSS class configuration object for styling
 * @property components - Component configuration mapping by area (e.g., 'main', 'left', 'right')
 */
export interface Section {
  layout: string;
  id?: string;
  bg?: string;
  classes?: Record<string, string>;
  components: Record<string, Array<Record<string, unknown>>>;
}
