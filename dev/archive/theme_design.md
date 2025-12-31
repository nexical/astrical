# Astrical Theme Design System

**Target Audience: AI Agents & Theme Developers**

This comprehensive guide defines how to style and theme the Astrical platform. As an AI agent, you must strictly follow these specifications to ensure valid, responsive, and aesthetically pleasing designs. Existing themes are located in `src/themes/` (core) or `themes/` (site-specific).

---

## 1. Core Philosophy

Astrical uses a **configuration-driven** theming engine.
*   **Logic is decoupled from Design**: Component logic (`.astro` files) resides in `src`. Visual styles (`style.yaml`) reside in contentable themes.
*   **Utility-First**: The system relies heavily on **Tailwind CSS**.
*   **Semantic Abstraction**: Instead of writing CSS classes directly on HTML elements, you map semantic keys (e.g., `Component+Hero.headline.title`) to strings of Tailwind classes in a YAML configuration.

## 2. Architecture & Hierarchy

The theming engine resolves styles using a strict precedence order (Highest to Lowest priority):

1.  **User Overrides**: `content/style.yaml` (Site-specific tweaks)
2.  **Theme Definition**: `src/themes/[theme-name]/style.yaml` (The full theme definition)
3.  **Module Styles**: `modules/[module-name]/theme/style.yaml` (Styles packaged with modules)
4.  **Defaults**: Hardcoded fallbacks in components (Rarely used, avoid relying on this).

### Key Files

| File | Purpose | AI Action |
| :--- | :--- | :--- |
| **`style.spec.yaml`** | **The Law**. Defines the schema, allowed keys, and property descriptions. | **Read Only**. Use this to validate your structure. |
| **`style.yaml`** | **The Blueprint**. Maps semantic keys to Tailwind classes. | **Write**. This is where 90% of theming happens. |
| **`global.css`** | **The Palette**. Defines CSS variables (colors, fonts) and base utilities. | **Write**. Edit this for global color usage and typography. |
| **`tailwind.config.js`** | **The Config**. Maps CSS variables to Tailwind utilities. | **Read Only**. Rarely needs modification. |

---

## 3. The Palette (`global.css`)

All colors and fonts are defined as CSS variables to support runtime switching (e.g., Dark Mode).

### 3.1 Color System
You must define colors for both `:root` (Light Mode) and `.dark` (Dark Mode).

| Variable | Tailwind Class | Usage |
| :--- | :--- | :--- |
| `--aw-color-primary` | `bg-primary`, `text-primary` | Main brand color, buttons, links. |
| `--aw-color-secondary` | `bg-secondary`, `text-secondary` | Secondary brand color, highlights. |
| `--aw-color-accent` | `bg-accent`, `text-accent` | Special alerts, notifications, eye-catching elements. |
| `--aw-color-text-default` | `text-default` | Main body text. |
| `--aw-color-text-muted` | `text-muted` | Supporting text, captions. |
| `--aw-color-bg-page` | `bg-page` | Main page background. |
| `--aw-color-surface` | `bg-surface` | Card backgrounds, dropdowns. |
| `--aw-color-border` | `border-surface` | Borders, dividers. |

**Example Implementation:**
```css
:root {
  --aw-color-primary: rgb(59 130 246); /* Blue 500 */
  --aw-color-bg-page: rgb(255 255 255);
  --aw-color-text-default: rgb(17 24 39);
}

.dark {
  --aw-color-primary: rgb(96 165 250); /* Blue 400 */
  --aw-color-bg-page: rgb(3 7 18);
  --aw-color-text-default: rgb(243 244 246);
}
```

### 3.2 Typography
Fonts are defined via CSS variables to allow easy swapping of font families.

*   `--aw-font-sans`: Body text, UI elements.
*   `--aw-font-serif`: Optional, for blog posts or formal designs.
*   `--aw-font-heading`: Headings (H1-H6). Often the same as Sans.

---

## 4. The Blueprint (`style.yaml`)

This file contains the mapping of semantic components to Tailwind classes. It is organized into **Style Groups**.

### 4.1 Syntax & References
*   **Simple String**: Just a list of utility classes.
    ```yaml
    title: 'text-4xl font-bold text-default'
    ```
*   **Variable Reference (`@`)**: Reuses a value defined at the root of `style.yaml`.
    ```yaml
    # Root variable
    section_columns: 'gap-12 md:gap-20'

    # Usage
    Section+TwoColumn:
      column_wrapper: '@section_columns'
    ```

### 4.2 Comprehensive Style Reference
Refer to `dev/theme.spec.yaml` for the exact schema. Below are the key groups you will encounter.

#### A. Layouts (`Layout+*`)
Global structural styles.
*   **`Layout+Base`**: Targets `<html>` and `<body>`. Set base font size here.
*   **`Layout+Page`**: Targets `<main>`. Usually empty, but can set global padding.
*   **`Layout+Markdown`**: Critical for content pages.
    *   `content`: **MUST** include `prose dark:prose-invert` to style raw Markdown.

#### B. Sections (`Section+*`)
Layouts for major page blocks. All sections support a background image overlay pattern.
*   **`Component+SectionWrapper`**: The base class for all sections.
    *   `container`: Controls vertical padding (e.g., `py-12 md:py-20`).
    *   `overlay`: Styles the layer over background images (e.g., `bg-black/50`).
*   **`Section+SingleColumn`**: Centered content.
*   **`Section+TwoColumn`**: Split layout (Text + Image).
    *   `column_wrapper`: Controls the gap between columns.
*   **`Section+Header` / `Section+Footer`**: Special sections that often have zero padding (`py-0`).

#### C. Components (`Component+*`)
Reusable UI widgets.
*   **`Component+Button`**:
    *   `primary`: Styles `.btn-primary` (Use `global.css` for the definition).
*   **`Component+Headline`**:
    *   `title`: Main heading style (e.g., `text-4xl`).
    *   `tagline`: Small uppercase label above title.
    *   `subtitle`: Descriptive text below title.
*   **`Component+Form`**:
    *   Controls layout of all form inputs.
    *   Sub-groups: `Form+ShortText`, `Form+Email`, `Form+Checkbox`.

#### D. Page Components (`Page+*`)
Global site singletons.
*   **`Page+Header`**: The top navigation bar.
    *   `header`: Sticky behavior, background color.
    *   `nav_link`: Standard link styles.
    *   `link_active`: Style for the current page (e.g., `text-primary`).
*   **`Page+Footer`**: The site footer.
    *   `links_grid`: Responsive grid for footer links.

---

## 5. Design Intelligence: How to Style

When asked to "create a theme" or "update styles," follow these rules to ensure high-quality output.

### Rule 1: Visual Hierarchy
Don't make everything bold and big.
*   **Headings**: Bold, tight tracking (`tracking-tight`), separate from body.
*   **Body**: Readable height (`leading-relaxed`), lighter color (`text-muted`).
*   **Taglines**: Small, uppercase, wide tracking (`tracking-wide`), accent color.

### Rule 2: Depth & Texture
A flat white page is boring. Use background variety.
*   **Base**: `bg-page` (White/Dark Gray).
*   **Cards**: `bg-surface` (Off-white/Black).
*   **Popups**: `bg-surface-elevated` (Bright White/Darker Gray).
*   **Shadows**: Use `shadow-sm` for cards, `shadow-xl` for floating elements.

### Rule 3: Mobile-First
Always write classes for mobile first, then modify for desktop.
*   **Good**: `grid-cols-1 md:grid-cols-2` (Stacks on mobile, side-by-side on desktop).
*   **Bad**: `grid-cols-2` (Squished columns on mobile).

### Rule 4: Dark Mode
Every color-related class **must** have a dark mode equivalent if it's not handled by a CSS variable.
*   **Tailwind**: `text-gray-900 dark:text-white`.
*   **CSS Vars (Preferred)**: `text-default` (Handles switching automatically).

### Rule 5: Background Images
If a component supports a `bg` image:
1.  Assume the image might be noisy.
2.  **ALWAYS** apply an overlay in `style.yaml`:
    ```yaml
    wrapper:
      overlay: 'bg-black/60' # Ensure text is readable
    ```

---

## 6. Theming Workflow Example

**User Request**: "Make the hero section look more modern with a dark theme and larger text."

**Plan**:
1.  **Analyze**: "Hero section" maps to `Component+Hero` (or `Section+SingleColumn` used as hero).
2.  **Locate**: Open `src/themes/[theme]/style.yaml`.
3.  **Edit `Component+Hero`**:
    *   Increase title size: `text-5xl md:text-7xl`.
    *   Add gradient text: `text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600`.
4.  **Edit `Section+Header`** (Wrapper):
    *   Remove padding: `py-0`.
    *   Add dark background: `bg-slate-900`.
5.  **Validate**: Run `npm run validate` to ensure YAML correctness.

## 7. Advanced: Custom Utility Classes

Sometimes Tailwind utility strings get too long. You can define custom CSS classes in `global.css` using `@utility`.

**`global.css`**:
```css
@utility btn-glow {
  @apply shadow-lg shadow-primary/50 transition-shadow duration-300 hover:shadow-primary/80;
}
```

**`style.yaml`**:
```yaml
Component+Button:
  primary: 'btn btn-primary btn-glow'
```

---

## 8. Troubleshooting

*   **Changes not showing?**
    *   Is the server running? (`npm run dev`)
    *   Did you edit the correct theme? Check specific `content/style.yaml` overrides.
    *   Did you save the file?
*   **"Missing Property" Error**:
    *   Check `src/core/dev/style.spec.yaml`. You can only use keys defined there.
*   **Styles look broken on mobile**:
    *   Check for fixed widths (`w-96`). Use `max-w-*` instead.
    *   Check `flex-row` without wrapping. Use `flex-col md:flex-row`.
