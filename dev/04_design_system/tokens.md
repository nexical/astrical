# Design System: Tokens & Theming

**Status:** Active Protocol
**Scope:** `content/style.yaml`, `src/assets/styles/**/*.css`
**Key Systems:** Tailwind CSS, CSS Custom Properties (Variables)

## 1. The Core Philosophy: "Semantic Abstraction"

Astrical enforces a strict separation between **Structure** (HTML) and **Appearance** (CSS).
To achieve this, we do **not** use raw values (like `#3b82f6` or `16px`) in our components.

We use **Semantic Tokens**.

* **Bad:** `text-blue-500` (Hardcoded to Blue)
* **Good:** `text-primary` (Semantic - could be Blue, Red, or Purple depending on the theme)

**The Rule:**
> "Always design for the *role* of the element, not its specific color. If an element is important, use `text-primary`. If it is supportive, use `text-muted`."

---

## 2. The "Three-Layer" Override System

The final look of the site is calculated by merging three layers of configuration. This allows Modules to have defaults while giving Users total control.

| Layer | Source | Priority | Role |
| :--- | :--- | :--- | :--- |
| **1. Module** | `modules/*/theme/style.yaml` | Lowest | Default styles for specific widgets. |
| **2. Base Theme** | `src/themes-default/*/style.yaml` | Medium | The coherent look (e.g., "Vibrant", "Minimal"). |
| **3. User** | `content/style.yaml` | **Highest** | Site-specific overrides (Brand colors). |

**The AI's Job:**
When asked to "Make the buttons red," **DO NOT** edit the CSS files. Edit `content/style.yaml` to change the `primary` color token.

---

## 3. The Token Map (Color System)

Astrical maps semantic names to CSS variables (`--aw-*`) which are then exposed as Tailwind utility classes.

### A. Main Brand Colors
These define the site's identity. They automatically adapt to Dark Mode.

| Token Name | Tailwind Class | Usage |
| :--- | :--- | :--- |
| **Primary** | `text-primary`, `bg-primary` | Main actions (Buttons), Links, Active states. |
| **Secondary** | `text-secondary`, `bg-secondary` | Supporting actions, Decorative elements. |
| **Accent** | `text-accent`, `bg-accent` | Highlights, Badges, "New" tags. |

### B. Functional Colors
These provide hierarchy and contrast.

| Token Name | Tailwind Class | Usage |
| :--- | :--- | :--- |
| **Default** | `text-default`, `bg-page` | The main body text and background color. |
| **Muted** | `text-muted`, `bg-muted` | Subtitles, Footers, Disabled states. |

### C. The Palette Definition
In `content/style.yaml`, colors are defined using the **RGB Triplet** format (e.g., `'59, 130, 246'`). This allows Tailwind to apply opacity modifiers (e.g., `bg-primary/50`).

```yaml
# content/style.yaml
colors:
  default:
    primary: '59, 130, 246'   # Blue-500
    secondary: '236, 72, 153' # Pink-500
    accent: '16, 185, 129'    # Emerald-500
    muted: '107, 114, 128'    # Gray-500

```

---

## 4. Typography Tokens

We control fonts globally to ensure consistency.

| Token Category | usage |
| --- | --- |
| **Sans** | The default interface font (Inter, Roboto). |
| **Serif** | Optional, used for specific themes (Playfair Display). |
| **Heading** | Used for H1-H6. Can be different from Sans. |

**Configuration (`content/style.yaml`):**

```yaml
fonts:
  sans: "'Inter Variable', sans-serif"
  serif: "'Merriweather', serif"
  heading: "'Space Grotesk', sans-serif"

```

---

## 5. Structural Tokens (Radius & Spacing)

We control the "feel" of the UI (Sharp vs. Round, Compact vs. Airy) using global variables.

### A. Corner Radius (`--aw-radius`)

Controls the roundness of buttons, inputs, and cards.

* `rounded-none` (0px) - Brutalist
* `rounded-sm` (0.125rem) - Professional
* `rounded-full` (9999px) - Playful

### B. Letter Spacing (`--aw-letter-spacing`)

Controls the tracking of text.

* `tracking-tight` - Modern/Tech
* `tracking-wide` - Luxury/Elegant

---

## 6. Dark Mode Logic

Astrical uses a `class="dark"` strategy on the `<html>` tag.
CSS variables are redefined inside this class scope, meaning **you do not need to write `dark:text-white` everywhere.**

**How it works:**

1. **CSS Definition:**
```css
:root {
  --aw-color-bg-page: 255, 255, 255; /* White */
}
.dark {
  --aw-color-bg-page: 3, 6, 32; /* Dark Blue */
}

```


2. **Usage:**
```html
<div class="bg-page">...</div>

```


* In Light Mode: Renders White.
* In Dark Mode: Renders Dark Blue.



**Agent Rule:** *Only use the `dark:` prefix in Tailwind if you specifically want to BREAK the design system (e.g., inverting a specific image).*

---

## 7. How to Modify Tokens (The "Painter" Workflow)

When you need to change the design, follow this flowchart:

1. **Is it a global brand change?** (e.g., "Change our blue to purple")
*  Edit `content/style.yaml` under `colors`.


2. **Is it a specific font change?**
*  Edit `content/style.yaml` under `fonts`.


3. **Is it a component fix?** (e.g., "Make the Hero button bigger")
*  Edit the YAML props in `content/pages/*.yaml`.


4. **Is it a new visual style?** (e.g., "Add a glassmorphism effect")
*  Create a CSS utility in `src/assets/styles/custom.css`.



### Example: Customizing the Brand

**Goal:** Change the site to a "Cyberpunk" theme.

**File:** `content/style.yaml`

```yaml
colors:
  default:
    primary: '244, 63, 94'    # Neon Pink
    secondary: '56, 189, 248' # Cyan
    accent: '250, 204, 21'    # Yellow
    page: '15, 23, 42'        # Dark Slate
    muted: '148, 163, 184'    # Slate-400

fonts:
  sans: "'Orbitron', sans-serif"

```

*No code changes required. The entire site updates instantly.*
