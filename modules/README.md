# Astrical Module System Developer Guide

**Welcome to the Astrical Module System.**

This guide is intended for developers (both human and AI) who wish to extend the Astrical web framework. Modules allow you to package and distribute reusable functionality, content, and designs that can be dropped into any Astrical project.

## What is an Astrical Module?

A module is a self-contained directory that mirrors the structure of the main Astrical application. When a module is installed, the Astrical build engine automatically discovers, merges, and integrates its resources into the final website.

Modules can contribute:
1.  **Content**: YAML-defined pages and shared content components.
2.  **Code**: Astro components (Widgets, Forms, Sections).
3.  **Routes**: Dynamic Astro pages and API endpoints.
4.  **Styles**: Theme extensions and component styling.
5.  **Utilities**: TypeScript SDKs and helper functions.

---

## Module Structure

A valid module must adhere to the following directory structure. The build system relies on these specific paths to discover resources.

```bash
modules/<module-name>/
├── module.yaml           # Manifest file (Required)
├── content/              # YAML Content
│   ├── config.yaml       # Configuration Defaults
│   ├── pages/            # Content Pages
│   └── shared/           # Shared Content Components
├── src/                  # Source Code
│   ├── components/       # Astro Components
│   │   ├── widgets/      # Reusable UI widgets
│   │   ├── forms/        # Form components
│   │   └── sections/     # Layout/Section components
│   ├── pages/            # Astro Routes & API Endpoints
│   │   ├── api/          # API Routes (recommended)
│   │   └── ...           # UI Routes
│   └── utils/            # TypeScript Utilities/SDKs
└── theme/
    └── style.yaml        # Style Definitions
```

---

## Extension Points & Integration Details

### 1. Content Integration
**System**: `src/utils/loader.ts`
**Reference**: `dev/content_management.rst`

Modules can define pages and shared components using YAML. This content is merged with the project's content.

-   **Pages**: YAML files in `content/pages/` are automatically loaded as pages.
-   **Shared Components**: YAML files in `content/shared/` are loaded as reusable content definitions.
-   **Merge Logic**: **Project > Module**. If a file exists in both the project and a module (relative path match), the project's version takes precedence. Modules provide *defaults*.
-   **Restriction**: Modules **CANNOT** contribute to `content/menus/`. Navigation is strictly site-specific.

### 2. Component Integration
**System**: `src/components.ts`

The system automatically discovers Astro components in `src/components/` using `import.meta.glob`.

-   **Widgets** (`src/components/widgets/*.astro`): Content display components (e.g., Hero, PricingCard).
-   **Forms** (`src/components/forms/*.astro`): Form inputs and containers.
-   **Sections** (`src/components/sections/*.astro`): Layout containers (e.g., SingleColumn, Header).

**Usage**: Once a component is in the module, it is automatically available to be referenced in YAML content by its filename (e.g., `component: MyModuleWidget`).

> **Tip**: Namespace your components to avoid collisions (e.g., `StripeCheckout.astro` instead of `Checkout.astro`).

### 3. Route Injection (Pages & APIs)
**System**: `plugins/modules/index.ts`

Traditional Astro pages and API endpoints in `src/pages/` are automatically injected into the application's route map.

-   **API Endpoints**: `.ts` files. Great for webhooks, proxying requests, or server-side logic.
-   **UI Pages**: `.astro` files. Use this for complex, code-heavy pages that cannot be expressed purely in YAML content.
-   **Routing**: The file path determines the URL route.
    -   `src/pages/api/hooks/stripe.ts` -> `/api/hooks/stripe`
    -   `src/pages/store/checkout.astro` -> `/store/checkout`

### 4. Theme & Styling
**System**: `src/utils/theme.ts`
**Reference**: `dev/theme_design.rst`

Modules can contribute styling definitions via `theme/style.yaml`.

-   **Structure**: The file follows the same schema as `src/themes/[theme]/style.yaml`.
-   **Merge Logic**: **User (content/style.yaml) > Theme (src/themes/...) > Module**.
    -   Modules provide the *base* layer of styling.
    -   The active theme overrides the module.
    -   The user's local content config overrides everything.
-   **Best Practice**: Define component-specific styles using the `Component+Name` syntax to localize styles to your module's components.

```yaml
Component+MyModuleWidget:
  container: "p-4 bg-gray-100 rounded-lg"
  title: "text-xl font-bold"
```

---

## Developing a Module

### Step 1: Create the Directory
Create a new directory in `modules/` with your module name.
`mkdir -p modules/my-feature`

### Step 2: Create the Manifest
Create `modules/my-feature/module.yaml`:
```yaml
name: my-feature
version: 0.1.0
description: Adds amazing feature X to Astrical
```

### Step 3: Add Functionality
-   **Need a UI component?** Add `src/components/widgets/MyWidget.astro`.
-   **Need an API route?** Add `src/pages/api/my-handler.ts`.
-   **Need default content?** Add `content/pages/my-feature-page.yaml`.

### Step 4: Verify
Run `npm run validate` to ensure your content and styles are valid.
Run `npm run dev` to see your module in action.

---

## CLI Management
Astrical provides a CLI to manage modules.

-   **Install**: `npm run modules add <git-repo-url>`
    -   Clones the repository into `modules/`.
-   **Update**: `npm run modules update <module-name>`
    -   Pulls the latest changes.
-   **Remove**: `npm run modules remove <module-name>`
    -   Deletes the module directory.
-   **List**: `npm run modules list`
    -   Shows installed modules.

---

## Best Practices for AI Agents

When generating modules:
1.  **Self-Containment**: Keep all logic within your module directory. Do not modify files outside of `modules/`.
2.  **Namespacing**: Prefix component names and route paths to prevent conflicts with the host application or other modules.
3.  **Config-Driven**: Expose configuration options in `content/config.yaml` (if applicable) so users can customize behavior without changing code.
4.  **Robustness**: Handles missing config gracefully. Provide sensible defaults in your code.
