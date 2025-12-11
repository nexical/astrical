/**
 * src/components.ts
 *
 * This module provides a dynamic component loading system for the site's UI components.
 * It automatically discovers and registers Astro components from specific directories
 * using Vite's import.meta.glob API, creating mappings that enable dynamic component
 * instantiation based on configuration data.
 *
 * Features:
 * - Automatic component discovery from filesystem
 * - Dynamic component registration for runtime instantiation
 * - Separation of components by type (widgets, forms, sections)
 * - Type-safe component factory mapping
 * - Support for eager loading of components
 *
 * Component Organization:
 * - Widgets: Reusable content blocks (Brands, CallToAction, Content, etc.)
 * - Forms: Form-related components (Form, field types, etc.)
 * - Sections: Layout containers (Header, Footer, SingleColumn, etc.)
 *
 * Data Flow:
 * 1. Uses import.meta.glob to discover Astro components in specific directories
 * 2. Processes discovered modules to create component name -> factory mappings
 * 3. Combines widget and form components into supportedTypes
 * 4. Registers section components separately as supportedLayouts
 * 5. Exposes mappings for dynamic component instantiation
 *
 * Component Loading System:
 * - createComponentMap: Utility function that processes glob results
 * - Extracts component name from file path
 * - Maps component name to Astro component factory function
 * - Handles eager loading for immediate availability
 *
 * Directory Structure Mapping:
 * - ~/components/widgets/{**}/*.astro -> supportedTypes (content components)
 * - ~/components/forms/{**}/*.astro -> supportedTypes (form components)
 * - ~/components/sections/{**}/*.astro -> supportedLayouts (layout components)
 *
 * Usage Context:
 * - Dynamic component instantiation in Section.astro
 * - Form field component generation in getFormField utility
 * - Widget component rendering in page sections
 * - Layout component selection for page sections
 *
 * Performance Considerations:
 * - Eager loading ensures components are available at runtime
 * - Single loading operation at module initialization
 * - Separation of layouts from content components for organization
 */

import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

/**
 * Creates a mapping of component names to Astro component factories.
 *
 * This utility function processes the results of import.meta.glob to create
 * a clean mapping between component names (derived from filenames) and
 * their corresponding Astro component factory functions.
 *
 * @param glob - Record of module paths to imported modules from import.meta.glob
 * @returns Record mapping component names to Astro component factories
 */
export function createComponentMap(glob: Record<string, unknown>) {
  const map: Record<string, AstroComponentFactory> = {};

  // Iterate through all discovered module paths
  for (const path in glob) {
    // Extract component name from file path (filename without extension)
    const componentName = path.split('/').pop()?.replace('.astro', '');

    // Only process valid component names
    if (componentName) {
      // Map component name to its default export (Astro component factory)
      map[componentName] = (glob[path] as { default: AstroComponentFactory }).default;
    }
  }

  return map;
}

// Discover and load all widget components using eager loading
// Includes components like Brands, CallToAction, Content, FAQs, Features, etc.
const widgetModules = import.meta.glob('~/components/widgets/**/*.astro', { eager: true });

// Discover and load all form components using eager loading
// Includes Form component and field types (Checkbox, Email, FileUpload, etc.)
const formModules = import.meta.glob('~/components/forms/**/*.astro', { eager: true });

// Discover and load all section components using eager loading
// Includes layout components like Header, Footer, SingleColumn, TwoColumn, etc.
const sectionModules = import.meta.glob('~/components/sections/**/*.astro', { eager: true });

// Discover and load all module components
const moduleWidgetModules = import.meta.glob('@modules/*/src/components/widgets/**/*.astro', { eager: true });
const moduleFormModules = import.meta.glob('@modules/*/src/components/forms/**/*.astro', { eager: true });
const moduleSectionModules = import.meta.glob('@modules/*/src/components/sections/**/*.astro', { eager: true });

/**
 * Supported component types mapping for dynamic instantiation.
 *
 * Combines widget and form components into a single mapping that can be
 * used to dynamically instantiate content and form components based on
 * configuration data. This mapping excludes section/layout components
 * which are handled separately.
 *
 * Component Categories:
 * - Widgets: Content display components (Brands, CallToAction, Content, FAQs, Features, Hero, etc.)
 * - Forms: Form-related components (Form, Checkbox, Email, FileUpload, LongText, Select, ShortText)
 */
export const supportedTypes: Record<string, AstroComponentFactory> = {
  ...createComponentMap(widgetModules),
  ...createComponentMap(formModules),
  ...createComponentMap(moduleWidgetModules),
  ...createComponentMap(moduleFormModules),
};

/**
 * Supported layout components mapping for dynamic instantiation.
 *
 * Separates section/layout components into their own mapping for organizational
 * purposes. These components serve as page section containers with specific
 * layout behaviors (Header, Footer, SingleColumn, TwoColumn, ThreeColumn).
 *
 * Layout Component Types:
 * - Header: Header section layout
 * - Footer: Footer section layout
 * - SingleColumn: Single column content layout
 * - TwoColumn: Two column content layout
 * - ThreeColumn: Three column content layout
 */
export const supportedLayouts: Record<string, AstroComponentFactory> = {
  ...createComponentMap(sectionModules),
  ...createComponentMap(moduleSectionModules),
};
