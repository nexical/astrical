# Astrical Architecture Guide

## 1. Project Overview & Core Philosophy

Astrical is an AI-first, Astro-based CMS and Digital Experience Platform (DXP) designed to decouple content and structure from the underlying code. This architecture enables AI agents (and humans) to build, manage, and scale enterprise-grade websites primarily through declarative YAML configuration, minimizing the need for direct code manipulation.

### Core Philosophy

-   **Content as Configuration**: The site's entire structure—pages, menus, global settings, and even styles—is defined in structured YAML files within the `content/` and `themes/` directories.
-   **Code as Engine**: The `src` directory contains the immutable engine logic, component library, and data processing pipelines. This layer transforms the declarative YAML into a performant static site.
-   **CLI as Interface**: The system is managed via `cli` tools, abstracting complex operations into simple commands.
-   **YAML First, Code Last**: Extending functionality should first be attempted by composing existing components via YAML. Writing new code in `src` or `modules` is a secondary measure reserved for genuine feature extensions.

## 2. Physical Architecture

The codebase is organized into three distinct layers, each with a specific responsibility.

### 2.1 The Workspace (`content/`)
This is the user's domain. It contains strictly declarative data.
-   `config.yaml`: Global site settings (metadata, analytics, enabled features).
-   `pages/`: Page definitions (URL structure, component composition).
-   `menus/`: Navigation structures.
-   `shared/`: Reusable content widgets.
-   `style.yaml`: User-specific overrides for the active theme.

### 2.2 The Engine (`core/`)
This is the framework kernel. It is generally treated as immutable infrastructure.
-   `plugins/`: Vite and Astro integration plugins that power the architecture.
    -   `config/`: The configuration engine that initiates the build.
    -   `modules/`: The module loader.
-   `src/`: The runtime source code.
    -   `components/`: The component library (Widgets, Forms, Sections).
    -   `utils/`: Data processing, loading, and generation logic.
    -   `themes-default/`: Base schemas for the theming system.
-   `content-default/`: Fallback content and configurations.
-   `public-default/`: Default static assets (placeholders, etc.).

### 2.3 The Extension Layer (`modules/`)
This is where feature-specific business logic resides.
-   Modules are self-contained Git submodules.
-   They can contribute:
    -   **Components**: Widgets and Sections.
    -   **Form Handlers**: Backend logic for forms.
    -   **Middleware**: Request processing logic.
    -   **API Routes**: Server-side endpoints.

## 3. Logical Architecture

The system operates as a data-driven rendering pipeline.

### 3.1 Configuration Engine (`site:config`)
The entry point of the application is the custom Astro integration located in `plugins/config/index.ts`.

1.  **Loading**: at build start, it reads `content/config.yaml`.
2.  **Normalization**: It validates and normalizes the config using `plugins/config/utils/builder.ts`.
3.  **Virtual Module**: It creates a Vite virtual module named `site:config`.
    -   This module exports global constants: `SITE`, `UI`, `METADATA`, `ANALYTICS`, `FORMS`, etc.
    -   This allows any component in the system to import specific settings: `import { SITE } from 'site:config';`.
4.  **Robots.txt**: It automatically injects sitemap references into `robots.txt` post-build.

### 3.2 Dynamic Component System
Astrical avoids hard-coded imports by using a dynamic component registry system defined in `src/components.ts`.

-   **Discovery**: It uses Vite's `import.meta.glob` to scan specific directories:
    -   `~/components/widgets/**/*.astro`
    -   `~/components/forms/**/*.astro`
    -   `~/components/sections/**/*.astro`
    -   `@modules/*/src/components/**/*.astro` (Module components)
-   **Categorization**:
    -   **Widgets**: Content blocks (Hero, Features, Content).
    -   **Forms**: Input groups and form shells.
    -   **Sections**: Layout containers (SingleColumn, TwoColumn).
-   **Instantiation**: The `supportedTypes` and `supportedLayouts` exports map string names (from YAML) to Astro component factories. This allows the `Section` component to dynamically render `section.layout: 'SingleColumn'` containing `component.type: 'Hero'`.

### 3.3 Data Processing Pipeline
The transformation from YAML to HTML follows a specific flow:

1.  **Loader (`src/utils/loader.ts`)**:
    -   Scans `content/pages/` using `import.meta.glob`.
    -   Resolves references (e.g., merging `shared/` snippets).
    -   Returns raw page objects.
2.  **Generator (`src/utils/generator.ts`)**:
    -   Processes data for specific contexts (e.g., generating menu links, resolving permalinks).
3.  **Router (`src/utils/router.ts`)**:
    -   Maps page objects to URL routes.
    -   Used by `getStaticPaths` in `[...page].astro`.
4.  **Renderer (`src/pages/[...page].astro`)**:
    -   Receives the processed page data.
    -   Iterates over sections.
    -   Delegates rendering to the Dynamic Component System.

### 3.4 Theming Engine
Styling is handled by a cascading configuration system located in `src/utils/theme.ts`.

1.  **Base Theme**: Defined in `src/themes/{active_theme}/style.yaml`.
2.  **User Overrides**: Defined in `content/style.yaml`.
3.  **Merging**: The engine deeply merges these two files.
4.  **Injection**: Components call `getClasses(componentId)` to retrieve their Tailwind classes. This separates the markup (structure) from the visual design (style).

### 3.5 Form System
Forms are data-driven and handle submissions via a registry pattern in `src/form-registry.ts`.

1.  **Definition**: Forms are defined in YAML (fields, validation, endpoint).
2.  **Discovery**: The system scans `src/form-handlers` and `modules/*/src/form-handlers`.
3.  **Registration**: Classes implementing the `FormHandler` interface are registered in the singleton `FormHandlerRegistry`.
4.  **Execution**: When a form is submitted to `/api/submit-form`, the registry looks up the matching handler by name and executes its `handle()` method.

## 4. Extension Points

AI Agents should use these established patterns to extend Astrical:

### Adding a New Component
1.  Create the `.astro` file in `src/components/widgets/` (or `modules/...`).
2.  Create a corresponding `.spec.yaml` to define its data schema.
3.  The system automatically discovers it—no manual registration code is needed.

### Adding a New Form Handler
1.  Create a `.ts` file in `src/form-handlers/` (or `modules/...`).
2.  Export a class that implements `FormHandler`.
3.  The system automatically registers it.

### Adding a New Module
1.  Initialize a new submodule in `modules/`.
2.  Follow the standard directory structure (`src/components`, `src/form-handlers`).
3.  The `site:config` plugin and component loader will automatically ingest its capabilities.
