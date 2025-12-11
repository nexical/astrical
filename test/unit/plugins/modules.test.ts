/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import moduleIntegration from '../../../plugins/modules/index';
import fs from 'node:fs';
import path from 'node:path';

// Mock node:fs
vi.mock('node:fs', async () => {
    return {
        default: {
            existsSync: vi.fn(),
            readdirSync: vi.fn(),
            statSync: vi.fn(),
        }
    };
});

describe('plugins/modules/index', () => {
    const injectRoute = vi.fn();
    const MODULES_DIR = path.resolve(process.cwd(), 'modules');

    beforeEach(() => {
        vi.resetAllMocks();
    });

    const getIntegration = () => moduleIntegration();

    it('should define the integration', () => {
        const integration = getIntegration();
        expect(integration.name).toBe('module-integration');
        expect(integration.hooks['astro:config:setup']).toBeDefined();
    });

    describe('astro:config:setup', () => {
        it('should doing nothing if modules directory does not exist', () => {
            (fs.existsSync as Mock).mockReturnValue(false);
            const integration = getIntegration();
            const setup = integration.hooks['astro:config:setup'] as any;

            setup({ injectRoute });

            expect(fs.existsSync).toHaveBeenCalledWith(MODULES_DIR);
            expect(fs.readdirSync).not.toHaveBeenCalled();
        });

        it('should iterate over modules and scan pages', () => {
            // Setup mock file system
            // modules/
            //   module-a/
            //     src/pages/
            //       index.astro
            //       about.astro
            //       api/
            //         data.ts
            //   module-b/ 
            //     (no src/pages)

            // Mocks for existsSync
            (fs.existsSync as Mock).mockImplementation((p: string) => {
                if (p === MODULES_DIR) return true;
                if (p === path.join(MODULES_DIR, 'module-a', 'src/pages')) return true;
                if (p === path.join(MODULES_DIR, 'module-b', 'src/pages')) return false;
                return false;
            });

            // Mocks for statSync (isDirectory)
            (fs.statSync as Mock).mockImplementation((p: string) => {
                // For modules loop
                if (p.endsWith('src/pages')) return { isDirectory: () => true };
                if (p.endsWith('api')) return { isDirectory: () => true };
                if (p.includes('.')) return { isDirectory: () => false }; // files
                return { isDirectory: () => true }; // default directories
            });

            // Mocks for readdirSync
            (fs.readdirSync as Mock).mockImplementation((p: string) => {
                if (p === MODULES_DIR) return ['module-a', 'module-b'];
                if (p === path.join(MODULES_DIR, 'module-a', 'src/pages')) return ['index.astro', 'about.astro', 'api', 'ignored.txt'];
                if (p === path.join(MODULES_DIR, 'module-a', 'src/pages', 'api')) return ['data.ts'];
                return [];
            });

            const integration = getIntegration();
            const setup = integration.hooks['astro:config:setup'] as any;

            setup({ injectRoute });

            // module-b should be skipped (no src/pages)

            // module-a checks:

            // index.astro
            expect(injectRoute).toHaveBeenCalledWith({
                pattern: '/',
                entrypoint: path.join(MODULES_DIR, 'module-a', 'src/pages', 'index.astro')
            });

            // about.astro
            expect(injectRoute).toHaveBeenCalledWith({
                pattern: '/about',
                entrypoint: path.join(MODULES_DIR, 'module-a', 'src/pages', 'about.astro')
            });

            // api/data.ts
            expect(injectRoute).toHaveBeenCalledWith({
                pattern: '/api/data',
                entrypoint: path.join(MODULES_DIR, 'module-a', 'src/pages', 'api', 'data.ts')
            });
        });

        it('should handle index routes correctly in subdirectories', () => {
            // modules/mod/src/pages/blog/index.astro -> /blog
            (fs.existsSync as Mock).mockReturnValue(true);
            (fs.statSync as Mock).mockImplementation((p: string) => {
                if (p.endsWith('src/pages')) return { isDirectory: () => true };
                if (p.endsWith('blog')) return { isDirectory: () => true };
                return { isDirectory: () => false };
            });
            (fs.readdirSync as Mock).mockImplementation((p: string) => {
                if (p === MODULES_DIR) return ['mod'];
                if (p.endsWith('src/pages')) return ['blog'];
                if (p.endsWith('blog')) return ['index.astro'];
                return [];
            });

            const integration = getIntegration();
            const setup = integration.hooks['astro:config:setup'] as any;
            setup({ injectRoute });

            expect(injectRoute).toHaveBeenCalledWith({
                pattern: '/blog',
                entrypoint: expect.stringContaining('blog/index.astro')
            });
        });
    });
});
