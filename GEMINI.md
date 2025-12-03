# Gemini Project Context: Schemata

**You are working on Schemata, an AI-first Astro theme.**

## Core Philosophy
This project is designed for **AI-driven development**. The content and structure are decoupled from the code.
*   **Content as Configuration**: You manage the site by editing YAML files in `content/`.
*   **Code as Engine**: The `src/` directory contains the Astro/React engine. **Avoid modifying `src/` unless explicitly asked to add new capabilities.**

## Navigation Guide

### 1. The Manuals (Read These First)
*   **`dev/content_management.rst`**: **CRITICAL**. This is your "Operations Manual". It defines the YAML schema, available components, and how to build pages.
*   **`dev/architecture.rst`**: Explains how the YAML is transformed into the website.
*   **`dev/theme_design.rst`**: How to style the site using `style.yaml`.

### 2. The Workspace (Your Domain)
*   **`content/pages/`**: Create and edit page YAML files here.
*   **`content/menus/`**: Update navigation menus.
*   **`content/config.yaml`**: Global site configuration.

### 3. The Engine (Restricted)
*   `src/components/`: Astro components.
*   `src/layouts/`: Page layouts.
*   `src/themes/`: Theme definitions.

## Development Commands

Run these commands to verify your work:

*   **Start Server**: `npm run dev` (Runs at `http://localhost:4321`)
*   **Validate Content**: `npm run validate` (Checks YAML against schemas in `dev/content.spec.yaml`)
*   **Lint & Check**: `npm run check` (Runs ESLint, Prettier, and Astro diagnostics)
*   **Build**: `npm run build` (Generates `dist/`)

## Rules of Engagement
1.  **Always read `dev/content_management.rst`** before attempting to create complex pages.
2.  **Prefer YAML updates** over code changes.
3.  **Use `npm run validate`** after modifying any YAML file to ensure schema compliance.
