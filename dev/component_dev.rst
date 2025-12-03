=========================================
Component Development Guide (AI Operations Manual)
=========================================

This guide provides a technical walkthrough for an AI agent on how to create and update the structural components of the website. Components are the foundational building blocks of the site, written as Astro (``.astro``) files.

The core philosophy is a strict **separation of concerns**:

*   **Structure (Components)**: Defined in ``.astro`` files. This is your focus when following this guide. Components are responsible for the HTML structure and accepting data via props. They should be completely agnostic of the content they display and the specific styles they wear.
*   **Content (Data)**: Defined in ``.yaml`` files in the ``/content`` directory. This is managed according to the `Content Management Guide <dev/content_management.rst>`_.
*   **Style (Theme)**: Defined in the ``/src/themes/[theme-name]/`` directory. This is managed according to the `AI Theming Engine Guide <dev/theme_design.rst>`_.

Your role in component development is to act as an architect, creating robust and flexible structures that can be filled with any content and styled by any theme.

Component Philosophy
====================

1.  **Components are for Structure Only**: A component's ``.astro`` file should contain HTML tags and logic for rendering its structure. It **must not** contain hardcoded text, content, or styles. All content is passed in via props, and all styling is applied via CSS classes provided by the theme engine.

2.  **Data-Driven via Props**: Components receive all their data through ``Astro.props``. The properties a component accepts (its "API") must be clearly defined in a TypeScript interface within the component file.

3.  **Themeable by Default**: Every component must be themeable. This is achieved by using the ``getClasses`` utility from ``~/utils/theme.ts``. This function provides the necessary Tailwind CSS classes from the active theme's ``style.yaml``, ensuring that all visual aspects are controlled by the theme, not the component.

Types of Components
===================

The project is organized into three main types of components, located in ``src/components/``:

1.  **UI Components (``ui/``)**
    *   **Purpose**: The smallest, most reusable building blocks. These are the "atoms" of the design system.
    *   **Examples**: ``Button.astro``, ``Image.astro``, ``Headline.astro``, ``WidgetWrapper.astro``.
    *   **Usage**: They are composed together to build larger Widget and Section components.

2.  **Widget Components (``widgets/``)**
    *   **Purpose**: Larger, self-contained content blocks that fulfill a specific purpose on the page. These are the "molecules."
    *   **Examples**: ``Hero.astro``, ``Features.astro``, ``CallToAction.astro``, ``Form.astro``.
    *   **Usage**: Widgets are placed inside Section components to build the body of a page.

3.  **Section Components (``sections/``)**
    *   **Purpose**: The largest layout containers. They define the high-level horizontal structure of a page (e.g., a single full-width column, a two-column split). These are the "organisms."
    *   **Examples**: ``SingleColumn.astro``, ``TwoColumn.astro``, ``Header.astro``.
    *   **Usage**: A page is built by stacking a series of Section components, as defined in a page's ``sections`` array in its content file.

Standard Component Architecture
===============================

To ensure consistency across the library, all components must adhere to the following architectural standards.

Universal Props (The Base Interface)
------------------------------------

All Widget components must accept a standard set of properties to ensure they are interchangeable and predictable.

*   **Text Hierarchy**:
    *   ``title`` (string): The primary headline.
    *   ``subtitle`` (string): A supporting description or sub-headline.
    *   ``tagline`` (string): A small, uppercase label usually above the title.
*   **Visuals**:
    *   ``image`` (object): Must contain ``src`` (string) and ``alt`` (string). Never use a raw string for an image URL.
    *   ``icon`` (string): The name of the icon to display.
*   **Actions**:
    *   ``actions`` (array): A list of call-to-action objects (buttons/links).
    *   ``callToAction`` (object): A single primary action (deprecated in favor of ``actions`` array for flexibility, but still supported).
*   **Layout**:
    *   ``isReversed`` (boolean): Standard prop to flip the visual layout (e.g., image on left vs. right).
    *   ``id`` (string): A unique identifier for the component instance (crucial for JS interactivity).

Approved Asset & Icon Library
-----------------------------

*   **Icons**: Use **Tabler Icons** exclusively.
    *   **Format**: ``tabler:{icon-name}`` (e.g., ``tabler:home``, ``tabler:arrow-right``).
    *   **Usage**: Pass this string to the ``<Icon />`` component. Do not import individual SVG files.
*   **Images**:
    *   **Local**: Store in ``src/assets/images/``. Use Astro's ``<Image />`` component for optimization.
    *   **Remote**: Ensure ``width`` and ``height`` attributes are set to prevent layout shifts.

Engineering Standards & Best Practices
======================================

Defensive Rendering Patterns
----------------------------

AI-generated components must be robust. Never assume data exists.

1.  **Conditional Rendering**: Do not render empty containers.
    *   **Bad**: ``<div class="subtitle">{subtitle}</div>`` (Renders an empty div with padding if subtitle is missing).
    *   **Good**: ``{subtitle && <p class={classes.subtitle}>{subtitle}</p>}``

2.  **Default Values**: Always provide fallback values for visual props in the destructuring assignment.
    *   **Example**: ``const { icon = 'tabler:star', ... } = Astro.props;``

Accessibility (A11y) & Semantic Standards
-----------------------------------------

1.  **Semantic HTML**:
    *   Use ``<section>`` for the top-level widget wrapper.
    *   Use ``<header>`` for the group containing the title and subtitle.
    *   Use ``<article>`` for individual items in a grid.
2.  **Interactive Elements**:
    *   Any element that toggles visibility must use ``aria-expanded`` and ``aria-controls``.
    *   Icons used purely for decoration must have ``aria-hidden="true"``.
3.  **Images**: The ``alt`` prop is mandatory for the ``image`` object.

Client-Side Interactivity
-------------------------

1.  **Script Strategy**: Prefer **Vanilla JavaScript** for simple interactions (toggles, menus). Use ``nanostores`` for shared state across components.
2.  **Scoped Selection**: Never use global selectors like ``document.querySelector('.my-button')``.
    *   **Correct**: Use the component's unique ID.
    *   ``const container = document.getElementById(id);``
    *   ``const button = container.querySelector('.my-button');``

Workflow for Creating a New Component
=====================================

Follow these steps to create a new, fully integrated component. We will use the example of creating a new ``Alert.astro`` widget.

Step 1: Define the Component's Purpose and Structure
----------------------------------------------------

First, decide what the component will do and what data it needs.

*   **Purpose**: The ``Alert`` widget will display a short, important message with a title.
*   **Props (its API)**: It will need a ``title`` (string) and a ``message`` (string). It might also need an ``icon``.

Step 2: Create the Astro File
-----------------------------

Create the new file at ``src/components/widgets/Alert.astro``.

1.  **Define Props**: Start by defining the props interface.
2.  **Get Classes**: Call ``getClasses`` with a unique identifier for this component. The convention is ``Component+<ComponentName>``.
3.  **Write Structure**: Write the HTML structure using semantic tags. Apply the classes from the theme.

.. code-block:: astro

   ---
   // src/components/widgets/Alert.astro
   import type { Widget as WidgetProps } from '~/types';
   import { Icon } from 'astro-icon/components';
   import WidgetWrapper from '~/components/ui/WidgetWrapper.astro';
   import { getClasses } from '~/utils/theme';

   export interface Props extends WidgetProps {
     title: string;
     message: string;
     icon?: string;
   }

   const { id, title, message, icon = 'tabler:info-circle', classes: rawClasses = {}, bg = '' } = Astro.props;

   // The unique identifier 'Component+Alert' links this to style.yaml
   const classes = getClasses('Component+Alert', rawClasses);
   ---
   <WidgetWrapper type="alert" id={id} classes={classes.wrapper} bg={bg}>
     <div class={classes.container}>
       <div class={classes.icon_container}>
         <Icon name={icon} class={classes.icon} />
       </div>
       <div class={classes.content_container}>
         <h3 class={classes.title}>{title}</h3>
         <p class={classes.message}>{message}</p>
       </div>
     </div>
   </WidgetWrapper>

Step 3: Create the Component Specification
------------------------------------------

For every new component, you **must** create a corresponding ``.spec.yaml`` file in the same directory. This file defines the component's schema, which is used for content validation and for the AI to understand how to use it.

Create ``src/components/widgets/Alert.spec.yaml``:

.. code-block:: yaml

   # src/components/widgets/Alert.spec.yaml
   components:
     Alert:
       type: object
       description: Renders a dismissible alert message.
       properties:
         type:
           type: string
           required: true
           enum: [Alert]
           description: "Specifies the component type. Must be 'Alert'."
         title:
           type: string
           required: true
           description: "The title of the alert."
         message:
           type: string
           required: true
           description: "The main message content of the alert."
         icon:
           type: string
           description: "An optional icon to display. Defaults to 'tabler:info-circle'."
         # Standard widget properties
         id:
           type: string
           description: An optional HTML id attribute for the widget container.
         bg:
           type: string
           description: An optional URL for a background image for the widget container.
         classes:
           type: object
           description: An object to override the default CSS classes.
           properties:
             # Define stylable elements from the .astro file
             wrapper:
               type: object
             container:
               type: string
             icon_container:
               type: string
             icon:
               type: string
             content_container:
               type: string
             title:
               type: string
             message:
               type: string

Step 4: Update the Master Content Specification
-----------------------------------------------

After creating the component and its spec file, you must update the master specification file. This makes the component "discoverable" by the content and theming systems.

Run the following command from the project root:

.. code-block:: bash

   npm run generate-spec

This script will find your new ``Alert.spec.yaml``, merge it into ``dev/content.spec.yaml``, and automatically add it to the ``EmbeddableComponent`` list.

Step 5: Add Default Styles to the Theme
---------------------------------------

The final step is to provide default styling for your new component in the theme.

1.  Open the theme's style file (e.g., ``src/themes/default/style.yaml``).
2.  Add a new style group that matches the identifier you used in ``getClasses`` (``Component+Alert``).
3.  Add Tailwind CSS classes for the properties you defined in the ``classes`` section of your ``.spec.yaml`` file.

.. code-block:: yaml

   # In src/themes/default/style.yaml
   Component+Alert:
     container: 'flex items-start p-4 rounded-lg'
     icon_container: 'flex-shrink-0'
     icon: 'h-5 w-5'
     content_container: 'ml-3'
     title: 'text-lg font-medium'
     message: 'mt-1 text-sm'

Your component is now fully integrated and ready to be used in any content file.

Step 6: Verify with a Test Fixture
----------------------------------

Before considering the task complete, you must verify the component works with various data states.

1.  **Create a Test Page**: Create a temporary file ``content/pages/_test_[component_name].yaml``.
2.  **Add Test Cases**: Add the component to the ``sections`` list multiple times to test:
    *   **Minimal State**: Only required props (e.g., title only).
    *   **Maximal State**: All props filled, including long text strings to test wrapping.
    *   **Edge Cases**: Missing optional images, reversed layout, multiple actions.
3.  **Visual Check**: Run ``npm run dev`` and visit ``/_test_[component_name]`` to confirm the layout is robust.
