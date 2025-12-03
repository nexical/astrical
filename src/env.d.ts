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
/// <reference types="../plugins/config/types.d.ts" />
