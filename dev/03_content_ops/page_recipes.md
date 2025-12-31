# Content Strategy: Page Recipes

**Status:** Operational Guide
**Scope:** `content/pages/*.yaml`
**Target Audience:** Content Editors, AI Agents

## 1. The Core Philosophy: "Composition over Inheritance"

In Astrical, you do not "write code" to build a page. You **compose** a page by stacking pre-built blocks (Widgets).

* **The Page:** A YAML file defining a list of sections.
* **The Section:** A container for a specific Widget.
* **The Widget:** A reusable UI component (Hero, Features, Pricing).

**The Formula:**
> `Page = Metadata + Layout + [Widget, Widget, Widget...]`

---

## 2. Anatomy of a Page File

Every page file in `content/pages/` follows this strict structure:

```yaml
# content/pages/example.yaml

# 1. SEO & Metadata (Required)
metadata:
  title: "Page Title"
  description: "Meta description for SEO (160 chars max)."
  robots:
    index: true
    follow: true

# 2. Layout Configuration (Optional - defaults to 'page')
layout: "page" # Options: 'landing', 'docs', 'simple'

# 3. The Widget Stack (The Visual Content)
sections:
  - id: "hero-1"         # Unique ID for anchor links (#hero-1)
    type: "Hero"         # Must match a registered Widget Name
    
    # 4. Widget Properties (Props passed to the component)
    title: "Big Headline"
    subtitle: "Supporting text."
    actions:             # Buttons
      - text: "Get Started"
        href: "/pricing"
        variant: "primary"

```

---

## 3. Recipe 1: The SaaS Landing Page

**Goal:** Convert visitors with a standard marketing flow.
**Flow:** Hero  Social Proof  Features  Pricing  CTA.

```yaml
metadata:
  title: "Astrical - The AI-First CMS"
  description: "Build websites at the speed of thought."

sections:
  # A. The Hook
  - type: Hero
    title: "Build Faster with <span class='text-accent'>AI</span>"
    subtitle: "Stop wrestling with component imports. Start composing."
    image:
      src: "~/assets/images/dashboard-mockup.png"
      alt: "App Dashboard"
    actions:
      - text: "Start Free"
        href: "/start"
        variant: "primary"

  # B. Social Proof (Logos)
  - type: Brands
    title: "Trusted by"
    images:
      - src: "~/assets/brands/google.svg"
      - src: "~/assets/brands/meta.svg"

  # C. The Value Prop
  - type: Features
    columns: 3
    items:
      - title: "Zero Config"
        description: "It just works out of the box."
        icon: "tabler:box"
      - title: "Type Safe"
        description: "Full TypeScript support."
        icon: "tabler:shield-check"

  # D. The Close
  - type: CallToAction
    title: "Ready to launch?"
    actions:
      - text: "Get the Code"
        href: "[https://github.com](https://github.com)"

```

---

## 4. Recipe 2: The "Legal / Prose" Page

**Goal:** Display long-form text (Terms of Service, Privacy Policy, Blog Post).
**Key Widget:** `Content` (Renders Markdown).

```yaml
metadata:
  title: "Privacy Policy"
  description: "Our commitment to your data."

sections:
  # A. Simple Header
  - type: Hero
    title: "Privacy Policy"
    subtitle: "Last updated: Jan 1, 2024"
    classes: "bg-gray-50 dark:bg-slate-900" # Custom Styling

  # B. The Document Body
  - type: Content
    content: |
      ## 1. Introduction
      We value your privacy. This document explains...
      
      ## 2. Data Collection
      We collect the following data:
      * Email address
      * IP Address
      
      > "Your data is yours." - Our CEO

```

---

## 5. Recipe 3: The "Contact Us" Page

**Goal:** Collect user input securely.
**Key Widget:** `Form` (Connects to Server-Side Handlers).

```yaml
metadata:
  title: "Contact Us"
  description: "Get in touch with support."

sections:
  - type: Hero
    title: "How can we help?"

  - type: Form
    id: "contact-form"
    form_id: "contact"  # Matches key in content/config.yaml (Handlers)
    title: "Send a message"
    inputs:
      - name: "name"
        label: "Full Name"
        type: "text"
        required: true
      - name: "email"
        label: "Email Address"
        type: "email"
        required: true
      - name: "message"
        label: "How can we help?"
        type: "textarea"
        rows: 4
    submit_text: "Send Message"

```

---

## 6. Recipe 4: The "Feature Hub" (Navigation)

**Goal:** Direct traffic to sub-pages (e.g., "Services", "Integrations").
**Key Widget:** `Grid` or `Cards`.

```yaml
metadata:
  title: "Our Services"

sections:
  - type: Hero
    title: "What we do"

  - type: Features
    columns: 2
    items:
      - title: "Web Development"
        description: "High performance sites."
        link: "/services/web-dev" # Makes the card clickable
        image: "~/assets/services/code.jpg"
        
      - title: "SEO Optimization"
        description: "Rank higher on Google."
        link: "/services/seo"
        image: "~/assets/services/seo.jpg"

```

---

## 7. Advanced: Reusability with Shared Content

Don't copy-paste the same "Call to Action" footer on 50 pages. Use the **Reference System**.

### Step 1: Define the Shared Fragment

Create `content/shared/footer-cta.yaml`:

```yaml
type: CallToAction
title: "Ready to start?"
actions:
  - text: "Sign Up"
    href: "/register"

```

### Step 2: Reference it in Pages

In `content/pages/about.yaml`:

```yaml
sections:
  - type: Hero
    title: "About Us"
  
  - type: Content
    content: "We are a team of..."

  # Import the shared widget
  - $ref: "shared/footer-cta" 

```

---

## 8. Widget Dictionary (Common Types)

| Widget Type | Purpose | Key Props |
| --- | --- | --- |
| **`Hero`** | Page Headers | `title`, `subtitle`, `image`, `actions` |
| **`Content`** | Long text/Markdown | `content` (markdown string) |
| **`Features`** | Grids of icons/text | `items` (array), `columns` (number) |
| **`Steps`** | Numbered processes | `items` (array of titles/descriptions) |
| **`Form`** | Input collection | `form_id` (config key), `inputs` (schema) |
| **`Testimonials`** | Social proof | `testimonials` (array of quotes) |
| **`CallToAction`** | Bottom conversion | `title`, `actions` |

*Note: New widgets can be added by creating `.astro` files in `modules/[name]/components/widgets/`.*
