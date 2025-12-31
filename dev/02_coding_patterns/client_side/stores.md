# Protocol: Client-Side State (Nano Stores)

**Status:** Active Protocol
**Scope:** Shared Data across Islands (`.ts`, `.tsx`)
**Key Systems:** Nano Stores, Service Singleton Pattern

## 1. The Core Philosophy: "Islands need Bridges"

In Astrical's Island Architecture, React/Preact components are isolated. A component in the Header cannot share state with a component in the Footer using standard React Context, because they are effectively different applications running on the same page.

To bridge this gap, we use **Nano Stores**.
* **Lightweight:** < 1KB.
* **Agnostic:** Works in Vanilla JS, React, Preact, Vue, and Svelte.
* **External:** State lives *outside* the component tree.

---

## 2. The "Service Singleton" Pattern

We do **NOT** simply export raw stores. We wrap them in a **Service Interface**.

**Why?**
If you export a raw `atom` or `map`, every component creates a tight coupling to Nano Stores. If you later want to persist that data to `localStorage` or validate inputs, you have to refactor every single component.

**The Rule:**
> "State is Private. Access is Public."
> Create a TypeScript Service that exposes `get`, `set`, and `subscribe` methods (or Hooks). Keep the actual Store instance hidden or read-only.

---

## 3. Implementation Recipe

Here is how to build a robust state manager, for example, a **Shopping Cart**.

### Step 1: Define the Types & Store (Private)
Create `src/services/cart.ts` (or `src/stores/cart.ts`).

```typescript
import { map } from 'nanostores';

// 1. Define the Shape
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

// 2. Create the Store (Not Exported directly if possible)
// We use a Map for key-value storage
const $cart = map<Record<string, CartItem>>({});

```

### Step 2: Define the Service Logic (Public)

Export a singleton object (or class) that handles the *business logic*. This is where you enforce rules (e.g., "Max quantity is 10").

```typescript
export const CartService = {
  /**
   * Add an item or increment quantity
   */
  addItem(item: Omit<CartItem, 'quantity'>) {
    const current = $cart.get()[item.id];
    if (current) {
      if (current.quantity >= 10) return; // Business Logic Rule
      $cart.setKey(item.id, { ...current, quantity: current.quantity + 1 });
    } else {
      $cart.setKey(item.id, { ...item, quantity: 1 });
    }
  },

  /**
   * Remove item completely
   */
  removeItem(id: string) {
    $cart.setKey(id, undefined); // NanoStores map deletion
  },

  /**
   * Clear all (Reset)
   */
  clear() {
    $cart.set({});
  },

  /**
   * Read current value (Snapshot) for non-reactive JS
   */
  getSnapshot() {
    return $cart.get();
  }
};

```

### Step 3: Expose Reactivity (The Hook)

To allow Islands to react to changes, export a specific hook. This abstracts the `useStore` import, so components don't even need to know Nano Stores exists.

```typescript
import { useStore } from '@nanostores/preact'; // or @nanostores/react

/**
 * Custom Hook for consumption in Islands
 */
export function useCart() {
  const rawCart = useStore($cart);
  return Object.values(rawCart); // Transform map to array for easier rendering
}

```

---

## 4. Usage Examples

### A. In a Framework Island (`CartButton.tsx`)

Notice how clean the component is. No complex logic, just calling the Service.

```tsx
import { useCart, CartService } from '~/services/cart';

export default function CartButton() {
  const items = useCart(); // Auto-updates when store changes
  const total = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <button onClick={() => CartService.addItem({ id: 'p1', name: 'Product', price: 10 })}>
      Cart ({total})
    </button>
  );
}

```

### B. In Vanilla JS / Astro Scripts

You don't need React to use state.

```html
<script>
  import { CartService } from '~/services/cart';
  
  // Listen for clicks on static HTML elements
  document.getElementById('add-btn').addEventListener('click', () => {
    CartService.addItem({ id: 'hero-product', name: 'Hero Item', price: 99 });
  });
</script>

```

---

## 5. Persistence (The "Service" Advantage)

Because we used the Service Singleton pattern, adding `localStorage` persistence is trivial and requires **zero changes** to the UI components.

**Update `src/services/cart.ts`:**

```typescript
import { map } from 'nanostores';
import { persistentMap } from '@nanostores/persistent'; // Drop-in replacement

// Switch to persistent map
const $cart = persistentMap<Record<string, CartItem>>('cart:', {});

// The rest of CartService remains exactly the same!
// The UI components remain exactly the same!

```

---

## 6. Anti-Patterns

| Bad Practice | Why it fails | Correct Approach |
| --- | --- | --- |
| **Exporting Raw Atoms** | `export const count = atom(0);` | Logic gets scattered across components. "Where did we limit the counter to 10?" |
| **Direct Mutation** | `count.set(count.get() + 1)` in a `.tsx` file. | Hard to debug, hard to test, hard to refactor. |
| **React Context** | `<CartProvider>...</CartProvider>` | Does not work across Astro Islands. State will be lost between Header and Body. |
| **Heavy Objects** | Storing entire massive JSON blobs. | Re-renders everything on small changes. |
