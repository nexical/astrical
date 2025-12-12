/**
 * src/utils/form-registry.ts
 *
 * This module provides a singleton registry for managing form handlers.
 * It allows registering handlers and retrieving them by name.
 */

import type { FormHandler } from '~/types';

/**
 * This class provides a Registry for managing form handlers.
 *
 * It allows registering handlers and retrieving them by name.
 *
 * @method register() - Registers a form handler
 * @method get() - Retrieves a handler by name
 * @method getAll() - Returns all registered handlers
 * @method clear() - Clears all registered handlers (useful for testing)
 */
export class FormHandlerRegistry {
  private handlers: Map<string, FormHandler> = new Map();

  /**
   * Registers a form handler.
   * @param handler The handler instance to register.
   */
  register(handler: FormHandler) {
    if (this.handlers.has(handler.name)) {
      console.warn(`FormHandlerRegistry: Overwriting existing handler for '${handler.name}'`);
    }
    this.handlers.set(handler.name, handler);
  }

  /**
   * Retrieves a handler by name.
   * @param name The name of the handler to retrieve.
   */
  get(name: string): FormHandler | undefined {
    return this.handlers.get(name);
  }

  /**
   * Returns all registered handlers.
   */
  getAll(): FormHandler[] {
    return Array.from(this.handlers.values());
  }

  /**
   * Clears all registered handlers (useful for testing).
   */
  clear() {
    this.handlers.clear();
  }
}

export const formHandlers = new FormHandlerRegistry();

// Register core handlers

/**
 * Discovers and registers handlers from a map of modules.
 * @param registry The registry to register handlers into.
 * @param handlersMap The map of modules containing handlers.
 */
export function discoverHandlers(registry: FormHandlerRegistry, handlersMap: Record<string, unknown>) {
  for (const path in handlersMap) {
    const module = handlersMap[path] as { default: unknown } | unknown;

    // Iterate over all exports to find classes implementing FormHandler
    const exports = module as Record<string, unknown>;

    // Use Object.keys for Module Namespace Objects
    const paramExports = Object.keys(exports);

    for (const exportName of paramExports) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const exportedItem = (exports as any)[exportName];

      // Check if it's a class (constructor)
      if (typeof exportedItem === 'function' && exportedItem.prototype) {
        try {
          // Instantiate to check if it matches the interface
          const instance = new exportedItem();
          if (instance && typeof instance.name === 'string' && typeof instance.handle === 'function') {
            // It looks like a FormHandler
            if (!registry.get(instance.name)) {
              registry.register(instance as FormHandler);
            }
          }
        } catch {
          // Ignore errors during instantiation
        }
      }
    }
  }
}

// Discover and register handlers automatically
const coreHandlers = import.meta.glob('~/form-handlers/*.ts', { eager: true });
const moduleHandlers = import.meta.glob('@modules/*/src/form-handlers/*.ts', { eager: true });

const allHandlers = { ...coreHandlers, ...moduleHandlers };
discoverHandlers(formHandlers, allHandlers);
