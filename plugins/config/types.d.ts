/**
 * plugins/config/types.d.ts
 *
 * This file provides TypeScript declaration merging for the Astro virtual module 'site:config'.
 * It declares the module interface that allows importing site configuration values directly
 * from 'site:config' throughout the Astro project. This enables type-safe access to site
 * configuration data with proper IntelliSense support.
 *
 * Features:
 * - TypeScript declaration merging for Astro virtual modules
 * - Type-safe access to site configuration values
 * - IntelliSense support for configuration properties
 * - Centralized configuration type definitions
 *
 * Module Integration:
 * - site:config virtual module for configuration access
 * - Config utility types from './config' file
 * - Astro's module resolution system
 *
 * Data Flow:
 * 1. Configuration data is loaded and processed by the site-config plugin
 * 2. This declaration file exposes the processed configuration types
 * 3. Components and utilities import configuration via 'site:config'
 * 4. TypeScript provides type checking and IntelliSense for imports
 *
 * Configuration Exports:
 * - SITE: Site-level configuration (name, organization, URLs, etc.)
 * - I18N: Internationalization configuration (language, text direction)
 * - METADATA: Site metadata (title templates, descriptions, SEO)
 * - UI: User interface configuration (theme, styling)
 * - ANALYTICS: Analytics configuration (Google Analytics, Tag Manager, etc.)
 *
 * Usage Context:
 * - Type-safe configuration access throughout the Astro project
 * - IntelliSense support in development environments
 * - Centralized configuration management
 * - Runtime configuration values for site functionality
 */

declare module 'site:config' {
  import type { SiteConfig, I18NConfig, MetaDataConfig, UIConfig, AnalyticsConfig } from './config';

  /**
   * SITE configuration object containing site-level settings.
   * Includes site identity, URLs, content directory, and SEO verification.
   *
   * @property name - Site name/brand name
   * @property organization - Organization name for copyright and metadata
   * @property site - Canonical site URL for SEO and linking
   * @property announcement - Global announcement banner HTML content
   * @property base - Base path for site deployment (subdirectory support)
   * @property trailingSlash - Whether to enforce trailing slashes in URLs
   * @property contentDir - Path to content directory for YAML configurations
   * @property googleSiteVerificationId - Google Search Console verification token
   */
  export const SITE: SiteConfig;

  /**
   * I18N configuration object containing internationalization settings.
   * Controls language, text direction, and date formatting for the site.
   *
   * @property language - Primary language code (e.g., 'en', 'es', 'fr')
   * @property textDirection - Text direction ('ltr' for left-to-right, 'rtl' for right-to-left)
   * @property dateFormatter - Intl.DateTimeFormat instance for date formatting
   */
  export const I18N: I18NConfig;

  /**
   * METADATA configuration object containing site-wide metadata settings.
   * Provides default values for SEO, OpenGraph, and Twitter card metadata.
   *
   * @property title - Default title configuration with template
   * @property description - Default site description for SEO
   * @property robots - Default robots indexing settings
   * @property openGraph - Default OpenGraph metadata settings
   * @property twitter - Default Twitter card metadata settings
   */
  export const METADATA: MetaDataConfig;

  /**
   * UI configuration object containing user interface settings.
   * Controls theme selection and UI behavior across the site.
   *
   * @property theme - Theme identifier for styling (e.g., 'default', 'dark:only')
   */
  export const UI: UIConfig;

  /**
   * ANALYTICS configuration object containing analytics service settings.
   * Controls integration with various analytics platforms and vendors.
   *
   * @property vendors - Configuration for different analytics vendors
   * @property vendors.googleAnalytics - Google Analytics configuration
   * @property vendors.googleAnalytics.id - Google Analytics measurement ID
   * @property vendors.googleAnalytics.partytown - Whether to use Partytown for GA
   * @property vendors.googleTagManager - Google Tag Manager configuration
   * @property vendors.googleTagManager.id - Google Tag Manager container ID
   * @property vendors.facebook - Facebook Pixel configuration
   * @property vendors.facebook.id - Facebook Pixel ID
   */
  export const ANALYTICS: AnalyticsConfig;
}
