# Data Flow & Build Pipeline

**Status:** Immutable Law
**Scope:** `content/` $\rightarrow$ `dist/`
**Key Systems:** Loader, Router, Registry, Generator

## 1. The Core Philosophy: "Content as Configuration"

In a traditional Astro project, the file structure of `src/pages/` dictates the routes. In Astrical, **this is inverted**.

* **Source of Truth:** The `content/` directory (YAML files).
* **The Engine:** The `src/` directory (TypeScript/Astro components).
* **The Output:** Static HTML.

The engine does not "know" what pages exist until it scans the `content/` directory.

---

## 2. The Law of File-System Routing

This is the single most important rule for AI Agents navigating the codebase.

> **⚠️ THE LAW:**
> The URL structure of the live site **EXACTLY MIRRORS** the `content/pages/` directory structure.
>
> * **Do NOT** look for page components in `src/pages/`.
> * **Do NOT** create new `.astro` files in `src/pages/` to add routes.
> * **ALWAYS** create/edit `.yaml` files in `content/pages/`.

### The Routing Map

| Source File (You Edit This) | Rendered URL (User Sees This) |
| :--- | :--- |
| `content/pages/index.yaml` | `/` |
| `content/pages/about.yaml` | `/about` |
| `content/pages/team/leadership.yaml` | `/team/leadership` |
| `content/pages/services/index.yaml` | `/services/` |

**Technical Reality:**
All of these routes are actually served by a **Single Catch-All Route**: `src/pages/[...build].astro`.astro]. This component acts as the "Main Loop" that ingests the specific YAML file and renders the requested layout.

---

## 3. The Build Lifecycle (Step-by-Step)

How does a YAML file become an HTML page?

### Phase 1: Ingestion (The Loader)
**Actor:** `src/utils/loader.ts`

1.  **Scan:** The loader uses `import.meta.glob` (or `fs` in scripts) to find all `.yaml` files in `content/`.
2.  **Parse:** It validates the YAML against the strict schema defined in `src/types/page.ts`.
3.  **Reference Resolution:** It resolves any `$ref` pointers (e.g., pointing to shared content in `content/shared/`).

### Phase 2: Enumeration (The Router)
**Actor:** `src/utils/router.ts`

1.  **`getStaticPaths`**: During the build, Astro calls `getStaticPaths` in `src/pages/[...build].astro`.astro].
2.  **Mapping:** The router calls `routes()` to iterate through the loaded YAML objects and generate the list of valid URL slugs.
3.  **Context Injection:** It passes the parsed YAML data (the "Props") to the page component for that specific route.

### Phase 3: Component Resolution (The Registry)
**Actor:** `src/components.ts`

The YAML file says: `type: Hero`. The Engine needs `<Hero />`.

1.  **Lookup:** The engine checks the global `COMPONENT_MAP` (or internal registry) in `src/components.ts`.
2.  **Discovery:** This map is populated by scanning `modules/*/src/components/widgets/` and local core widgets.
3.  **Hydration:** The properties defined in YAML (e.g., `title: "Hello"`) are passed as props to the resolved Astro component.

### Phase 4: Rendering (The Generator)
**Actor:** `src/layouts/PageLayout.astro`

1.  **Skeleton:** The `PageLayout` establishes the `<html>`, `<head>`, and `<body>`.
2.  **SEO:** It injects metadata via `CommonMeta.astro` using data from `content/config.yaml` and the page's YAML metadata.
3.  **Injection:** It iterates through the `sections` array in the YAML data, rendering the corresponding widgets into the slots.

---

## 4. Asset & Style Flow

### A. Theming Engine
**Actor:** `src/utils/theme.ts`

Styles are not static; they are composed dynamically to ensure modularity.

1.  **Module Styles:** Loaded from `modules/[name]/theme/style.yaml`.
2.  **Base Theme:** Loaded from `src/themes-default/[theme]/style.yaml`.
3.  **User Overrides:** Loaded from `content/style.yaml`.
4.  **Merge:** `User > Base > Module`. The result is a deeply merged JSON object of Tailwind classes that `getClasses()` injects into components.

### B. Image Optimization & Permalinks
**Actors:** `src/utils/images.ts` & `src/utils/permalinks.ts`

1.  **Detection:** The system detects image paths in YAML props.
2.  **Optimization:** It uses Astro's `<Image />` component or `getImage()` helper to generate optimized WebP/Avif versions at build time.
3.  **Permalinks:** `getPermalink()` and `getAsset()` resolve relative paths to ensure assets work even if the site is deployed to a subdirectory (base path) defined in `astro.config.ts`.

---

## 5. Decision Tree for Agents

When you need to modify data, where do you go?

* **"I need to change the text on the About page."**
    * $\rightarrow$ Edit `content/pages/about.yaml`.
* **"I need to add a new page at /pricing."**
    * $\rightarrow$ Create `content/pages/pricing.yaml`.
* **"I need to change the layout logic of ALL pages."**
    * $\rightarrow$ Edit `src/layouts/PageLayout.astro` (Requires System Architect approval).
* **"I need to create a new type of widget."**
    * $\rightarrow$ Create `src/components/widgets/NewWidget.astro` AND register it in the module or core map.

*Any deviation from this flow results in build errors or "Ghost Content" that exists in code but never renders.*