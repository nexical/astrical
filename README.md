# Astrical: AI-First Astro Theme

> **Rapidly generate enterprise-grade websites with AI.**

Astrical is an open-source [Astro](https://astro.build/) theme and framework designed specifically for **AI-driven development**. It decouples content and structure from code, allowing AI agents to build, update, and manage complex websites purely by manipulating structured YAML data.

## 🚀 Why Astrical?

Traditional web development requires AI to understand complex codebases, component logic, and framework nuances. Astrical flips this model:

*   **Content as Configuration**: The entire site—pages, menus, styles, and component compositions—is defined in declarative YAML files.
*   **AI-Optimized Architecture**: The project structure is documented in a way that allows AI to "read the manual" and immediately start building without hallucinating non-existent APIs.
*   **Zero-Code Content Management**: Add pages, change layouts, and update copy without touching a single line of TypeScript or JSX.
*   **Production Ready**: Built on Astro and Tailwind CSS, deploying to Cloudflare Pages (or any static host) for blazing fast performance.

## 🛠️ Technology Stack

*   **Framework**: [Astro](https://astro.build/) (Static Site Generation)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Data Source**: YAML (Parsed at build time)

## 🏁 Getting Started

### Prerequisites

*   Node.js (v22.0.0 or higher)
*   npm

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/nexical/astrical.git
    cd astrical
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

### Development

Start the local development server:

```bash
npm run dev
```

This will start the site at `http://localhost:4321`.

### Building for Production

Build the static site:

```bash
npm run build
```

The output will be in the `dist/` directory.

## 🤖 AI Development Guide

**Are you an AI agent? Start here.**

This repository includes a comprehensive "AI Operations Manual" designed to teach you how to manipulate this project effectively.

1.  **Read the Manual**: Start by reading [`dev/content_management.rst`](dev/content_management.rst). This file explains the YAML schema, available components, and how to construct pages.
2.  **Understand the Architecture**: Review [`dev/architecture.rst`](dev/architecture.rst) to understand how the YAML data is transformed into the final website.
3.  **Follow the Rules**:
    *   **Do not** modify files in `src/` unless explicitly instructed to create a *new* capability that the current component library cannot handle.
    *   **Do** perform all site updates by modifying files in `content/`.
    *   **Do** use the `npm run validate` command to check your work against the schemas.

### Key Documentation

*   [**Content Management Guide**](dev/content_management.rst): The primary manual for AI agents. Defines schemas, components, and recipes.
*   [**Architecture Overview**](dev/architecture.rst): Deep dive into the technical implementation.
*   [**Theme Design**](dev/theme_design.rst): How to customize the visual look and feel via `style.yaml`.
*   [**Component Development**](dev/component_dev.rst): Guide for human developers (or advanced AI) extending the core component library.

## 📂 Project Structure

*   `content/`: **The AI Workspace.** All site content, menus, and configuration live here.
*   `src/`: **The Engine.** Heavily documentedAstro components, layouts, and logic.
*   `dev/`: **The Manuals.** Detailed documentation guides for AI and humans.
*   `public/`: Static assets.

## 📧 Form Handlers

Astrical includes a modular form submission system that supports multiple backend handlers (e.g., Mailgun, SMTP).

### Configuration

Form handlers are configured in `site:config` (via `content/config.yaml`).

```yaml
formHandlers:
  defaults: ['mailgun']
  handlers:
    mailgun:
      enabled: true
    smtp:
      enabled: false
```

### Supported Handlers

*   **Mailgun**: Sends emails using the Mailgun API. Requires `MAILGUN_*` environment variables.
*   **SMTP**: Sends emails via SMTP. Requires `SMTP_*` environment variables.

To develop new handlers, implement the `FormHandler` interface and register it with the `FormHandlerRegistry`.

## 🤝 Contributing

We welcome contributions! Whether you're a human or an AI, please feel free to submit a Pull Request.

## 📄 License

Apache License 2.0
