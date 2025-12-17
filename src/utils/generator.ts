/**
 * src/utils/generator.ts
 *
 * This module provides utility functions for generating and processing various
 * site components, menus, forms, and data structures. It serves as a central
 * hub for data transformation and component instantiation based on the site's
 * YAML configuration files.
 *
 * Features:
 * - Menu generation from YAML configuration data
 * - Component instantiation from type definitions
 * - Form field generation with proper naming conventions
 * - Page link generation for static site generation
 * - Data serialization with style information stripping
 * - Site-wide data aggregation for API endpoints
 *
 * Component Integration:
 * - supportedTypes: Map of component names to Astro component factories
 * - getSpecs: Data loading utility for retrieving YAML configurations
 * - routes: Router utility for page route generation
 *
 * Data Flow:
 * 1. Load configuration data from YAML files via getSpecs
 * 2. Process and transform data for specific use cases
 * 3. Generate Astro component instances for rendering
 * 4. Provide structured data for API endpoints and static generation
 *
 * Menu System:
 * - Header menus with dropdown support
 * - Footer link groups with social media integration
 * - Action buttons for call-to-action elements
 * - Auxiliary navigation links
 *
 * Form Processing:
 * - Dynamic form field component generation
 * - Proper field naming with form prefixes
 * - Component type validation and error handling
 *
 * Static Generation:
 * - Page link enumeration for Astro's getStaticPaths
 * - Data serialization for JSON/YAML API endpoints
 * - Style information stripping for clean data export
 *
 * Usage Context:
 * - Page rendering with dynamic component instantiation
 * - Menu rendering in Header and Footer components
 * - Form field generation in Form component
 * - API endpoint data generation
 * - Static site generation path enumeration
 */

import type { LoaderConfig as Component, CallToAction, FormItem, MenuLink, Link, Links } from '~/types';
import type { AstroComponentFactory } from 'astro/runtime/server/index.js';
import { supportedTypes } from '~/components';
import { getSpecs } from '~/utils/loader';
import { routes } from '~/utils/router';
import AuthGuard from '~/components/common/AuthGuard.astro';

import { SITE } from 'site:config';

/**
 * Retrieves the header menu configuration from YAML data.
 *
 * Loads the 'menus' specification and returns the header menu links
 * which typically include main navigation items with optional dropdowns.
 *
 * @returns Array of MenuLink objects for header navigation
 */
export function getHeaderMenu(): Array<MenuLink> {
  const loadCache = getSpecs('menus');
  return loadCache['header'] as Array<MenuLink>;
}

/**
 * Retrieves the header action buttons configuration from YAML data.
 *
 * Loads the 'menus' specification and returns the action buttons
 * which are typically displayed in the header for calls-to-action.
 *
 * @returns Array of CallToAction objects for header actions
 */
export function getActions(): Array<CallToAction> {
  const loadCache = getSpecs('menus');
  return loadCache['actions'] as Array<CallToAction>;
}

/**
 * Retrieves the footer menu configuration from YAML data.
 *
 * Loads the 'menus' specification and returns the footer link groups
 * which typically include multiple columns of navigation links.
 *
 * @returns Array of Links objects representing footer link groups
 */
export function getFooterMenu(): Array<Links> {
  const loadCache = getSpecs('menus');
  return loadCache['footer'] as Array<Links>;
}

/**
 * Retrieves the auxiliary menu configuration from YAML data.
 *
 * Loads the 'menus' specification and returns the auxiliary links
 * which are typically displayed below the footer menu.
 *
 * @returns Array of Link objects for auxiliary navigation
 */
export function getAuxMenu(): Array<Link> {
  const loadCache = getSpecs('menus');
  return loadCache['auxillary'] as Array<Link>;
}

/**
 * Retrieves the social media menu configuration from YAML data.
 *
 * Loads the 'menus' specification and returns the social media links
 * which typically include icons and URLs for various social platforms.
 *
 * @returns Array of Link objects for social media navigation
 */
export function getSocialMenu(): Array<Link> {
  const loadCache = getSpecs('menus');
  return loadCache['social'] as Array<Link>;
}

/**
 * Generates the copyright footer note with current year and organization.
 *
 * Creates a standardized copyright notice using the current year and
 * organization name from the site configuration.
 *
 * @returns Formatted copyright string for footer display
 */
export function getFootNote(): string {
  return `© ${new Date().getFullYear()}, ${SITE.organization}`;
}

/**
 * Generates Astro component instances from component configuration data.
 *
 * Takes an array of component configuration objects and resolves them
 * to actual Astro component factories with their props. This enables
 * dynamic component instantiation based on YAML configuration.
 *
 * @param components - Array of component configuration objects
 * @returns Array of resolved component instances with factories and props
 */
export function generate(
  components: Array<Record<string, unknown>>
): Array<{ component: AstroComponentFactory; props: Record<string, unknown> }> {
  const resolvedComponents: Array<{ component: AstroComponentFactory; props: Record<string, unknown> }> = [];

  if (!components) {
    return resolvedComponents;
  }

  for (const componentData of components) {
    const componentType = componentData.type as string;
    const Comp = supportedTypes[componentType];

    if (componentType && Comp) {
      // Check for access control properties
      const access = componentData.access as Array<string> | undefined;

      if (access && access.length > 0) {
        // Wrap with AuthGuard
        resolvedComponents.push({
          component: AuthGuard,
          props: {
            requiredRoles: access,
            checkMode: 'any', // Default to 'any', could be configurable via YAML later if needed
            component: Comp,
            componentProps: componentData,
          },
        });
      } else {
        resolvedComponents.push({
          component: Comp,
          props: componentData,
        });
      }
    } else {
      console.error(`Unsupported or unresolved component type: "${componentType}"`, componentData);
    }
  }

  return resolvedComponents;
}

/**
 * Generates section components from component configuration data.
 *
 * Wrapper function that calls generate() to process section components.
 * Ensures consistent handling of component arrays across the application.
 *
 * @param components - Array of component configuration objects
 * @returns Array of resolved component instances with factories and props
 */
export function generateSection(
  components: Array<Record<string, unknown>>
): Array<{ component: AstroComponentFactory; props: Record<string, unknown> }> {
  if (components) {
    return generate(components);
  }
  return [];
}

/**
 * Generates a list of all available page paths for static site generation.
 *
 * Uses the router's route enumeration to create a list of all valid page
 * paths, excluding the home page and pages restricted by access control.
 * This list is used by Astro's getStaticPaths functions for dynamic route generation.
 *
 * @returns Array of page path strings for static generation
 */
export function generateLinks(): Array<string> {
  const links: Array<string> = [];
  routes().map((card) => {
    if (card.name != 'home') {
      const metadata = (card.props?.metadata || {}) as Record<string, unknown>;
      const access = (metadata.access || []) as Array<string>;

      // Check if page has specific access requirements
      // Only include if no access specified or includes 'public'
      if (!access || access.length === 0 || access.includes('public')) {
        links.push(card.name);
      }
    }
  });
  return links;
}

/**
 * Generates a form field component configuration from form item data.
 *
 * Takes a form item configuration and creates a properly named component
 * instance with the appropriate Astro component factory. Handles field
 * naming conventions by prefixing with form name.
 *
 * @param formName - Name of the form for field naming prefix
 * @param item - FormItem configuration object
 * @returns Component configuration for form field
 */
export function getFormField(formName: string, item: FormItem): Component {
  const name: string = `${formName}-${item.name}`;
  const props: Record<string, unknown> = {};

  for (const property in item) {
    if (Object.prototype.hasOwnProperty.call(item, property)) {
      if (property == 'name') {
        props[property] = name;
      } else if (property != 'type') {
        props[property] = item[property];
      }
    }
  }
  const component: Component = {
    name: name,
    type: 'field',
    tag: supportedTypes[item.type], // Ensure this resolves correctly
    props: props,
  };

  if (!component.tag) {
    console.error(`Unsupported field type: ${item.type}`);
  }

  return component;
}

/**
 * Checks if a component or section has public access.
 * Returns true if no access control is defined or if 'public' is in the access list.
 */
function isPublic(data: Record<string, unknown>): boolean {
  const access = data.access as Array<string> | undefined;
  // If no access control defined, it's public
  if (!access || access.length === 0) {
    return true;
  }
  // If explicit access control, must contain 'public'
  return access.includes('public');
}

/**
 * Processes a widget configuration for data export.
 * Checks access control and strips rendering/style properties.
 *
 * @param widget - Widget configuration object
 * @returns Cleaned widget object or null if access denied
 */
function processWidget(widget: Record<string, unknown>): Record<string, unknown> | null {
  if (!isPublic(widget)) {
    return null;
  }

  const cleanWidget: Record<string, unknown> = {};
  // Properties to exclude (rendering/style/access related)
  const excludeProps = ['access', 'bg', 'classes', 'id'];

  for (const key in widget) {
    if (Object.prototype.hasOwnProperty.call(widget, key)) {
      if (!excludeProps.includes(key)) {
        cleanWidget[key] = widget[key];
      }
    }
  }

  return cleanWidget;
}

/**
 * Processes a list of sections, flattening them into a single list of public widgets.
 *
 * @param sections - Array of section configuration objects
 * @returns Flattened array of accessible widget configurations
 */
function processSections(sections: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  if (!sections) return [];

  const widgets: Array<Record<string, unknown>> = [];

  for (const section of sections) {
    // Check section-level access
    if (!isPublic(section)) {
      continue;
    }

    const componentsData = section.components;

    if (componentsData) {
      for (const key in componentsData) {
        for (const component of componentsData[key]) {
          const cleanWidget = processWidget(component);
          if (cleanWidget) {
            widgets.push(cleanWidget);
          }
        }
      }
    }
  }

  return widgets;
}

/**
 * Strips style-related properties from data objects for clean serialization.
 *
 * Recursively removes style-related keys (bg, classes) from data objects
 * to create clean data structures for API endpoints. This ensures that
 * exported data doesn't include theme-specific styling information.
 *
 * @param data - Data object or array to process
 * @returns Clean data object with style properties removed
 */
function stripStyle(data: unknown): unknown {
  const styleKeys = ['bg', 'classes', 'access'];

  if (Array.isArray(data)) {
    return data.map(stripStyle);
  }

  if (data && typeof data === 'object' && data.constructor === Object) {
    const newData: Record<string, unknown> = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        if (styleKeys.includes(key)) {
          continue;
        }
        newData[key] = stripStyle(data[key]);
      }
    }
    return newData;
  }
  return data;
}

/**
 * Generates clean page data for API endpoints by stripping style information.
 *
 * Loads page data from YAML configuration and removes style-related properties
 * to create clean data structures suitable for JSON/YAML API responses.
 *
 * @param page - Page slug to generate data for
 * @returns Clean page data object or null if page not found
 */
export function generateData(page: string): Record<string, unknown> | null {
  const pages = getSpecs('pages');
  const pageData = pages[page] as Record<string, unknown>;

  if (!pageData) {
    return null;
  }

  // Clone to avoid mutating original cache
  const result: Record<string, unknown> = {};

  // Properties to separately handle or exclude
  const specialKeys = ['sections', 'bg', 'classes', 'access'];

  // Process metadata and other root properties (stripping styles)
  for (const key in pageData) {
    if (specialKeys.includes(key)) continue;
    result[key] = stripStyle(pageData[key]);
  }

  // Process sections specially: flatten and check access
  if (pageData.sections && Array.isArray(pageData.sections)) {
    result.widgets = processSections(pageData.sections as Array<Record<string, unknown>>);
  } else {
    result.widgets = [];
  }

  return result;
}

/**
 * Generates complete site data for bulk API endpoints.
 *
 * Aggregates all page data and menu configurations, strips style information,
 * and creates a comprehensive data structure for site-wide API endpoints.
 *
 * @returns Complete site data object with clean serialized data
 */
export function generateSite(): Record<string, unknown> {
  const pages = getSpecs('pages');
  const siteData = {
    menus: stripStyle(getSpecs('menus')),
    pages: {} as Record<string, unknown>,
  };

  for (const pageName of Object.keys(pages)) {
    const pageData = pages[pageName] as Record<string, unknown>;
    const metadata = (pageData.metadata || {}) as Record<string, unknown>;

    // Check page-level access via metadata
    if (isPublic(metadata)) {
      siteData.pages[pageName] = generateData(pageName);
    }
  }
  return siteData;
}
