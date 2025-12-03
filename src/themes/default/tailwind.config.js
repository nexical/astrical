/**
 * src/themes/default/tailwind.config.js
 *
 * This file configures the Tailwind CSS framework for the default theme.
 * It extends the default Tailwind configuration with custom colors, fonts,
 * and other design tokens that align with the site's branding and design system.
 * The configuration uses CSS custom properties (variables) to enable easy
 * theme customization and dark mode support.
 *
 * Features:
 * - Custom color palette using CSS variables for theme consistency
 * - Font family configuration with fallbacks to default Tailwind fonts
 * - Dark mode support using the 'class' strategy
 * - Extension of default Tailwind theme rather than replacement
 *
 * Color System:
 * - primary: Main brand color for primary actions and highlights
 * - secondary: Supporting brand color for secondary elements
 * - accent: Accent color for decorative elements and highlights
 * - default: Default text color for primary content
 * - muted: Muted text color for secondary content and placeholders
 *
 * Font System:
 * - sans: Default sans-serif font stack with system font fallbacks
 * - serif: Default serif font stack with system font fallbacks
 * - heading: Specialized font stack for headings and titles
 *
 * CSS Variable Integration:
 * - All colors use CSS variables (var(--aw-color-*))
 * - Fonts use CSS variables with fallbacks (var(--aw-font-*, fallback))
 * - Enables runtime theme switching and customization
 *
 * Dark Mode Strategy:
 * - Uses 'class' strategy which toggles .dark class on html element
 * - Allows manual control of dark mode via JavaScript
 * - Supports system preference with manual override
 *
 * Plugin System:
 * - Empty plugins array ready for extension
 * - Can add Tailwind plugins for additional functionality
 *
 * Usage Context:
 * - Base Tailwind configuration for the default theme
 * - Referenced by the main tailwind.config.cjs file
 * - Extended by other theme configurations
 * - Used during build process for CSS generation
 */

import defaultTheme from 'tailwindcss/defaultTheme';

export default {
  /**
   * Theme extension configuration
   * Extends the default Tailwind theme with custom design tokens
   */
  theme: {
    extend: {
      /**
       * Custom color palette using CSS variables
       * These colors can be customized through CSS custom properties
       */
      colors: {
        /**
         * Primary brand color
         * Used for primary buttons, links, and key interactive elements
         */
        primary: 'var(--aw-color-primary)',

        /**
         * Secondary brand color
         * Used for secondary buttons and supporting UI elements
         */
        secondary: 'var(--aw-color-secondary)',

        /**
         * Accent color for decorative elements
         * Used for highlights, badges, and decorative accents
         */
        accent: 'var(--aw-color-accent)',

        /**
         * Default text color
         * Used for primary content and headings
         */
        default: 'var(--aw-color-text-default)',

        /**
         * Muted text color
         * Used for secondary text, placeholders, and disabled states
         */
        muted: 'var(--aw-color-text-muted)',
      },

      /**
       * Custom font family configuration
       * Uses CSS variables with Tailwind defaults as fallbacks
       */
      fontFamily: {
        /**
         * Sans-serif font stack
         * Used for body text and most UI elements
         * Falls back to Tailwind's default sans-serif stack
         */
        sans: ['var(--aw-font-sans, ui-sans-serif)', ...defaultTheme.fontFamily.sans],

        /**
         * Serif font stack
         * Used for editorial content and traditional typography
         * Falls back to Tailwind's default serif stack
         */
        serif: ['var(--aw-font-serif, ui-serif)', ...defaultTheme.fontFamily.serif],

        /**
         * Heading font stack
         * Used specifically for headings and titles
         * Falls back to Tailwind's default sans-serif stack
         */
        heading: ['var(--aw-font-heading, ui-sans-serif)', ...defaultTheme.fontFamily.sans],
      },
    },
  },

  /**
   * Tailwind plugins configuration
   * Empty array ready for adding custom plugins
   */
  plugins: [],

  /**
   * Dark mode configuration
   * Uses 'class' strategy to toggle dark mode via .dark class
   */
  darkMode: 'class',
};
