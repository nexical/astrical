import type { AstroIntegration } from 'astro';
import fs from 'node:fs';
import path from 'node:path';

const MODULES_DIR = path.resolve(process.cwd(), 'modules');

/**
 * Astro integration to automatically load pages and API endpoints from modules.
 *
 * This integration scans the `modules/` directory for any `src/pages` subdirectories
 * and injects them into the Astro build using the `injectRoute` API.
 * It supports both `.astro` pages and `.ts` API endpoints.
 */
export default (): AstroIntegration => {
  return {
    name: 'module-integration',
    hooks: {
      'astro:config:setup': ({ injectRoute }) => {
        if (!fs.existsSync(MODULES_DIR)) return;

        const modules = fs.readdirSync(MODULES_DIR);

        for (const moduleName of modules) {
          const modulePagesDir = path.join(MODULES_DIR, moduleName, 'src/pages');

          if (fs.existsSync(modulePagesDir) && fs.statSync(modulePagesDir).isDirectory()) {
            // Recursive function to find all page files
            const scanPages = (dir: string, baseRoute: string) => {
              const files = fs.readdirSync(dir);

              for (const file of files) {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);

                if (stat.isDirectory()) {
                  scanPages(filePath, `${baseRoute}/${file}`);
                } else if (file.endsWith('.astro') || file.endsWith('.ts') || file.endsWith('.js')) {
                  // Construct the route pattern
                  // Remove file extension
                  let routePattern = `${baseRoute}/${file.replace(/\.(astro|ts|js)$/, '')}`;

                  // Handle index routes
                  if (routePattern.endsWith('/index')) {
                    routePattern = routePattern.replace('/index', '') || '/';
                  }

                  injectRoute({
                    pattern: routePattern,
                    entrypoint: filePath,
                  });
                }
              }
            };

            // Start scanning from the module's pages directory
            // The routes will be injected relative to root, so module pages usually should
            // be namespaced within the module structure itself if they want to avoid collision,
            // e.g. modules/store/src/pages/store/... -> /store/...
            scanPages(modulePagesDir, '');
          }
        }
      },
    },
  };
};
