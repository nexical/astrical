/**
 * plugins/config/utils/builder.ts
 *
 * This module provides configuration building functionality for the site-config plugin.
 * It processes raw configuration data from YAML files or objects and transforms it
 * into properly structured, typed configuration objects with sensible defaults.
 * The builder handles site metadata, internationalization, UI settings, and analytics
 * configuration while ensuring type safety and consistent structure.
 *
 * Features:
 * - Configuration object building with default value merging
 * - Type-safe configuration structures with TypeScript interfaces
 * - Default value handling for missing configuration properties
 * - Deep merging of configuration objects with lodash.merge
 * - Support for site, metadata, i18n, UI, and analytics configuration
 *
 * Component Integration:
 * - lodash.merge: Deep merging of configuration objects
 * - ~/types: Type definitions for metadata and configuration structures
 * - SiteConfig: Interface for site-level configuration
 * - MetaDataConfig: Interface for metadata configuration
 * - I18NConfig: Interface for internationalization configuration
 * - UIConfig: Interface for user interface configuration
 * - AnalyticsConfig: Interface for analytics configuration
 *
 * Data Flow:
 * 1. Receive raw configuration data (Config interface)
 * 2. Process each configuration section with dedicated getter functions
 * 3. Merge provided values with sensible defaults using lodash.merge
 * 4. Return structured configuration objects with proper typing
 * 5. Export main builder function for plugin integration
 *
 * Configuration Sections:
 * - SITE: Site identity, URLs, content directory, SEO settings
 * - METADATA: Default metadata for SEO, OpenGraph, Twitter cards
 * - I18N: Internationalization settings (language, text direction)
 * - UI: User interface configuration (theme selection)
 * - ANALYTICS: Analytics service configuration (Google Analytics, etc.)
 *
 * Default Value Strategy:
 * - Each configuration section has sensible defaults
 * - Provided values override defaults through deep merging
 * - Missing required values fall back to appropriate defaults
 * - Complex objects maintain structure while allowing partial overrides
 *
 * Usage Context:
 * - Site configuration processing in Astro build pipeline
 * - Default value generation for missing configuration properties
 * - Type-safe configuration object creation
 * - Plugin integration with Astro's virtual module system
 */

import merge from 'lodash.merge';

import type { MetaData } from '~/types';

/**
 * Config interface defines the structure for raw configuration input.
 * Represents the top-level configuration object that can be provided
 * through YAML files or programmatic configuration.
 *
 * @property site - Site-level configuration settings
 * @property metadata - Site metadata and SEO configuration
 * @property i18n - Internationalization configuration
 * @property ui - User interface configuration
 * @property analytics - Analytics service configuration
 */
export type Config = {
  site?: SiteConfig;
  metadata?: MetaDataConfig;
  i18n?: I18NConfig;
  ui?: unknown;
  analytics?: unknown;
};

/**
 * SiteConfig interface defines the structure for site-level configuration.
 * Contains settings related to site identity, URLs, content management,
 * and SEO verification.
 *
 * @property name - Site name/brand name for display and SEO
 * @property organization - Organization name for copyright and metadata
 * @property site - Canonical site URL for SEO and linking
 * @property announcement - Global announcement banner HTML content
 * @property base - Base path for site deployment (subdirectory support)
 * @property trailingSlash - Whether to enforce trailing slashes in URLs
 * @property contentDir - Path to content directory for YAML configurations
 * @property googleSiteVerificationId - Google Search Console verification token
 */
export interface SiteConfig {
  name: string;
  organization?: string;
  site?: string;
  announcement?: string;
  base?: string;
  trailingSlash?: boolean;
  contentDir: string;
  googleSiteVerificationId?: string;
}

/**
 * MetaDataConfig interface defines the structure for site metadata configuration.
 * Extends the base MetaData type while adding title template configuration.
 * Provides default values for SEO, OpenGraph, and Twitter card metadata.
 *
 * @property title - Title configuration with default and template
 * @property title.default - Default title when no page title is specified
 * @property title.template - Template for page titles (%s is replaced with page title)
 * @property description - Default site description for SEO and social sharing
 * @property robots - Default robots indexing settings for search engines
 * @property openGraph - Default OpenGraph metadata for social sharing
 * @property twitter - Default Twitter card metadata for social sharing
 */
export interface MetaDataConfig extends Omit<MetaData, 'title'> {
  title?: {
    default: string;
    template: string;
  };
}

/**
 * I18NConfig interface defines the structure for internationalization configuration.
 * Controls language, text direction, and date formatting for multilingual support.
 *
 * @property language - Primary language code (e.g., 'en', 'es', 'fr')
 * @property textDirection - Text direction ('ltr' for left-to-right, 'rtl' for right-to-left)
 * @property dateFormatter - Intl.DateTimeFormat instance for date formatting
 */
export interface I18NConfig {
  language: string;
  textDirection: string;
  dateFormatter?: Intl.DateTimeFormat;
}

/**
 * AnalyticsConfig interface defines the structure for analytics service configuration.
 * Controls integration with various analytics platforms and vendors.
 *
 * @property vendors - Configuration for different analytics vendors
 * @property vendors.googleAnalytics - Google Analytics configuration
 * @property vendors.googleAnalytics.id - Google Analytics measurement ID
 * @property vendors.googleAnalytics.partytown - Whether to use Partytown for GA
 */
export interface AnalyticsConfig {
  vendors: {
    googleAnalytics: {
      id?: string;
      partytown?: boolean;
    };
  };
}

/**
 * UIConfig interface defines the structure for user interface configuration.
 * Controls theme selection and UI behavior across the site.
 *
 * @property theme - Theme identifier for styling (e.g., 'default', 'dark:only')
 */
export interface UIConfig {
  theme: string;
}

// Default site name used when no site name is configured
const DEFAULT_SITE_NAME = 'Website';

/**
 * Processes and builds the SITE configuration object.
 * Merges provided site configuration with sensible defaults.
 *
 * @param config - Raw configuration object containing site settings
 * @returns Processed SiteConfig object with defaults applied
 */
const getSite = (config: Config) => {
  const _default = {
    name: DEFAULT_SITE_NAME,
    organization: undefined,
    site: undefined,
    announcement: '',
    base: '/',
    trailingSlash: false,
    contentDir: '',

    googleSiteVerificationId: '',
  };

  return merge({}, _default, config?.site ?? {}) as SiteConfig;
};

/**
 * Processes and builds the METADATA configuration object.
 * Merges provided metadata configuration with sensible defaults.
 * Uses site configuration for metadata default values when appropriate.
 *
 * @param config - Raw configuration object containing metadata settings
 * @returns Processed MetaDataConfig object with defaults applied
 */
const getMetadata = (config: Config) => {
  const siteConfig = getSite(config);

  const _default = {
    title: {
      default: siteConfig?.name || DEFAULT_SITE_NAME,
      template: '%s',
    },
    description: '',
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      type: 'website',
    },
  };

  return merge({}, _default, config?.metadata ?? {}) as MetaDataConfig;
};

/**
 * Processes and builds the I18N configuration object.
 * Merges provided internationalization configuration with sensible defaults.
 *
 * @param config - Raw configuration object containing i18n settings
 * @returns Processed I18NConfig object with defaults applied
 */
const getI18N = (config: Config) => {
  const _default = {
    language: 'en',
    textDirection: 'ltr',
  };

  const value = merge({}, _default, config?.i18n ?? {});

  return value as I18NConfig;
};

/**
 * Processes and builds the UI configuration object.
 * Merges provided UI configuration with sensible defaults.
 *
 * @param config - Raw configuration object containing UI settings
 * @returns Processed UIConfig object with defaults applied
 */
const getUI = (config: Config) => {
  const _default = {
    theme: 'default',
  };

  return merge({}, _default, config?.ui ?? {});
};

/**
 * Processes and builds the ANALYTICS configuration object.
 * Merges provided analytics configuration with sensible defaults.
 *
 * @param config - Raw configuration object containing analytics settings
 * @returns Processed AnalyticsConfig object with defaults applied
 */
const getAnalytics = (config: Config) => {
  const _default = {
    vendors: {
      googleAnalytics: {
        id: undefined,
        partytown: true,
      },
    },
  };

  return merge({}, _default, config?.analytics ?? {}) as AnalyticsConfig;
};

/**
 * Main configuration builder function that processes raw configuration data
 * and returns structured configuration objects for each section.
 *
 * This function serves as the entry point for the configuration building process.
 * It takes raw configuration input and transforms it into properly structured,
 * typed configuration objects with sensible defaults applied.
 *
 * @param config - Raw configuration object containing all configuration sections
 * @returns Object containing processed configuration objects for each section
 *
 * @example
 * // Build configuration from raw input
 * const config = buildConfig({
 *   site: { name: 'My Site' },
 *   metadata: { description: 'A great site' }
 * });
 *
 * // Returns structured configuration objects
 * // config.SITE, config.I18N, config.METADATA, config.UI, config.ANALYTICS
 */
export default (config: Config) => ({
  SITE: getSite(config),
  I18N: getI18N(config),
  METADATA: getMetadata(config),
  UI: getUI(config),
  ANALYTICS: getAnalytics(config),
});
