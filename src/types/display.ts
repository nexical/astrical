/**
 * src/types/display.ts
 *
 * This file defines the TypeScript interfaces for display-related data structures
 * used throughout the site's UI components. These interfaces provide type safety
 * and documentation for the data-driven component architecture where content
 * configurations are defined in YAML data files.
 *
 * The types support a flexible component system where:
 * - Items represent feature lists, FAQ entries, or other categorized content
 * - CallToAction provides consistent button/link configuration
 * - Headline standardizes title/subtitle structures
 * - Widget provides base structure for all display components
 * - TitledWidget extends Widget with headline capabilities
 *
 * Features:
 * - Type safety for component configuration files
 * - Comprehensive documentation for content authors
 * - Support for various display component types
 * - Flexible styling through CSS class configuration
 * - Integration with image and media handling
 *
 * Data Flow:
 * 1. YAML configuration files define component structures
 * 2. UI components consume typed configuration data
 * 3. Widget wrappers provide consistent styling containers
 * 4. Headline components render title hierarchies
 * 5. CallToAction components handle user interactions
 *
 * Usage Context:
 * - Data validation for YAML configuration files
 * - Type definitions for UI rendering components
 * - API response typing for JSON/YAML endpoints
 * - Content management system integration
 */

import type { HTMLAttributes } from 'astro/types';
import type { ImageMedia } from '~/types/media';

/**
 * Item interface defines the structure for feature list items, FAQ entries,
 * or other categorized content blocks. Provides flexible content with
 * optional icons, images, and call-to-action buttons.
 *
 * @property title - Main heading or title for the item
 * @property subtitle - Secondary heading or subtitle for the item
 * @property description - Detailed description or content text
 * @property icon - Icon identifier for visual representation
 * @property classes - Custom CSS classes for per-item styling
 * @property callToAction - Optional call-to-action button/link configuration
 * @property image - Optional image media for visual content
 */
export interface Item {
  title?: string;
  subtitle?: string;
  description?: string;
  icon?: string;
  classes?: Record<string, string>;
  callToAction?: CallToAction;
  image?: ImageMedia;
}

/**
 * CallToAction interface defines the structure for button and link components.
 * Extends HTML anchor attributes while providing styling and behavior options.
 * Used for primary actions, secondary links, and navigation elements.
 *
 * @property variant - Visual styling variant ('primary', 'secondary', 'tertiary', 'link')
 * @property text - Display text for the button/link
 * @property icon - Optional icon identifier for visual enhancement
 * @property classes - Custom CSS classes for styling override
 * @property type - Button type attribute ('button', 'submit', 'reset')
 * @property value - Button value attribute for form submission
 */
export interface CallToAction extends Omit<HTMLAttributes<'a'>, 'slot'> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'link';
  text?: string;
  icon?: string;
  classes?: Record<string, string>;
  type?: 'button' | 'submit' | 'reset';
  value?: string;
}

/**
 * Headline interface defines the structure for title/subtitle content blocks.
 * Provides consistent hierarchical content presentation across components.
 *
 * @property type - Component type identifier for styling context
 * @property title - Main heading content (can contain HTML)
 * @property subtitle - Supporting subtitle content (can contain HTML)
 * @property tagline - Smaller tagline content above the title
 * @property classes - Custom CSS classes for styling configuration
 */
export interface Headline {
  type: string;
  title?: string;
  subtitle?: string;
  tagline?: string;
  classes?: Record<string, string>;
}

/**
 * Widget interface defines the base structure for all display components.
 * Provides consistent container structure with background and styling options.
 *
 * @property type - Component type identifier for styling and semantic context
 * @property id - Optional HTML id attribute for the container element
 * @property bg - Optional background image URL for visual context
 * @property classes - Custom CSS classes for styling configuration (can be nested)
 */
export interface Widget {
  type: string;
  id?: string;
  bg?: string;
  classes?: Record<string, string | Record<string, string>>;
}

/**
 * TitledWidget interface extends Widget with headline capabilities.
 * Combines widget container structure with title/subtitle content.
 * Omitting 'classes' and 'type' from Headline to avoid conflicts with Widget.
 *
 * @property title - Main heading content (can contain HTML)
 * @property subtitle - Supporting subtitle content (can contain HTML)
 * @property tagline - Smaller tagline content above the title
 * @property type - Component type identifier for styling and semantic context
 * @property id - Optional HTML id attribute for the container element
 * @property bg - Optional background image URL for visual context
 * @property classes - Custom CSS classes for styling configuration (can be nested)
 */
export interface TitledWidget extends Omit<Headline, 'classes' | 'type'>, Widget {}
