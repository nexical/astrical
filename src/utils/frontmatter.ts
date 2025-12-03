/**
 * src/utils/frontmatter.ts
 *
 * This module provides Astro markdown processing plugins that enhance content
 * with automatic metadata generation and improved HTML output. These plugins
 * work during the build process to analyze content and modify the AST (Abstract
 * Syntax Tree) before HTML generation.
 *
 * Features:
 * - Automatic reading time calculation for content
 * - Responsive table wrapping for better mobile display
 * - Lazy loading attribute addition to images
 * - Integration with Astro's markdown processing pipeline
 *
 * Plugin Types:
 * - RemarkPlugin: Processes markdown AST before conversion to HTML
 * - RehypePlugin: Processes HTML AST after markdown conversion
 *
 * Component Integration:
 * - reading-time: Calculates reading time from text content
 * - mdast-util-to-string: Converts markdown AST to plain text
 * - unist-util-visit: Traverses and modifies AST nodes
 *
 * Data Flow:
 * 1. Plugins are registered in Astro configuration
 * 2. During markdown processing, plugins analyze content
 * 3. Reading time plugin calculates minutes from text content
 * 4. Table plugin wraps tables in scrollable containers
 * 5. Image plugin adds lazy loading attributes
 * 6. Enhanced content is passed to HTML generation
 *
 * Usage Context:
 * - Blog post processing for reading time metadata
 * - Content optimization for mobile devices
 * - Performance improvement through lazy image loading
 * - Automatic metadata generation for content management
 */

import getReadingTime from 'reading-time';
import { toString } from 'mdast-util-to-string';
import { visit } from 'unist-util-visit';
import type { RehypePlugin, RemarkPlugin } from '@astrojs/markdown-remark';

/**
 * Remark plugin that calculates and adds reading time to frontmatter.
 *
 * This plugin processes the markdown AST to calculate the estimated reading time
 * based on the content length and adds it to the document's frontmatter. The
 * reading time is calculated using the reading-time library which considers
 * average reading speed and word count.
 *
 * @returns A remark plugin function that modifies the AST and frontmatter
 *
 * Data Processing:
 * 1. Converts markdown AST to plain text using toString()
 * 2. Calculates reading time using getReadingTime()
 * 3. Rounds up to nearest minute for user-friendly display
 * 4. Adds readingTime property to frontmatter data
 *
 * Integration Points:
 * - Works with Astro's markdown processing pipeline
 * - Modifies file.data.astro.frontmatter object
 * - Compatible with other remark/rehype plugins
 */
export const readingTimeRemarkPlugin: RemarkPlugin = () => {
  return function (tree, file) {
    // Convert markdown AST to plain text for reading time calculation
    const textOnPage = toString(tree);

    // Calculate reading time and round up to nearest minute
    const readingTime = Math.ceil(getReadingTime(textOnPage).minutes);

    // Add reading time to frontmatter if available
    if (file.data.astro && file.data.astro.frontmatter) {
      file.data.astro.frontmatter.readingTime = readingTime;
    }
  };
};

/**
 * Rehype plugin that wraps tables in scrollable containers for responsive display.
 *
 * This plugin processes the HTML AST to find table elements and wrap them in
 * div containers with overflow:auto styling. This ensures that tables remain
 * readable on mobile devices by allowing horizontal scrolling when needed.
 *
 * @returns A rehype plugin function that modifies the HTML AST
 *
 * HTML Transformation:
 * 1. Traverses HTML AST to find table elements
 * 2. Wraps each table in a div with overflow:auto style
 * 3. Preserves all table attributes and content
 * 4. Maintains proper HTML structure and nesting
 *
 * Responsive Behavior:
 * - Tables maintain original styling and functionality
 * - Scrollable container only activates when needed
 * - Works with all table sizes and content types
 * - No visual changes on desktop browsers
 */
export const responsiveTablesRehypePlugin: RehypePlugin = () => {
  return function (tree) {
    // Ensure tree has children to process
    if (!tree.children) return;

    // Iterate through tree children to find table elements
    for (let i = 0; i < tree.children.length; i++) {
      const child = tree.children[i];

      // Check if current child is a table element
      if (child.type === 'element' && child.tagName === 'table') {
        // Replace table with wrapped div container
        tree.children[i] = {
          type: 'element',
          tagName: 'div',
          properties: {
            style: 'overflow:auto',
          },
          children: [child],
        };

        // Skip the next iteration since we've modified the array
        i++;
      }
    }
  };
};

/**
 * Rehype plugin that adds lazy loading attributes to images.
 *
 * This plugin processes the HTML AST to find img elements and adds the
 * loading="lazy" attribute to enable browser-native lazy loading. This
 * improves page performance by deferring image loading until images
 * are about to enter the viewport.
 *
 * @returns A rehype plugin function that modifies the HTML AST
 *
 * Performance Benefits:
 * 1. Reduces initial page load time
 * 2. Decreases bandwidth usage for off-screen images
 * 3. Improves Core Web Vitals scores
 * 4. Native browser support (no JavaScript required)
 *
 * Implementation Details:
 * - Uses unist-util-visit to traverse all element nodes
 * - Only modifies img elements
 * - Adds loading="lazy" attribute to existing properties
 * - Preserves all other image attributes and functionality
 */
export const lazyImagesRehypePlugin: RehypePlugin = () => {
  return function (tree) {
    // Ensure tree has children to process
    if (!tree.children) return;

    // Visit all element nodes in the HTML AST
    visit(tree, 'element', function (node) {
      // Check if current node is an image element
      if (node.tagName === 'img') {
        // Add lazy loading attribute to image properties
        node.properties.loading = 'lazy';
      }
    });
  };
};
