=======================
AI Theming Engine Guide
=======================

This guide provides detailed instructions for an AI agent to create and update themes for the web application. The theming system is built on a combination of CSS custom properties (variables), Tailwind CSS utility classes, and component-specific style configurations.

As an AI agent, your primary task is to translate user requests for visual changes into precise modifications of the theme files.

Core Theming Files
------------------

You will primarily interact with two files located in the theme's directory, ``src/themes/[theme-name]/``:

*   ``global.css``: Defines the core design tokens, such as colors and fonts, using CSS custom properties for both light and dark modes. It also includes custom utility classes like ``.btn-primary``. **Modify this file for site-wide color palette, font, or base button style changes.**
*   ``style.yaml``: Applies Tailwind CSS classes to specific components and their sub-elements. This file controls layout, spacing, and component-specific visual styles. **This is the most common file you will edit.**

A third file, ``tailwind.config.js``, maps the CSS variables to Tailwind utility classes (e.g., ``bg-primary``). You should rarely need to edit this file.

The Guiding Specification: ``dev/theme.spec.yaml``
-------------------------------------------------

To understand how to style components, you **must** use ``dev/theme.spec.yaml`` as your guide. This specification file acts as a schema for ``style.yaml``. It defines:

*   All available style groups (e.g., ``Component+Hero``, ``Page+Header``).
*   All stylable properties within each group (e.g., ``title``, ``subtitle``, ``container``).
*   A description of what each property controls.

**Always consult this file to determine the correct group and property name before editing ``style.yaml``.**

Workflow for Theming
====================

Follow this step-by-step process to handle any theme modification request.

Step 1: Analyze the User Request
--------------------------------

First, determine the nature of the change:

1.  **Global Style Change:** Does the request involve changing a core color (like the "primary" or "accent" color), a site-wide font, or the fundamental appearance of all buttons? If yes, proceed to Step 2.
2.  **Component-Specific Change:** Does the request involve changing the layout, spacing, color, or font of a *specific* part of the site (e.g., "make the hero title bigger," "change the background of the footer," "add more padding to the pricing cards")? If yes, proceed to Step 3.

Step 2: Modifying Global Styles in ``global.css``
-------------------------------------------------

Use this file for site-wide design token changes.

**Changing Colors:**

1.  Locate the CSS custom properties section in ``global.css``.
2.  Colors are defined for light mode (under ``:root``) and dark mode (under ``.dark``). You must update both.
3.  Identify the correct color variable to change based on its semantic name.

    *   ``--aw-color-primary``: The main brand color.
    *   ``--aw-color-secondary``: A secondary brand color.
    *   ``--aw-color-accent``: An accent color for special highlights.
    *   ``--aw-color-text-default``: The default text color.
    *   ``--aw-color-text-muted``: For secondary or less important text.
    *   ``--aw-color-bg-page``: The main background color of pages.
    *   ``--aw-color-surface``: Background for card-like elements.
    *   ``--aw-color-border``: Default border color.

4.  Modify the ``rgb(...)`` value for the chosen variable in both ``:root`` and ``.dark`` blocks.

*Example: User asks to "change the primary color to a shade of green."*

.. code-block:: css

   /* In :root (light mode) */
   --aw-color-primary: rgb(22 163 74); /* Modify this value */

   /* In .dark (dark mode) */
   --aw-color-primary: rgb(34 197 94); /* Modify this value */

**Generating and Implementing a Color Palette**

A good theme starts with a well-chosen color palette. This involves some basic color theory.

*Color Theory Basics:*

*   **Monochromatic:** Uses variations (tints, tones, shades) of a single color. Creates a clean, elegant, and harmonious look.
*   **Analogous:** Uses colors that are next to each other on the color wheel. This creates a serene and comfortable design.
*   **Complementary:** Uses colors that are opposite each other on the color wheel (e.g., blue and orange). This creates high contrast and a vibrant, energetic feel. Use one color as dominant and the other for accents.
*   **Triadic:** Uses three colors that are evenly spaced on the color wheel. This offers high contrast while retaining harmony.

*Choosing and Generating a Scheme:*

For most brand identities, a simple scheme (like Monochromatic or Complementary) is effective. You can use online tools like `Coolors.co` or `Adobe Color` to generate a full palette from a starting brand color. A good palette includes:

*   **Primary Color:** The main brand color for buttons and key actions.
*   **Secondary Color:** A supporting color, often used for hover states or less important buttons.
*   **Accent Color:** A color for special highlights, notifications, or sale ribbons.
*   **Neutral Palette:** A range of neutral colors (e.g., grays, off-whites) for text, backgrounds, and surfaces. This is crucial for creating depth and readability.

*Implementing the Palette in ``global.css``:*

Once you have your colors (as RGB or HSL values), implement them by updating the CSS custom properties in ``global.css``.

1.  **Update Brand Colors:** Replace the values for ``--aw-color-primary``, ``--aw-color-secondary``, and ``--aw-color-accent``.
2.  **Update Neutral Colors:** Use your neutral palette to define ``--aw-color-text-default``, ``--aw-color-text-muted``, ``--aw-color-bg-page``, ``--aw-color-surface``, and ``--aw-color-border``.
3.  **Update Dark Mode:** Crucially, you must also define the corresponding colors for dark mode under the ``.dark`` selector. Dark mode colors are not just inverted; they are often less saturated and have adjusted brightness to reduce eye strain. Ensure there is sufficient contrast for accessibility.

**Changing Button Styles:**

The base styles for buttons are defined in custom utility classes like ``.btn`` and ``.btn-primary``. These use Tailwind's ``@apply`` directive. To change the fundamental style of all primary buttons, you would modify the ``@utility btn-primary`` rule.

.. code-block:: css

   @utility btn-primary {
     @apply btn font-semibold bg-primary text-white border-transparent hover:bg-secondary hover:text-white;
   }

Step 3: Styling Components in ``style.yaml``
--------------------------------------------

This is your primary task for most theming requests. You will apply or change Tailwind CSS classes for specific components.

**Workflow:**

1.  **Identify the Component:** From the user's request, identify the component to be styled (e.g., "Hero widget," "page header," "pricing plan cards").

2.  **Consult the Specification:** Open ``dev/theme.spec.yaml`` and search for the style group corresponding to the component. The groups are named semantically, such as ``Component+Hero``, ``Page+Header``, or ``Component+Pricing``.

3.  **Find the Property:** Within the style group in the spec, find the property that controls the element you need to change. The spec provides descriptions for each property. For example, to change the hero title, you would look for ``title`` inside the ``headline`` object of the ``Component+Hero`` group.

4.  **Locate in ``style.yaml``:** Open ``src/themes/[theme-name]/style.yaml`` and find the exact same style group and property.

5.  **Modify the Classes:** The value of the property is a string of Tailwind CSS utility classes. Add, remove, or change classes in this string to implement the user's request.

*Example: User asks to "make the hero title larger and change its color in dark mode."*

1.  **Component:** Hero widget.
2.  **Specification:** In ``dev/theme.spec.yaml``, find ``Component+Hero``.
3.  **Property:** Inside ``Component+Hero``, you find ``headline``, and within that, ``title``. The description confirms this styles the main `<h1>` title.
4.  **Locate:** In ``style.yaml``, find the ``Component+Hero`` group.
5.  **Modify:** Update the ``title`` property under ``headline``.

.. code-block:: yaml

   Component+Hero:
     headline:
       # ... other properties
       title: 'text-6xl md:text-7xl font-bold leading-tighter tracking-tighter font-heading dark:text-gray-100' # Changed text-5xl->6xl, md:text-6xl->7xl, and dark:text-gray-200->100

**Using Style Variables:**

Some properties in ``style.yaml`` may reference other styles using an ``@`` prefix (e.g., ``@section_columns``). These variables are defined at the root of ``style.yaml`` and are used for consistency. If you change the variable, it will affect all properties that reference it.

.. code-block:: yaml

   section_columns: 'gap-12 md:gap-20'

   Section+TwoColumn:
     column_wrapper: '@section_columns' # This now resolves to 'gap-12 md:gap-20'

**Applying the Color Scheme to Components**

With a global color palette defined in ``global.css``, you can now apply it to individual components in ``style.yaml`` to create visual hierarchy and a cohesive design.

*Creating Depth and Focus:*

The theme uses different background colors to create a sense of depth.

*   ``bg-page``: The base background for the entire page.
*   ``bg-surface``: A slightly different color used for "cards" or panels that should appear layered on top of the page background.
*   ``bg-surface-elevated``: An even more distinct color for elements that need to stand out further, like modals or highlighted cards.

You can use these semantic background colors in ``style.yaml`` to make certain sections or widgets visually distinct.

*Example: Making a CallToAction widget stand out.*

Suppose you want a ``CallToAction`` widget to have a different background to draw the user's eye.

1.  **Consult the Spec:** In ``dev/theme.spec.yaml``, find ``Component+CallToAction``. You'll see it has a ``container`` property that styles the main box.
2.  **Modify ``style.yaml``:** In your theme's ``style.yaml``, find ``Component+CallToAction`` and modify the ``container`` property. The default uses ``bg-surface``. You could change it to use the primary color for high impact.

.. code-block:: yaml

   Component+CallToAction:
     # The default is '... bg-surface ...'
     container: 'max-w-3xl mx-auto text-center p-6 rounded-md border-0 bg-primary shadow-xl'
     # We also need to adjust text colors for contrast
     headline:
       title: 'text-white'
       subtitle: 'text-white/80'

This example shows how you can override the default styles for a specific component to match your theme's goals, ensuring that important elements get the user's attention. Always check the specification to see which properties are available for styling.

Working with Background Images
------------------------------

Many section and widget components support a ``bg`` property for adding a background image. This is defined in the component's data file (e.g., a page in ``content/pages/``), not in ``style.yaml``.

To use it:

1.  **Reference a Remote Image:** Provide the full URL.

    .. code-block:: yaml

       bg: 'https://images.unsplash.com/photo-12345.jpeg'

2.  **Reference a Local Image:** Place the image in the ``public/`` directory (e.g., ``public/images/my-background.jpg``) and reference it from the root of the site.

    .. code-block:: yaml

       bg: '/images/my-background.jpg'

When a ``bg`` image is used, you can apply an overlay to improve text contrast. This is done in ``style.yaml`` by modifying the ``overlay`` property within the component's ``wrapper`` classes.
*Example: Add a dark overlay to a Hero component's background image.*

.. code-block:: yaml

   Component+Hero:
     wrapper:
       overlay: 'bg-black/50' # Adds a 50% transparent black overlay

Design Intelligence & AI Operations
===================================

This section provides the "design logic" required to create professional, aesthetically pleasing themes without human guidance.

Visual Hierarchy Standards
--------------------------

AI models must enforce a strict hierarchy to prevent "flat" designs.

*   **Typography Scale**:
    *   **H1 (Hero Title)**: ``text-4xl md:text-6xl font-bold tracking-tight``
    *   **H2 (Section Title)**: ``text-3xl md:text-4xl font-bold``
    *   **H3 (Card Title)**: ``text-xl font-semibold``
    *   **Body**: ``text-base leading-relaxed text-muted``
    *   **Tagline**: ``text-sm font-bold uppercase tracking-wide text-secondary``

*   **Color Semantics**:
    *   **Primary**: Use for **Action** (Buttons, Links, Active States).
    *   **Secondary**: Use for **Identity** (Icons, Illustrations, Highlights).
    *   **Neutral**: Use for **Structure** (Text, Borders, Backgrounds).
    *   **Muted**: Use for **De-emphasis** (Supporting text, inactive states).

Advanced Backgrounds & Overlays
-------------------------------

Handling text contrast on dynamic backgrounds is critical.

*   **The Golden Rule**: When using a background image, **ALWAYS** apply an overlay.
*   **Techniques**:
    *   **Solid Dimming**: ``bg-black/60`` (Safe, standard).
    *   **Gradient Fade**: ``bg-gradient-to-r from-black/80 via-black/50 to-transparent`` (Modern, adds depth).
    *   **Colored Tint**: ``bg-primary/90`` (Strong branding).
*   **Implementation**:
    *   **Image**: Defined in Content YAML (e.g., ``bg: '/images/hero.jpg'``).
    *   **Overlay**: Defined in Theme YAML (``Component+Hero: wrapper: overlay: '...'``).

Card Design Patterns
--------------------

"Cards" are the fundamental unit of modern web design (Features, Pricing, Testimonials).

*   **Surface**: Use ``bg-surface`` (e.g., white or light gray) to separate cards from the ``bg-page``.
*   **Elevation**:
    *   **Default**: ``shadow-sm border border-border`` (Clean, minimal).
    *   **Hover**: ``hover:shadow-xl transition-shadow duration-300`` (Interactive feel).
*   **Spacing**: Standard padding is ``p-6`` or ``p-8``. **Never** use less than ``p-4``.
*   **Radius**: Match the brand vibe. ``rounded-none`` (Serious), ``rounded-lg`` (Standard), ``rounded-2xl`` (Playful).

Responsive Design Rules (Mobile-First)
--------------------------------------

AI must design for mobile first, then enhance for desktop.

*   **Grid Layouts**:
    *   Start with ``grid-cols-1``.
    *   Expand to ``md:grid-cols-2`` for tablets.
    *   Expand to ``lg:grid-cols-3`` for desktops.
*   **Spacing**:
    *   **Container Padding**: ``px-4`` (Mobile) -> ``md:px-8`` (Desktop).
    *   **Section Spacing**: ``py-12`` (Mobile) -> ``md:py-20`` (Desktop).
*   **Typography**: Use responsive prefixes. ``text-3xl md:text-5xl``.

Theme Archetypes (Recipes)
--------------------------

Use these pre-sets as a starting point for different brand personalities.

*   **"Corporate Minimal"**:
    *   **Font**: Sans-serif (Inter/Roboto).
    *   **Colors**: Blue/Gray palette.
    *   **Shape**: ``rounded-md``.
    *   **Style**: Flat buttons, subtle borders, no shadows.

*   **"Modern SaaS"**:
    *   **Font**: Geometric Sans (Outfit/Plus Jakarta).
    *   **Colors**: Indigo/Purple palette with gradients.
    *   **Shape**: ``rounded-xl``.
    *   **Style**: Heavy shadows, glassmorphism effects (``backdrop-blur``), vibrant accents.

*   **"Creative / Bold"**:
    *   **Font**: Serif Headings (Playfair), Sans Body.
    *   **Colors**: High contrast (Black/White) or Earth tones.
    *   **Shape**: ``rounded-none`` (Sharp).
    *   **Style**: Thick borders (``border-2``), large typography, brutalist elements.

Step 4: Advanced Theming (``tailwind.config.js``)
=================================================

The theme's ``tailwind.config.js`` file maps the CSS variables from ``global.css`` to semantic Tailwind color names (e.g., ``primary: 'var(--aw-color-primary)'``).

This setup allows you to use semantic classes like ``bg-primary`` and ``text-muted`` in ``style.yaml``. **You should not need to edit this file.** All color changes should be made to the CSS variables in ``global.css`` as described in Step 2.

How Theming Works Under the Hood
================================

The theme engine is powered by a utility file at ``src/utils/theme.ts``. Understanding its mechanism helps in debugging and advanced theming.

The `getClasses` Utility Function
---------------------------------

Every layout, section, and widget component that is themeable uses the ``getClasses`` utility function. It is the bridge between the ``style.yaml`` configuration and the component's HTML elements.

When a component like ``Hero.astro`` is rendered, it calls ``getClasses``:

.. code-block:: javascript

   // Inside a component like Hero.astro
   const classes = getClasses('Component+Hero', rawClasses);

Here's what happens inside ``getClasses('Component+Hero', rawClasses)``:

1.  **Load Styles:** The function first loads the merged ``style.yaml`` from the current theme's directory. This is cached in production for performance.
2.  **Find Style Group:** It looks for the ``Component+Hero`` key within the loaded YAML data.
3.  **Resolve Variables:** It recursively resolves any ``@`` variables (like ``@section_columns``) found within the ``Component+Hero`` style group, replacing them with their defined values.
4.  **Merge Overrides:** The ``rawClasses`` argument contains any ``classes`` object passed directly as a prop to the component from a page's content file. The function merges these override classes into the theme styles. This allows for per-instance style customizations.
5.  **Return Final Classes:** The function returns a final, merged object of Tailwind CSS class strings that the component can then apply to its internal elements (e.g., ``classes.title``, ``classes.container``).

This process ensures that there is a clear hierarchy: **Theme Defaults < User Overrides (from props)**. It also makes the system highly configurable and consistent.
