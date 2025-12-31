/**
 * core/dev/templates/services/GenericService.ts
 *
 * ==============================================================================
 * 🧠 THE GENERIC SERVICE (SINGLETON) TEMPLATE
 * ==============================================================================
 *
 * A "Service" is a self-contained module that manages a specific domain of data
 * (e.g., Shopping Cart, User Session, Theme Settings).
 *
 * ARCHITECTURAL RULE:
 * 1. STATE IS PRIVATE: The Nano Store ($atom, $map) is never exported directly.
 * 2. ACCESS IS PUBLIC: Only the Service (methods) and Hook (read-only) are exported.
 *
 * WHY?
 * - Refactoring Safety: You can change the underlying storage (e.g., add localStorage)
 * without touching a single UI component.
 * - Logic Centralization: Validation rules happen here, not in the Button `onClick`.
 *
 * USAGE:
 * Copy this file to `src/services/YourDomain.ts`.
 */

import { map } from 'nanostores';
import { useStore } from '@nanostores/react'; // Switch to '@nanostores/preact' if using Preact

// ==============================================================================
// 1. DEFINE TYPES
// ==============================================================================

/**
 * The shape of the data managed by this service.
 */
export interface GenericItem {
    id: string;
    name: string;
    value: number;
    status: 'active' | 'inactive';
}

/**
 * The shape of the State Object (Dictionary/Map).
 */
export type GenericState = Record<string, GenericItem>;

// ==============================================================================
// 2. DEFINE PRIVATE STATE (The "Brain")
// ==============================================================================

/**
 * The raw store. NOT EXPORTED.
 * We use `map` for key-value collections. Use `atom` for primitives (strings/numbers).
 * * To make this persistent (localStorage), replace `map` with:
 * import { persistentMap } from '@nanostores/persistent';
 * const $store = persistentMap<GenericState>('my-service-key:', {});
 */
const $store = map<GenericState>({});

// ==============================================================================
// 3. DEFINE PUBLIC SERVICE (The "Interface")
// ==============================================================================

export const GenericService = {
    /**
     * CREATE / UPDATE
     * Centralizes logic: "If item exists, update it. If not, create it."
     */
    setItem(item: GenericItem) {
        // const current = $store.get();

        // Example Business Logic: Validation
        if (item.value < 0) {
            console.error('[GenericService] Value cannot be negative.');
            return;
        }

        // Nano Stores update
        $store.setKey(item.id, item);
    },

    /**
     * DELETE
     */
    removeItem(id: string) {
        $store.setKey(id, undefined);
    },

    /**
     * RESET
     */
    clearAll() {
        $store.set({});
    },

    /**
     * READ (Non-Reactive)
     * Use this in regular JS functions or API logic where hooks can't run.
     */
    getSnapshot() {
        return $store.get();
    },

    /**
     * COMPUTED LOGIC
     * Example: Get total value of all items
     */
    calculateTotal() {
        return Object.values($store.get()).reduce((acc, item) => acc + item.value, 0);
    }
};

// ==============================================================================
// 4. DEFINE PUBLIC HOOK (The "View")
// ==============================================================================

/**
 * Custom Hook for Islands (React/Preact).
 * * Usage in Component:
 * const items = useGenericService();
 * * Why?
 * It abstracts the `useStore` import. The component doesn't need to know
 * that Nano Stores exists.
 */
export function useGenericService() {
    const rawState = useStore($store);
    return Object.values(rawState); // Transform Map -> Array for easy rendering
}

/**
 * Optional: Hook for a specific item
 */
export function useGenericItem(id: string) {
    const rawState = useStore($store);
    return rawState[id] || null;
}
