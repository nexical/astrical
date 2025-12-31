# System Boundaries & Architectural Layers

**Status:** Immutable Law
**Scope:** Global Project Structure
**Enforcement:** Strict (Violations cause build failures or "Ghost Content")

## 1. The Core Philosophy: "Inversion of Control"

Astrical is not a traditional web framework where you write code to fetch data. It is an **Inversion of Control (IoC)** Engine.

* **The Engine (Core)** asks: "What do you want to build?"
* **The Content (Workspace)** replies: "A documentation site with these pages."
* **The Modules (Extensions)** reply: "I have the widgets to render that."

To maintain stability, we enforce strict boundaries between these three layers. An Agent must strictly adhere to these permissions to avoid breaking the upgrade path.

---

## 2. Layer 1: The Engine (Core)
**Location:** `core/` (and `src/` within the build context)
**Role:** The Immutable Runtime
**Agent Permission:** 🔴 **READ-ONLY** (unless explicitly upgrading the framework)

The Core is the build engine. It handles routing, asset optimization, SEO injection, and component orchestration. It knows *how* to build a website, but it doesn't know *what* website it is building.

### Responsibilities & Key Files:
1.  **The Build Pipeline:**
    * `astro.config.ts`: Configures the Astro compiler and integrations.
    * `src/middleware.ts`: The "Auto-Wiring" brain that discovers and chains module logic.
2.  **The "Loader" & "Router":**
    * `src/utils/loader.ts`: Scans `content/` to ingest YAML data.
    * `src/utils/router.ts`: Maps those YAML files to URL paths.
3.  **The "Registry":**
    * `src/components.ts`: The global lookup table. It maps string keys (e.g., `"Hero"`) to actual Astro components.
4.  **Base Layouts:**
    * `src/layouts/PageLayout.astro`: The skeletal HTML structure that accepts injected content.

> **Boundary Rule #1:** *Business logic specific to a single project NEVER goes into Core. If it is reusable, it goes in a Module. If it is specific, it goes in Content/Scripts.*

### Example: What NOT to do
❌ **Bad Agent Action:** "I will add a `getLatestPosts()` function to `src/utils/loader.ts`."
* **Why:** You just modified the Engine. If the user updates Astrical Core, this change is wiped out.
* **Correct Action:** Create a Module or a local Utility in `src/utils/` (if strictly necessary and un-versioned) or handle it in the `content` data structure.

---

## 3. Layer 2: The Extensions (Modules)
**Location:** `modules/`
**Role:** Pluggable Capabilities
**Agent Permission:** 🟡 **CREATE/EDIT** (when building features)

Modules are self-contained packages that extend the Core's vocabulary. If Core provides the grammar, Modules provide the nouns and verbs.

### Structure (`modules/[name]/`):
* **`module.yaml`**: The manifest defining the module's identity.
* **`src/components/widgets/`**: UI blocks (e.g., `Hero`, `PricingTable`, `MermaidDiagram`).
* **`src/form-handlers/`**: Backend processors (e.g., `Mailgun`, `DatabaseSave`).
* **`middleware.ts`**: Request interception logic.
* **`theme/style.yaml`**: Default styling for the module's components.

### Interaction Model:
Modules are **Auto-Wired**. They do not need to be manually imported by the user.
* The Core scans `modules/*/module.yaml` at startup.
* Components are automatically registered in the global lookup table.
* Middleware is automatically chained in `src/middleware.ts`.

> **Boundary Rule #2:** *Modules should be loosely coupled. Module A should not import directly from Module B unless absolutely necessary. They should communicate via standard Core interfaces (Registry, Stores).*

### Example: Creating a Feature
✅ **Good Agent Action:** "I need to add a 'Testimonial' slider."
1.  Create `modules/marketing/module.yaml`.
2.  Create `modules/marketing/src/components/widgets/Testimonials.astro`.
3.  The Core automatically detects it.
4.  The User can now use `- type: Testimonials` in their YAML.

---

## 4. Layer 3: The Workspace (Content)
**Location:** `content/`
**Role:** User Space (Data & Configuration)
**Agent Permission:** 🟢 **READ/WRITE** (Primary Domain)

This is the "User Space." It is strictly **Declarative**. Logic (JavaScript/TypeScript) is forbidden here; only Data (YAML/Markdown) is allowed.

### Key Components:
1.  **Global Configuration:**
    * `content/config.yaml`: The "BIOS" of the site. Controls global settings, menus (`header`, `footer`), and installed features.
2.  **Routing Table (Pages):**
    * `content/pages/**/*.yaml`: 1 File = 1 URL. Defines *which* components to render on a page.
    * *Example:* `content/pages/home.yaml` maps directly to `/`.
3.  **The "Paint" (Styling):**
    * `content/style.yaml`: Overrides Core and Module styles to define the brand identity.
4.  **Shared Fragments:**
    * `content/shared/`: Reusable YAML fragments (e.g., a common footer definition or call-to-action).

> **Boundary Rule #3:** *The Content Layer must remain "No-Code." Users should be able to change the entire site structure and design by editing YAML, without touching a single `.ts` file.*

### Example: Changing the Site
✅ **Good Agent Action:** "I need to change the Hero text on the homepage."
* **Target:** `content/pages/home.yaml`
* **Action:** Edit the `tagline` or `title` fields.
* **Forbidden:** Do not edit `src/components/widgets/Hero.astro`.

---

## 5. Cross-Boundary Communication Protocols

How do the layers talk to each other without breaking encapsulation?

### A. The Registry Pattern (Core <-> Module)
* **Mechanism:** `src/components.ts` and `src/form-registry.ts`.
* **Flow:** Modules "register" their components by string name (e.g., `"ProseWidget"`). Core looks them up dynamically.
* **Benefit:** Core doesn't crash if a Module is removed; it just warns "Widget not found."

### B. The Loader Pattern (Core <-> Content)
* **Mechanism:** `src/utils/loader.ts` and `src/utils/router.ts`.
* **Flow:** Core "pulls" data from Content. Content never "pushes" to Core.
* **Benefit:** The build process is deterministic.

### C. The Override Pattern (Module <-> Content)
* **Mechanism:** `src/utils/theme.ts`.
* **Flow:**
    1.  Load **Module** styles (Defaults).
    2.  Load **Theme** styles (Base).
    3.  Load **User** styles (Overrides).
    4.  Merge deeply: `User > Theme > Module`.
* **Benefit:** Users can customize complex module widgets (like a specific button color in a Documentation Sidebar) without forking the module code.

---

## 6. Summary of Permissions

| Action | Core (`src/`) | Module (`modules/`) | Workspace (`content/`) |
| :--- | :---: | :---: | :---: |
| **Add a Page** | ❌ | ❌ | ✅ (Add `.yaml`) |
| **Change Menu** | ❌ | ❌ | ✅ (Edit `config.yaml`) |
| **New Widget** | ❌ | ✅ (Create `.astro`) | ❌ |
| **Fix Routing** | ✅ | ❌ | ❌ |
| **Change Colors**| ❌ | 🟡 (Defaults) | ✅ (Overrides) |
| **Add API Logic**| ❌ | ✅ (Form Handler) | ❌ |

*This document is the supreme law for Architectural Decisions. Any code change that violates these boundaries requires a System Architect Override.*
