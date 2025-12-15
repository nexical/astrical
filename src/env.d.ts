/**
 * src/env.d.ts
 *
 * This file provides TypeScript declaration references for the Astro project environment.
 * It ensures proper type checking and IntelliSense support by referencing essential
 * type definition files for Astro, Vite, and project-specific types.
 *
 * Features:
 * - TypeScript declaration merging for Astro environment
 * - Reference to core Astro client types
 * - Reference to Vite client types for build tooling
 * - Reference to project-specific plugin types
 * - Type definitions for Authentication locals
 *
 * Type Reference Chain:
 * 1. ../.astro/types.d.ts - Astro's generated type definitions
 * 2. astro/client - Core Astro client-side type definitions
 * 3. vite/client - Vite's client-side module type definitions
 * 4. ../plugins/config/types.d.ts - Project-specific plugin configuration types
 *
 * Usage Context:
 * - Enables TypeScript support for Astro's environment variables
 * - Provides type definitions for Astro's client-side APIs
 * - Supports Vite's module import system
 * - Integrates project-specific plugin type definitions
 *
 * Declaration Merging:
 * - Augments global types with Astro-specific interfaces
 * - Extends module resolution for .astro files
 * - Provides type safety for environment variables
 */

// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />
/// <reference types="vite/client" />
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../plugins/config/types.d.ts" />

declare namespace App {
  /**
   * Extends the Astro Locals interface to include application-specific state.
   * This interface is available in all Astro components and API endpoints via `Astro.locals` or `context.locals`.
   */
  interface Locals {
    /**
     * Authentication state and utilities.
     * This property is populated by authentication middleware/modules to provide
     * access to the current user's session and permission checks.
     */
    auth: {
      /**
       * The currently authenticated user, or null if no user is logged in.
       */
      user: {
        /** Unique identifier for the user. */
        id: string;
        /** User's email address. */
        email?: string;
        /** User's display name. */
        name?: string;
        /** URL to the user's avatar image. */
        avatar?: string;
        /**
         * Allow extensibility for arbitrary user properties provided by specific auth providers.
         */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any;
      } | null;

      /**
       * List of roles assigned to the current user.
       * Example: `['admin', 'editor']`
       */
      roles: string[];

      /**
       * Checks if the current user has at least one of the required roles.
       * @param requiredRoles - Array of role names to check against the user's roles.
       * @returns True if the user has permission, false otherwise.
       */
      hasRole: (requiredRoles: string[]) => boolean;

      /**
       * Configuration for authentication-related redirects.
       * These are populated by the auth module or configuration settings.
       */
      urls: {
        /** URL to redirect unauthenticated users to for login. */
        login: string;
        /** URL to trigger user logout. */
        logout: string;
        /** URL for new user registration. */
        register: string;
      };
    };

    /**
     * A reserved namespace for modules to store their runtime data.
     * Modules should strictly use their specific key within this object to ensure isolation.
     * e.g., locals.modules['supabase-auth']
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    modules: Record<string, any>;
  }
}

/**
 * Wildcard module declaration for aliased Astro components.
 *
 * TypeScript cannot natively resolve imports ending in `.astro` when using path aliases (e.g., `~/`).
 * While Astro provides global types for `*.astro`, they sometimes fail to apply to aliased paths
 * due to TypeScript's resolution priority.
 *
 * This declaration explicitly tells TypeScript that any module imported via the `~/` alias
 * with a `.astro` extension exports a standard Astro component factory. This prevents
 * "Cannot find module" errors during type checking without affecting runtime behavior.
 */
declare module '~/*.astro' {
  import type { AstroComponentFactory } from 'astro/runtime/server/index.js';
  const Component: AstroComponentFactory;
  export default Component;
}
