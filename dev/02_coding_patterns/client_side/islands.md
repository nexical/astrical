# Protocol: Client-Side Interactivity (The Island Architecture)

**Status:** Active Protocol
**Scope:** Browser-run logic (`.tsx`, `<script>`, `.ts`)
**Key Systems:** Astro Islands, Nano Stores

## 1. The Core Philosophy: "Static by Default"

Astrical is built on Astro, which means it ships **Zero JavaScript** to the client by default.

* **The Rule:** Do not reach for React/Preact unless you absolutely need it.
* **The Exception:** If a component requires *state* (changing data) or *complex event handling* (drag-and-drop), it becomes an **Island**.

We define two tiers of interactivity to keep the site fast.

---

## 2. Tier 1: Lightweight Logic (Script Injection)
**Use Case:** Redirects, Dark Mode Toggles, Mobile Menu expansion.
**Cost:** Low (Browser native, no hydration cost).

For simple tasks, we do not use a Framework. We use **Inline Scripts** that manipulate the DOM directly.

### The Standard Pattern: "Data-Driven Scripting"
Derived from `src/components/widgets/RoleRedirect.astro`.

1.  **Server Side:** Render the HTML with `data-` attributes containing the initial state.
2.  **Client Side:** Use `<script is:inline>` to read those attributes and act immediately.

#### Example Recipe: A Simple Redirector
This component forces a client-side redirect if the server-side logic determines it is necessary.

```astro
---
// src/components/widgets/RoleRedirect.astro
// SERVER SIDE: Determine the target
const { mappings = [] } = Astro.props;
const { auth } = Astro.locals;
let redirectPath = null;

if (auth?.user && mappings.length > 0) {
  const match = mappings.find((rule) => auth.hasRole(rule.roles));
  if (match) redirectPath = match.path;
}
---

{
  redirectPath && (
    <script is:inline define:vars={{ redirectPath }}>
      // This runs immediately in the browser
      window.location.href = redirectPath;
    </script>
  )
}

```

**⚠️ Warning:** Do NOT put business logic (like checking `Astro.locals.auth`) inside the `<script>`. That logic belongs in the Frontmatter (Server). The script only *executes* the decision.

---

## 3. Tier 2: Heavyweight Logic (Framework Islands)

**Use Case:** Dashboards, Form Wizards, Calculators, Search Bars.
**Cost:** High (Downloads React/Preact library + Hydration).

When state management becomes too complex for vanilla JS, we use **Framework Islands** (typically Preact or React).

### The Architecture

To maintain the "4-File Component Rule," we split Islands into three parts:

1. **The Logic (`.tsx`):** The pure component. Lives in `src/components/islands/`.
2. **The Wrapper (`.astro`):** The mount point. Lives in `src/components/widgets/`.
3. **The State (`.ts`):** Shared memory (Nano Stores). Lives in `src/utils/` (or `src/stores/`).

### Recipe: The Interactive Counter

#### Step A: The Logic (`src/components/islands/Counter.tsx`)

*Note: This file must not import Astro.*

```tsx
import { useState } from 'preact/hooks';

export default function Counter({ initial = 0 }) {
  const [count, setCount] = useState(initial);
  return (
    <button onClick={() => setCount(c => c + 1)} className="btn btn-primary">
      Count is: {count}
    </button>
  );
}

```

#### Step B: The Wrapper (`src/components/widgets/CounterWidget.astro`)

This is where the Island meets the HTML. You **MUST** use a `client:*` directive.

```astro
---
import WidgetWrapper from '~/components/ui/WidgetWrapper.astro';
// Import the framework component
import Counter from '~/components/islands/Counter.tsx';

const { id, initialCount = 0 } = Astro.props;
---

<WidgetWrapper id={id}>
  <Counter client:visible initial={initialCount} />
</WidgetWrapper>

```

---

## 4. State Management (The "Glue")

Islands are isolated. If Island A needs to talk to Island B (e.g., "Add to Cart" updates "Header Cart Icon"), you cannot use Props.

**The Solution:** Use **Nano Stores** (See `02_coding_patterns/client_side/stores.md`).

* **Do Not** use React Context (it doesn't work across Islands).
* **Do Not** rely on `window.globalVar`.
* **Do** import a shared store from `src/utils/cache.ts` (or similar).

```tsx
// Correct pattern for shared state
import { useStore } from '@nanostores/preact';
import { getVar } from '~/utils/cache'; // Use the Service Accessor, not the raw store

export function CartIcon() {
  // Example: Subscribing to a store (assuming cache exposes one)
  const count = useStore($cartCount);
  return <div>Items: {count}</div>;
}

```

---

## 5. Anti-Patterns (What NOT to do)

| Bad Practice | Why it fails | Correct Approach |
| --- | --- | --- |
| **Using React for Static Content** | "I built the Footer in React." | Use `.astro` components. They render to pure HTML. Only use React if it *moves* or *changes*. |
| **Inline `onclick` handlers** | `<button onclick="doThing()">` | CSP (Security Policy) often blocks inline JS. Use `addEventListener` in a `<script>` tag. |
| **Fetching Data in Component** | `useEffect(() => fetch('/api'))` | Prefer fetching data in the `.astro` frontmatter (Server) and passing it as Props. Use `useEffect` only for *live* updates. |
| **Mixing Logic** | Checking Auth in `.tsx` | Auth checks happen on the Server (`.astro`) like in `AuthGuard.astro`. Pass the result (`isLoggedIn={true}`) to the Island. |

*When in doubt: If it doesn't need to change after the page loads, it shouldn't be an Island.*
