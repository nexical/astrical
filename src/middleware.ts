/**
 * src/middleware.ts
 *
 * The Core Middleware Engine for Astrical.
 * This file implements the "Auto-Wiring" architecture, automatically discovering, sorting,
 * and executing middleware from all active modules.
 *
 * Architecture:
 * 1. Discovery: Uses `import.meta.glob` to find all `middleware.ts` files in modules.
 * 2. Configuration: Receives the specific execution order (MIDDLEWARE) from `site:config`.
 *    This order is pre-calculated by the `site-config` plugin using Topological Sort on `module.yaml` dependencies.
 * 3. Execution: Chains the middlewares in the correct order using Astro's `sequence()`.
 */

import { defineMiddleware, sequence } from 'astro/middleware';
import { MIDDLEWARE } from 'site:config';

// Define the shape of a middleware module
type MiddlewareModule = {
  onRequest: ReturnType<typeof defineMiddleware>;
};

// 1. Discovery: Load all middleware modules eagerly
// We use a relative path to ensure Vite can resolve it.
// This assumes 'src/middleware.ts' is in 'src/core/src/' and modules are in 'src/core/modules/'
const middlewareModules = import.meta.glob<MiddlewareModule>('../modules/*/middleware.ts', { eager: true });

/**
 * Resolves the middleware handlers in the correct execution order.
 * Exported for internal unit testing.
 *
 * @param modules - map of module paths to middleware modules (default: discovered modules)
 * @param order - list of module names in execution order (default: configured order)
 * @returns An array of middleware handlers.
 */
export function getOrderedMiddleware(
  modules: Record<string, MiddlewareModule> = middlewareModules,
  order: string[] = MIDDLEWARE
) {
  const handlers: Array<ReturnType<typeof defineMiddleware>> = [];

  // Create a map for quick lookup: "module-name" -> module export
  const moduleMap = new Map<string, MiddlewareModule>();

  for (const [path, mod] of Object.entries(modules)) {
    // Extract module name from path: "../modules/module-name/middleware.ts"
    // matches[1] will be "module-name"
    const match = path.match(/\.\.\/modules\/([^/]+)\/middleware\.ts$/);
    if (match && match[1]) {
      moduleMap.set(match[1], mod);
    }
  }

  // 2. Construction: Iterate through the pre-sorted order from config
  for (const moduleName of order) {
    const mod = moduleMap.get(moduleName);
    if (mod && mod.onRequest) {
      handlers.push(mod.onRequest);
    } else {
      // It's normal for some modules in the graph (dependency only) to not have middleware.
      // We explicitly skip them.
    }
  }

  return handlers;
}

// 3. Execution: Create the sequence
export const onRequest = sequence(...getOrderedMiddleware());
