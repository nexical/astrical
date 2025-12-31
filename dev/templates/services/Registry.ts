/**
 * core/dev/templates/services/Registry.ts
 *
 * ==============================================================================
 * 📒 THE REGISTRY PATTERN
 * ==============================================================================
 *
 * A Registry is a singleton that manages a collection of "Strategies" or "Plugins".
 * It allows the Core to discover and use extensions provided by Modules.
 *
 * ARCHITECTURAL ROLE:
 * - Decoupling: The Consumer (Core) asks for "mailgun", without importing `MailgunHandler`.
 * - Extensibility: Modules can register new items at runtime/startup.
 *
 * USE CASES:
 * - Form Handlers (e.g., 'save-db', 'send-email')
 * - Widget Map (e.g., 'Hero', 'Testimonials')
 * - Payment Gateways (e.g., 'stripe', 'paypal')
 *
 * USAGE:
 * Copy this file to `src/registries/YourRegistry.ts` and define your Item Interface.
 */

// ==============================================================================
// 1. DEFINE THE CONTRACT
// ==============================================================================

/**
 * All items in this registry must implement this interface.
 * This ensures the consumer knows how to use them.
 */
export interface RegistryItem {
    /**
     * The unique key used to look up this item.
     * e.g., 'stripe', 'hero-widget'
     */
    name: string;

    /**
     * Optional description for debugging or admin UIs.
     */
    description?: string;

    /**
     * (Example Method) The actual work this item does.
     * Replace this with your specific methods (e.g., `render()`, `process()`).
     */
    execute(...args: any[]): Promise<void> | void;
}

// ==============================================================================
// 2. THE GENERIC REGISTRY CLASS
// ==============================================================================

export class Registry<T extends RegistryItem> {
    private items = new Map<string, T>();
    private contextName: string;

    constructor(contextName: string = 'Registry') {
        this.contextName = contextName;
    }

    /**
     * Register a new item.
     * Throws an error if the name is already taken to prevent accidental overrides.
     */
    register(item: T) {
        if (this.items.has(item.name)) {
            console.warn(`[${this.contextName}] Warning: Overwriting existing item '${item.name}'`);
        }
        this.items.set(item.name, item);
        console.debug(`[${this.contextName}] Registered: ${item.name}`);
    }

    /**
     * Retrieve an item by name.
     */
    get(name: string): T | undefined {
        return this.items.get(name);
    }

    /**
     * Get all registered items (useful for listing available plugins).
     */
    getAll(): T[] {
        return Array.from(this.items.values());
    }

    /**
     * Check if an item exists.
     */
    has(name: string): boolean {
        return this.items.has(name);
    }
}

// ==============================================================================
// 3. EXAMPLE IMPLEMENTATION (Form Handlers)
// ==============================================================================

/*
 * To use this template, you would create a singleton instance in your application code.
 *
 * Example: src/form-registry.ts
 * ------------------------------------------------------------------
 * import { Registry, type RegistryItem } from '~/patterns/Registry';
 *
 * // 1. Define specific interface
 * export interface FormHandler extends RegistryItem {
 * handle(data: any): Promise<void>;
 * }
 *
 * // 2. Create Singleton
 * export const formRegistry = new Registry<FormHandler>('FormHandlers');
 *
 * // 3. Auto-Discovery (e.g., in a startup script or middleware)
 * // This simulates importing files from modules
 * import { MailgunHandler } from './handlers/mailgun';
 * formRegistry.register(new MailgunHandler());
 */
