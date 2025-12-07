import type { AstroIntegration } from 'astro';
import type { ViteDevServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import partytown from '@astrojs/partytown';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';
import icon from 'astro-icon';
import compress from 'astro-compress';
import siteConfig from './plugins/config';
import { readingTimeRemarkPlugin, responsiveTablesRehypePlugin, lazyImagesRehypePlugin } from './src/utils/frontmatter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const hasExternalScripts = false;
const whenExternalScripts = (items: (() => AstroIntegration) | (() => AstroIntegration)[] = []) =>
  hasExternalScripts ? (Array.isArray(items) ? items.map((item) => item()) : [items()]) : [];

const watchDataFiles = () => ({
  name: 'watch-data',
  configureServer(server: ViteDevServer) {
    console.log('[watch-data] Plugin loaded');

    const reload = (file: string) => {
      console.log(`[watch-data] Reload triggered due to: ${file}`);
      server.ws.send({ type: 'full-reload' });
    };

    server.watcher.on('all', (_event: string, path: string) => {
      if (path.endsWith('.yaml') || path.endsWith('.css')) {
        reload(path);
      }
    });
  },
});

export default defineConfig({
  output: 'static',
  prefetch: false,

  server: {
    headers: {
      'Content-Security-Policy':
        "default-src data: * 'localhost'; " +
        "script-src * 'unsafe-inline' 'localhost' '*.googletagmanager.com' '*.facebook.net'; " +
        "style-src * 'unsafe-inline' 'localhost'; " +
        "media-src data: * 'localhost'; " +
        'frame-src data: *; ' +
        'connect-src data: *; ' +
        "img-src * 'localhost'; ",
    },
  },

  integrations: [
    sitemap(),
    mdx(),
    icon({
      include: {
        tabler: ['*'],
        'flat-color-icons': [
          'template',
          'gallery',
          'approval',
          'document',
          'advertising',
          'currency-exchange',
          'voice-presentation',
          'business-contact',
          'database',
        ],
      },
    }),
    ...whenExternalScripts(() =>
      partytown({
        config: { forward: ['dataLayer.push'] },
      })
    ),
    compress({
      CSS: true,
      HTML: {
        'html-minifier-terser': {
          removeAttributeQuotes: false,
        },
      },
      Image: false,
      JavaScript: true,
      SVG: false,
      Logger: 1,
    }),
    siteConfig({
      config: './content/config.yaml',
    }),
  ],

  image: {
    domains: [],
  },

  markdown: {
    remarkPlugins: [readingTimeRemarkPlugin],
    rehypePlugins: [responsiveTablesRehypePlugin, lazyImagesRehypePlugin],
  },

  vite: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    plugins: [tailwindcss() as any, watchDataFiles()],
    resolve: {
      alias: {
        '~': path.resolve(__dirname, './src'),
      },
    },
    ssr: {
      external: ['node:child_process', 'node:async_hooks', 'node:fs', 'node:path', 'node:url', 'node:crypto', 'path'],
    },
  },

  adapter: cloudflare({
    imageService: 'passthrough',
    platformProxy: { enabled: true },
  }),
});
