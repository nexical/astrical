=======================
Architecture Document
=======================

1. Project Overview & Core Philosophy
=====================================

**Project Purpose**

Schemata is an open-source [Astro](https://astro.build/) theme and framework designed specifically for **AI-driven development**. It decouples content and structure from code, allowing AI agents to build, update, and manage complex websites purely by manipulating structured YAML data.

Traditional web development requires AI to understand complex codebases, component logic, and framework nuances. Schemata flips this model:

**Core Philosophy**

The project's architecture is guided by several core principles:

*   **Declarative Content (Content as Configuration)**: The entire site structure, including pages, sections, and component compositions, is defined in YAML files located in the ``/content`` directory. This separates the content and structure from the presentation logic, allowing non-developers to manage the site's content easily.

*   **Component-Based Architecture**: The UI is built from a collection of reusable Astro components, categorized into layouts, widgets, and UI primitives. These components are dynamically rendered based on the YAML configurations.

*   **Separation of Style and Structure**: Styling is managed through a theming system. Each theme, located in ``/src/themes``, defines its own styles (``style.yaml``) and global CSS. This allows the site's appearance to be changed independently of its content and structure.

*   **Data-Driven Generation**: The website is almost entirely generated from structured data (YAML). This includes page content, navigation menus, and component properties. Utility scripts and Astro's data loading capabilities process this data at build time to construct the final static site.

*   **YAML First, Code Last**: The primary development method is modifying YAML configuration. Creating new Astro components or TypeScript code should be a **last resort**, reserved only for capabilities that cannot be achieved through the existing flexible component system and theming engine. AI agents must prioritize content and configuration changes over code generation.

2. Technology Stack & Key Dependencies
======================================

The project is built on a modern web stack, leveraging TypeScript for type safety and Astro for performance.

*   **Core Framework**: `Astro <https://astro.build/>`_
*   **Language**: `TypeScript <https://www.typescriptlang.org/>`_
*   **Styling**: `Tailwind CSS <https://tailwindcss.com/>`_
*   **Deployment**: `Cloudflare Pages <https://pages.cloudflare.com/>`_ (inferred from ``@astrojs/cloudflare`` adapter)

**Key Dependencies:**

*   ``astro``: The core static site generation framework.
*   ``@astrojs/mdx``: For rendering Markdown pages (e.g., Privacy Policy).
*   ``@astrojs/sitemap``: For automatic sitemap generation.
*   ``@astrojs/cloudflare``: Adapter for deploying the site to Cloudflare Pages.
*   ``tailwindcss``: A utility-first CSS framework for styling.
*   ``js-yaml``: For parsing the YAML content files.
*   ``astro-icon``: For embedding SVG icons.
*   ``lodash.merge``: For deep-merging configuration objects.
*   ``nanostores``: For client-side state management, used for form error handling.

3. Directory Structure
======================

The repository is organized to separate content, source code, and configuration.

*   ``/``
    *   ``astro.config.ts``: Main Astro configuration file.
    *   ``package.json``: Project dependencies and scripts.
    *   ``content/``: Contains all site content as YAML files.
        *   ``config.yaml``: Global site configuration (metadata, analytics, UI theme).
        *   ``menus/``: Defines navigation menus (header, footer, social).
        *   ``pages/``: Defines the content and structure for each page.
        *   ``shared/``: Reusable content components that can be referenced by pages.
        *   ``style.yaml``: User-level style overrides for the active theme.
    *   ``public/``: Static assets that are copied directly to the build output (e.g., images, PDFs, ``robots.txt``).
    *   ``src/``: All application source code.
        *   ``assets/``: Static assets processed by Astro (e.g., favicons).
        *   ``components/``: Reusable Astro components.
            *   ``common/``: Site-wide components like ``Metadata.astro``.
            *   ``forms/``: Form-related components.
            *   ``page/``: Page-level structural components (``Header.astro``, ``Footer.astro``).
            *   ``sections/``: Section layout components (``SingleColumn.astro``, ``TwoColumn.astro``).
            *   ``ui/``: Low-level UI primitives (``Button.astro``, ``WidgetWrapper.astro``).
            *   ``widgets/``: High-level content blocks (``Hero.astro``, ``Content.astro``).
        *   ``layouts/``: Astro layout components that define page shells (``BaseLayout.astro``, ``PageLayout.astro``).
        *   ``pages/``: Astro pages and API endpoints.
            *   ``[...page].astro``: The main dynamic route that renders content pages.
            *   ``[...page].json.ts`` / ``.yaml.ts``: Exposes the raw data for each page.
            *   ``data.json.ts`` / ``.yaml.ts``: Exposes the entire site's content database.
            *   ``api/submit-form.ts``: Server-side endpoint for handling form submissions via Mailgun.
        *   ``themes/``: Contains theme definitions. Each theme has its own directory with a ``style.yaml`` and ``global.css``.
        *   ``types/``: TypeScript type definitions for data structures.
        *   ``utils/``: Utility functions for routing, theming, image optimization, etc.
    *   ``plugins/``: Custom Astro integrations, such as the ``site-config`` plugin for loading YAML configuration.
    *   ``scripts/``: Node.js scripts for validation tasks (e.g., ``validate-content.ts``).

4. Core Architecture & Data Flow
=================================

The system is designed around a data-driven rendering pipeline that transforms YAML content into a static website at build time.

**End-to-End Data Flow:**

1.  **Configuration Loading**:
    *   The custom Astro integration defined in ``plugins/config/index.ts`` is initiated.
    *   It reads ``content/config.yaml`` to get global site settings (site URL, theme, analytics IDs).
    *   This configuration is exposed as a virtual module, ``site:config``, which can be imported throughout the project.

2.  **Static Path Generation**:
    *   During the build process, Astro calls ``getStaticPaths`` in dynamic route files like ``src/pages/[...page].astro``.
    *   This function calls ``generateLinks()`` (from ``src/utils/generator.ts``), which in turn calls ``routes()`` (from ``src/utils/router.ts``).
    *   The ``routes()`` function uses ``getSpecs('pages')`` to load all page definitions from the ``content/pages/`` directory.
    *   The core loader logic is in ``src/utils/loader.ts``. The ``getContent()`` function recursively reads all YAML files, resolves shared component references (e.g., a page embedding a component from ``content/shared/``), and caches the result.
    *   This process generates a list of all page slugs, which Astro uses to create a static route for each page.

3.  **Page Rendering**:
    *   When a request for a page (e.g., ``/about``) is handled, ``src/pages/[...page].astro`` is rendered.
    *   It retrieves the specific data for the requested page from the loaded content cache: ``const pageData = allPages[page]``.
    *   It then renders the ``PageLayout.astro``, passing page-specific metadata.

4.  **Layout and Theming**:
    *   ``PageLayout.astro`` uses ``BaseLayout.astro`` as its foundation.
    *   ``BaseLayout.astro`` dynamically imports the global CSS for the active theme (e.g., ``src/themes/default/global.css``) based on the ``UI.theme`` value from the ``site:config`` module.
    *   ``PageLayout.astro`` renders the site ``Header`` and ``Footer``, fetching their content (links, social media) via generator functions in ``src/utils/generator.ts`` which read from the ``menus`` spec.

5.  **Section and Component Rendering**:
    *   The ``[...page].astro`` file iterates through the ``sections`` array in the page's data.
    *   For each section object, it renders a ``<SectionComponent>`` (from ``src/components/page/Section.astro``).
    *   ``SectionComponent`` acts as a dynamic dispatcher. It looks up the layout component (e.g., ``SingleColumn``) specified in ``section.layout`` from the ``supportedLayouts`` map (defined in ``src/components.ts``) and renders it, passing the section data as props.
    *   The layout component (e.g., ``src/components/sections/SingleColumn.astro``) then iterates through its own ``components`` array (e.g., ``section.components.main``).
    *   It calls ``generateSection()`` (from ``src/utils/generator.ts``), which looks up the component's ``type`` (e.g., ``Content``, ``Hero``) in the ``supportedTypes`` map and returns the corresponding Astro component factory and its props.
    *   Finally, the layout component renders the widget component (e.g., ``<Content {...props} />``).

6.  **Styling**:
    *   Components retrieve their styles using the ``getClasses(identifier)`` utility from ``src/utils/theme.ts``.
    *   This utility loads the active theme's ``style.yaml`` and the global ``content/style.yaml``, merges them, and resolves any ``@`` references to other style groups, providing a final set of Tailwind CSS classes for the component.

7.  **Form Submission (Dynamic Action)**:
    *   Forms defined in YAML are rendered by ``src/components/widgets/Form.astro``.
    *   They submit data to ``/api/submit-form``.
    *   The endpoint (``src/pages/api/submit-form.ts``) validates the data against the form definition, uses ``src/utils/mailgun.ts`` to send emails, and returns a JSON response.

5. Core Schemas (The "API Contract")
====================================

The project's data structures are defined by a combination of ``.spec.yaml`` files and the props expected by Astro components.

**Content Pages** (e.g., ``content/pages/home.yaml``)

A page is defined by its metadata and a list of sections.

.. code-block:: yaml

    metadata:
      title: 'Page Title'
      description: 'Page description.'
      # Other metadata like header/footer visibility
    sections:
      - layout: 'SingleColumn' # The layout component to use
        components:
          main: # The target area within the layout
            - type: 'Hero' # The widget component to render
              title: 'Hero Title'
              subtitle: 'Hero subtitle.'
              # ... other component props
            - type: 'Content'
              # ... other component props

**Component Data**

Each widget component is defined by a ``type`` and a set of properties. These are specified in ``src/components/widgets/*.spec.yaml``.

*   **Hero Widget** (``type: Hero``)
    *   ``title`` (string)
    *   ``subtitle`` (string)
    *   ``tagline`` (string)
    *   ``actions`` (array of CallToAction objects)
    *   ``image`` (Image object)

*   **Content Widget** (``type: Content``)
    *   ``title`` (string)
    *   ``subtitle`` (string)
    *   ``content`` (string, HTML)
    *   ``items`` (array of Item objects)
    *   ``image`` (Image object)
    *   ``isReversed`` (boolean)

*   **Features2 Widget** (``type: Features2``)
    *   ``title`` (string)
    *   ``subtitle`` (string)
    *   ``columns`` (integer)
    *   ``items`` (array of Item objects with ``title``, ``description``, ``icon``)

*   **Form Widget** (``type: Form``)
    *   ``name`` (string, unique form identifier)
    *   ``title`` (string)
    *   ``fields`` (array of field objects, e.g., ``ShortText``, ``Email``, ``Select``)
    *   ``recipients`` (array of email strings)
    *   ``redirect`` (string, URL path)

**Theme Manifests** (``src/themes/{theme}/style.yaml``)

The theme file is a map where keys are component identifiers and values are strings of Tailwind CSS classes. It allows for centralized styling of all components.

.. code-block:: yaml

    # Example from src/themes/default/style.yaml
    Component+Button:
      icon: 'w-5 h-5 ml-1 -mr-1.5 rtl:mr-1 rtl:-ml-1.5 inline-block'
      primary: 'btn-primary'
      secondary: 'btn-secondary'
      tertiary: 'btn btn-tertiary'
      link: 'cursor-pointer hover:text-primary'

    Component+Headline:
      container: 'mb-8 md:mx-auto md:mb-12 text-center max-w-3xl'
      tagline: 'text-base text-secondary dark:text-blue-200 font-bold tracking-wide uppercase'
      title: 'font-bold leading-tighter tracking-tighter font-heading text-heading text-3xl md:text-4xl'
      subtitle: 'mt-4 text-muted text-xl'

6. Development Workflow & Scripts
=================================

The ``package.json`` file defines the primary scripts for development, building, and validation.

*   ``npm run dev``
    *   Runs ``astro dev``.
    *   Starts the Astro development server with hot-reloading. Ideal for local development.

*   ``npm run build``
    *   Runs ``npm run validate && astro check && astro build``.
    *   First, it runs content and theme validation scripts. Then, it type-checks the project with ``astro check``. Finally, it builds the static site for production.

*   ``npm run preview``
    *   Runs ``astro preview``.
    *   Starts a local server to preview the production build.

*   ``npm run check``
    *   Runs ESLint and Prettier checks to enforce code quality and style consistency.

*   ``npm run fix``
    *   Automatically fixes ESLint and Prettier issues.

*   ``npm run validate``
    *   Runs ``npm run validate-content && npm run validate-themes``.
    *   ``validate-content`` (``scripts/validate-content.ts``): Validates all YAML files in ``content/`` against their corresponding ``.spec.yaml`` schemas.
    *   ``validate-themes`` (``scripts/validate-themes.ts``): Validates all theme ``style.yaml`` files against the master ``src/themes/style.spec.yaml`` schema.

7. Advanced Architectural Patterns (AI Operations)
==================================================

This section defines the standard patterns for handling dynamic features, state, and integrations.

Island Architecture & Interactivity
-----------------------------------

Astro uses "Island Architecture," meaning the site is static HTML by default. JavaScript is only loaded for specific interactive components ("islands").

*   **Default Strategy**: All components must be server-rendered static HTML.
*   **When to Hydrate**: Only use client-side hydration for components requiring immediate user feedback (e.g., Mobile Menus, Carousels, Search Bars, Form Validation).
*   **Directives**:
    *   ``client:load``: For critical UI elements that must be interactive immediately (e.g., Navigation).
    *   ``client:visible``: For heavy components below the fold (e.g., Carousels).
    *   ``client:media``: For components that only load on specific viewports (e.g., Mobile Sidebar).
*   **Framework Choice**: Use **Vanilla JavaScript** for simple DOM manipulation. Use **Preact** if complex state management is required. Avoid React unless a specific library mandates it.

Global State Management
-----------------------

When components need to share state (e.g., a "Subscribe" button in the footer updating a "Success Message" in the header), use **Nanostores**.

*   **Pattern**: Shared state must live in ``src/stores/``.
*   **Implementation**:
    1.  Create a store: ``src/stores/uiStore.ts``.
    2.  Import and subscribe within your island components.
    3.  **Constraint**: Never rely on window globals or parent-child prop drilling across Astro islands.

Dynamic Data & API Integration
------------------------------

While the core site is YAML-driven, comprehensive sites may need external data.

*   **Build-Time Data (Static)**:
    *   **Use Case**: Fetching content from a Headless CMS or external API to generate pages.
    *   **Pattern**: Create a loader function in ``src/utils/loaders/``. Call this function inside ``getStaticPaths()`` or the component frontmatter.
*   **Runtime Data (Dynamic)**:
    *   **Use Case**: Live stock prices, search results, user-specific data.
    *   **Pattern**: Use client-side ``fetch()`` in an island component.
*   **API Proxying**:
    *   **Security**: Never expose API keys in client-side code.
    *   **Pattern**: Create server-side endpoints in ``src/pages/api/`` (e.g., ``src/pages/api/search.ts``) to proxy requests and handle authentication.

Third-Party Integrations
------------------------

*   **Global Scripts**: Analytics, Chat widgets, and Tracking pixels must be injected via the ``Metadata`` component or a dedicated ``Integration`` layout. **Do not** inject ``<script>`` tags into individual UI widgets.
*   **Performance**: Use the ``partytown`` integration to offload heavy third-party scripts to a web worker.

8. Architectural Decision Matrix (ADR)
======================================

Use this matrix to make high-level architectural decisions without human intervention.

+---------------------------+-----------------------------------------------------------------------+
| **User Request**          | **Architectural Decision**                                            |
+===========================+=======================================================================+
| "Add a blog"              | Use **Content Collections** (Markdown/MDX), not YAML pages.           |
+---------------------------+-----------------------------------------------------------------------+
| "Add a user dashboard"    | Requires backend logic. Recommend a **sub-domain** or switch Astro    |
|                           | to **SSR mode** (Hybrid Rendering).                                   |
+---------------------------+-----------------------------------------------------------------------+
| "Add a contact form"      | Use the standard ``Form`` widget. Configure it to post to a           |
|                           | serverless function or external service (e.g., Formspree).            |
+---------------------------+-----------------------------------------------------------------------+
| "Add a search bar"        | Use a client-side search library (e.g., Pagefind) for static sites.   |
|                           | Do not build a custom search backend unless requested.                |
+---------------------------+-----------------------------------------------------------------------+
| "Add a complex calculator"| Build as a **Preact Island** component.                               |
+---------------------------+-----------------------------------------------------------------------+

9. Guide References
===================

For more detailed information on specific aspects of the project, please refer to the following guides:

 * `Theme Design Guide <theme_design.rst>`_
 * `Content Management Guide <content_management.rst>`_
 * `Component Development Guide <component_dev.rst>`_
