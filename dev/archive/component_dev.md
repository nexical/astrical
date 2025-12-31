# Component Development Guide (AI Operations Manual)

This guide provides a technical walkthrough for an AI agent on how to create and update the structural components of the website. Components are the foundational building blocks of the site, written as Astro (`.astro`) files.

The core philosophy is a strict **separation of concerns**:

*   **Structure (Components)**: Defined in `.astro` files. This is your focus when following this guide. Components are responsible for the HTML structure and accepting data via props. They should be completely agnostic of the content they display and the specific styles they wear.
*   **Content (Data)**: Defined in `.yaml` files in the `/content` directory. This is managed according to the [Content Management Guide](content_management.rst).
*   **Style (Theme)**: Defined in the `/src/themes/[theme-name]/` directory. This is managed according to the [AI Theming Engine Guide](theme_design.rst).

Your role in component development is to act as an architect, creating robust and flexible structures that can be filled with any content and styled by any theme.

## Component Categories & Templates

When tasked with creating a "component", first determine its type, then strictly adhere to the corresponding template. Don't improvise on the architecture; use these proven patterns.

### 1. UI Components (Atoms)

Small custom elements (e.g., buttons, badges, icons). Use this for reusable UI bits.

**Template Path**: `src/core/dev/templates/ui/GenericElement.astro`

**Style Template**: `src/core/dev/templates/ui/GenericElement.style.yaml`
**Style Spec Template**: `src/core/dev/templates/ui/GenericElement.style.spec.yaml`

```astro
---
/**
 * GenericElement.astro
 */
import type { HTMLAttributes } from 'astro/types';
import { getClasses } from '~/utils/theme';
import { twMerge } from 'tailwind-merge';

interface Props extends HTMLAttributes<'div'> {
  variant?: 'default' | 'alternative';
}

const { 
  variant = 'default', 
  class: className = '', 
  ...rest 
} = Astro.props;

// Retrieve CSS classes
const classes = getClasses('Component+GenericElement');

const variants = {
  default: classes.default,
  alternative: classes.alternative,
};
---

<div class={twMerge(variants[variant], className)} {...rest}>
  <slot />
</div>
```

```yaml
# GenericElement.style.yaml
Component+GenericElement:
  default: 'rounded p-4 bg-surface text-default'
  alternative: 'rounded p-4 bg-primary text-white'
```

```yaml
# GenericElement.style.spec.yaml
Component+GenericElement:
  type: object
  properties:
    default: { type: string }
    alternative: { type: string }
```

### 2. Standard Widgets (Molecules)

Self-contained content blocks (e.g., Forms, Charts, Simple Cards).

**Template Path**: `src/core/dev/templates/widgets/GenericWidget.astro`
**Spec Path**: `src/core/dev/templates/widgets/GenericWidget.spec.yaml`
**Style Template**: `src/core/dev/templates/widgets/GenericWidget.style.yaml`
**Style Spec Template**: `src/core/dev/templates/widgets/GenericWidget.style.spec.yaml`

**Key Pattern**: Inherits `WidgetProps`, uses `WidgetWrapper`.

```astro
---
import type { Widget as WidgetProps } from '~/types';
import WidgetWrapper from '~/components/ui/WidgetWrapper.astro';
import { getClasses } from '~/utils/theme';

export interface Props extends WidgetProps {
  customProp?: string;
}

const { id, customProp, classes: rawClasses = {}, bg = '' } = Astro.props;
const classes = getClasses('Component+GenericWidget', rawClasses);
---

<WidgetWrapper type="generic-widget" id={id} classes={classes.wrapper} bg={bg}>
  <div class={classes.container}>
    {customProp && <p class={classes.text}>{customProp}</p>}
    <slot />
  </div>
</WidgetWrapper>
```

```yaml
# GenericWidget.style.yaml
Component+GenericWidget:
  wrapper:
    container: ''
  container: 'flex flex-col gap-4'
  text: 'text-lg font-medium'
```

### 3. Titled Widgets (Complex Molecules)

Widgets that need a header (Title, Subtitle, Tagline) like Hero, Features, FAQs. This is the **most common** type of widget you will build.

**Template Path**: `src/core/dev/templates/widgets/GenericTitledWidget.astro`
**Spec Path**: `src/core/dev/templates/widgets/GenericTitledWidget.spec.yaml`
**Style Template**: `src/core/dev/templates/widgets/GenericTitledWidget.style.yaml`
**Style Spec Template**: `src/core/dev/templates/widgets/GenericTitledWidget.style.spec.yaml`

**Key Pattern**: Inherits `TitledWidget`, uses `TitledWidgetWrapper`.

```astro
---
import type { TitledWidget } from '~/types';
import TitledWidgetWrapper from '~/components/ui/TitledWidgetWrapper.astro';
import { getClasses } from '~/utils/theme';

export interface Props extends TitledWidget {
  content?: string;
}

const {
  id,
  title = await Astro.slots.render('title'),
  subtitle = await Astro.slots.render('subtitle'),
  tagline = await Astro.slots.render('tagline'),
  content,
  classes: rawClasses = {},
  bg = '',
} = Astro.props;

const classes = getClasses('Component+GenericTitledWidget', rawClasses);
---

<TitledWidgetWrapper
  type="generic-titled-widget"
  id={id}
  classes={classes}
  bg={bg}
  title={title}
  subtitle={subtitle}
  tagline={tagline}
>
  <div class={classes.content_container}>
    {content && <p class={classes.content}>{content}</p>}
    <slot />
  </div>
</TitledWidgetWrapper>
```

```yaml
# GenericTitledWidget.style.yaml
Component+GenericTitledWidget:
  wrapper:
    container: ''
  headline:
    title: ''
  content_container: 'mt-8 flex flex-col gap-6'
  content: 'text-muted'
```

### 4. Section Components (Organisms)

Layout containers that hold Widgets.

**Template Path**: `src/core/dev/templates/sections/GenericSection.astro`
**Spec Path**: `src/core/dev/templates/sections/GenericSection.spec.yaml`
**Style Template**: `src/core/dev/templates/sections/GenericSection.style.yaml`
**Style Spec Template**: `src/core/dev/templates/sections/GenericSection.style.spec.yaml`

**Key Pattern**: Uses `SectionWrapper`, iterates over `components.main` using `generateSection`.

```astro
---
import type { Section as Props } from '~/types';
import SectionWrapper from '~/components/ui/SectionWrapper.astro';
import { generateSection } from '~/utils/generator';
import { getClasses } from '~/utils/theme';

// Destructure section properties
const { id, components, classes: rawClasses = {}, bg = '' } = Astro.props;
const classes = getClasses('Section+GenericSection', rawClasses);
---

<SectionWrapper type="generic-section" id={id} classes={classes.wrapper} bg={bg}>
  <div class={classes.container} data-name="section-generic-container">
    <div class={classes.content} data-name="section-generic-content">
      {
        generateSection(components?.main).map(({ component: Component, props }) => (
          <Component {...props} />
        ))
      }
    </div>
  </div>
</SectionWrapper>
```

```yaml
# GenericSection.style.yaml
Section+GenericSection:
  wrapper:
    container: 'py-10 md:py-16' 
  main: ''
```

## Development Workflow

Follow this exact process to create a new component.

### Step 1: Select Type & Template
Choose strictly from the 4 types above. Do not invent new structures.
*   Need a button or label? -> **UI Component**
*   Need a content block with a title? -> **Titled Widget** (Most common)
*   Need a raw content block? -> **Standard Widget**
*   Need a new page layout? -> **Section Component**

### Step 2: Create the Files (The "4-File Rule")
Every functional component requires **exactly four files** to be complete. This ensures the component is structurally sound, spec-compliant, and fully themeable.

1.  **Component File** (`.astro`): The HTML structure and logic.
2.  **Component Spec** (`.spec.yaml`): The content schema (props validation).
3.  **Style Definition** (`.style.yaml`): The default default styles (Tailwind classes).
4.  **Style Spec** (`.style.spec.yaml`): The style schema (validating the theme).

**Copy all four templates** for your chosen type into the component's directory.
*   **Location**: `src/[module]/src/components/[type]/`
*   **Naming**: 
    -   `MyComponent.astro`
    -   `MyComponent.spec.yaml`
    -   `MyComponent.style.yaml` (Note: In the final module structure, these are consolidated, but start by creating them individually or adding to the module's main `style.yaml` and `style.spec.yaml`).

### Step 3: Define "The API" (Props)
In the `.astro` file, define the `Props` interface.
*   **Strings**: For text content (`title`, `description`).
*   **Booleans**: For toggles (`isReversed`).
*   **Objects**: For complex data (`image: { src, alt }`).
*   **Arrays**: For lists (`items: []`).

**Crucial**: Update the `.spec.yaml` to Match!
Every prop in the interface must have a corresponding entry in the spec file. This allows the AI System to validate content against your component.

### Step 4: Implement Structure & Styling
*   **Semantic HTML**: Use proper tags (`<article>`, `<figure>`, `<header>`).
*   **Theme Integration**: 
    1.  Call `getClasses('Component+[Name]')`.
    2.  For every styled element, look for a class in the `classes` object (`class={classes.container}`).
    3.  **NEVER hardcode Tailwind classes** (e.g., `class="p-4 bg-blue-500"`). Always use the theme system. This is non-negotiable.

### Step 5: Register Component
Run `npm run generate-spec` to register your new component in the global schema.

### Step 6: Default Theme (Consolidated)
Once you have defined your `.style.yaml` and `.style.spec.yaml`, you must merge them into the module's main theme files (or the site's default theme if working in core).

1.  **Merge Styles**: Append the content of your `.style.yaml` to `src/[module]/theme/style.yaml`.
2.  **Merge Specs**: Append the content of your `.style.spec.yaml` to `src/[module]/theme/style.spec.yaml`.

## Engineering Standards & Best Practices

### Defensive Rendering Patterns
AI-generated components must be robust. Never assume data exists.

1.  **Conditional Rendering**: Do not render empty containers.
    *   **Bad**: `<div class="subtitle">{subtitle}</div>`
    *   **Good**: `{subtitle && <p class={classes.subtitle}>{subtitle}</p>}`

2.  **Default Values**: Always provide fallback values for visual props.
    *   **Example**: `const { icon = 'tabler:star', ... } = Astro.props;`

### Accessibility (A11y)
1.  **Semantic HTML**: Use `<header>`, `<article>`, `<figure>`.
2.  **Interactive Elements**: must have `aria-expanded` if they toggle content.
3.  **Images**: `alt` text is mandatory.

### Client-Side Interactivity
1.  **Scoped Selection**: use `getElementById(id)` using the component's unique `id` prop.
    *   **Bad**: `document.querySelector('.my-button')`
    *   **Good**: `const container = document.getElementById(id); container.querySelector('.my-button');`

2.  **Nano Stores**: For shared state management, prefer Nano Stores over passing callbacks.
