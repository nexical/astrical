/**
 * src/types.d.ts
 *
 * This file serves as the main type definition file for the site, providing
 * centralized TypeScript interfaces and type re-exports for the entire application.
 * It acts as a hub for type safety across the codebase by aggregating and
 * exposing commonly used interfaces from specialized type modules.
 *
 * Features:
 * - Centralized type definitions for the entire application
 * - Re-exports of commonly used interfaces from specialized modules
 * - Type safety for component loading and routing systems
 * - Integration with Astro's component factory system
 *
 * Type Re-exports:
 * - Page-related types from ~/types/page (MetaData, Page, Section)
 * - Form-related types from ~/types/form (Option, FormItem, BaseField)
 * - Media-related types from ~/types/media (ImageMedia, VideoMedia)
 * - Display-related types from ~/types/display (Item, CallToAction, Headline, Widget, TitledWidget)
 *
 * Component System Types:
 * - LoaderConfig: Defines the structure for dynamically loaded components
 * - RouterConfig: Defines the structure for route-based component configurations
 *
 * Integration Points:
 * - AstroComponentFactory: Astro's server-side component factory type
 * - Component loading utilities for dynamic component instantiation
 * - Router configuration for page-level component props
 *
 * Usage Context:
 * - Type checking for component loading and instantiation
 * - Route configuration and props management
 * - Data validation for YAML configuration files
 * - API response typing for JSON/YAML endpoints
 */

import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

// Re-export page-related types for centralized access
export type { MetaData, Page, Section } from '~/types/page';

// Re-export form-related types for centralized access
export type { Option, FormItem, BaseField } from '~/types/form';

// Re-export media-related types for centralized access
export type { ImageMedia, VideoMedia } from '~/types/media';

// Re-export display-related types for centralized access
export type { Item, CallToAction, Headline, Widget, TitledWidget } from '~/types/display';

/**
 * LoaderConfig interface defines the structure for dynamically loaded components.
 * Used by the component loading system to instantiate and configure components
 * based on YAML configuration data.
 *
 * @property name - Component name identifier for lookup and instantiation
 * @property type - Component type identifier for styling and behavior context
 * @property tag - Astro component factory function for component instantiation
 * @property props - Component properties object for configuration
 */
export interface LoaderConfig {
  name: string;
  type: string;
  tag: AstroComponentFactory;
  props: Record<string, unknown>;
}

/**
 * RouterConfig interface defines the structure for route-based component configurations.
 * Used by the routing system to manage page-level component props and configurations.
 *
 * @property name - Route name identifier for lookup and configuration
 * @property props - Route properties object containing component configurations
 */
export interface RouterConfig {
  name: string;
  props: Record<string, string | Array | unknown>;
}
