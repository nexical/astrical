
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import siteConfig from '../../../plugins/config/index';
import fs from 'node:fs';

// Mock node modules
vi.mock('node:fs', async () => {
    return {
        default: {
            existsSync: vi.fn(),
            readFileSync: vi.fn(),
            writeFileSync: vi.fn(),
        }
    };
});

vi.mock('node:os', async () => {
    return {
        default: {
            EOL: '\n',
        }
    };
});

// Mock internal utils
vi.mock('../../../plugins/config/utils/loader', () => ({
    loadConfig: vi.fn().mockResolvedValue({}),
}));

vi.mock('../../../plugins/config/utils/builder', () => ({
    default: vi.fn().mockReturnValue({
        SITE: { site: 'https://example.com', base: '/', trailingSlash: false },
        I18N: {},
        METADATA: {},
        UI: {},
        ANALYTICS: {}
    }),
}));

describe('plugins/config/index', () => {
    let integration: any;
    const updateConfig = vi.fn();
    const addWatchFile = vi.fn();
    const logger = {
        fork: vi.fn().mockReturnValue({
            info: vi.fn(),
        }),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        integration = siteConfig();
    });

    it('should have the correct name', () => {
        expect(integration.name).toBe('site-config');
    });

    describe('astro:config:setup', () => {
        it('should setup configuration correctly', async () => {
            const config = { root: new URL('file:///root/') };
            const setup = integration.hooks['astro:config:setup'];

            await setup({ config, logger, updateConfig, addWatchFile } as any);

            expect(updateConfig).toHaveBeenCalledWith(expect.objectContaining({
                site: 'https://example.com',
                base: '/',
                trailingSlash: 'never',
                vite: expect.any(Object),
            }));

            // Check vite plugin
            const viteConfig = updateConfig.mock.calls[0][0].vite;
            const plugin = viteConfig.plugins[0];
            expect(plugin.name).toBe('vite-plugin-site_config');

            // Check resolveId
            expect(plugin.resolveId('site:config')).toBe('\0site:config');
            expect(plugin.resolveId('other')).toBeUndefined();

            // Check load
            const code = plugin.load('\0site:config');
            expect(code).toContain('export const SITE =');

            expect(addWatchFile).toHaveBeenCalled();
        });

        it('should handle trailingSlash: true', async () => {
            // Mock builder to return trailingSlash: true
            const buildConfigMock = await import('../../../plugins/config/utils/builder');
            (buildConfigMock.default as Mock).mockReturnValueOnce({
                SITE: { site: 'https://example.com', base: '/', trailingSlash: true, contentDir: '' } as any,
                I18N: {} as any, METADATA: {} as any, UI: {} as any, ANALYTICS: {} as any
            });

            const setup = integration.hooks['astro:config:setup'];
            const config = { root: new URL('file:///root/') };

            // updateConfig mock needs to be fresh or cleared? reused is fine.
            updateConfig.mockClear();

            await setup({ config, logger, updateConfig, addWatchFile } as any);

            expect(updateConfig).toHaveBeenCalledWith(expect.objectContaining({
                trailingSlash: 'always',
            }));
        });

        it('should handle getContentPath logic (fallback to root)', async () => {
            // Re-create integration implies loading config again
            // To test getContentPath branch, we rely on how it sets contentDir.
            // But getContentPath is internal. We can infer it from side effects if possible,
            // or export it. Since it's internal, we test via behavior.
            // If config file path has no slash, it returns root.
            const integrationSimple = siteConfig({ config: 'config.yaml' });
            const setup = integrationSimple.hooks['astro:config:setup'];
            const config = { root: new URL('file:///root/') };

            await setup!({ config, logger, updateConfig, addWatchFile } as any);

            // Verify behavior didn't crash
            expect(updateConfig).toHaveBeenCalled();
        });
    });

    describe('astro:config:done', () => {
        it('should store the config', async () => {
            const config = { outDir: new URL('file:///out'), publicDir: new URL('file:///public') };
            const done = integration.hooks['astro:config:done'];
            await done({ config });
            // No visible output, but needed for next step
        });
    });

    describe('astro:build:done', () => {
        it('should do nothing if sitemap integration is missing', async () => {
            // Setup stored config
            await integration.hooks['astro:config:done']({ config: { integrations: [] } });

            const buildDone = integration.hooks['astro:build:done'];
            await buildDone({ logger });

            expect(fs.writeFileSync).not.toHaveBeenCalled();
        });

        it('should update robots.txt if sitemap integration exists', async () => {
            const config = {
                outDir: new URL('file:///out/'),
                publicDir: new URL('file:///public/'),
                site: 'https://example.com',
                base: '/',
                integrations: [{ name: '@astrojs/sitemap' }]
            };
            // Store config
            await integration.hooks['astro:config:done']({ config });

            (fs.existsSync as Mock).mockReturnValue(true); // sitemap exists
            (fs.readFileSync as Mock).mockReturnValue('User-agent: *');

            const buildDone = integration.hooks['astro:build:done'];
            await buildDone({ logger });

            expect(fs.writeFileSync).toHaveBeenCalledWith(
                expect.any(URL),
                expect.stringContaining('Sitemap: https://example.com/sitemap-index.xml'),
                expect.anything()
            );
        });

        it('should replace existing sitemap in robots.txt', async () => {
            const config = {
                outDir: new URL('file:///out/'),
                publicDir: new URL('file:///public/'),
                site: 'https://example.com',
                base: '/',
                integrations: [{ name: '@astrojs/sitemap' }]
            };
            await integration.hooks['astro:config:done']({ config });

            (fs.existsSync as Mock).mockReturnValue(true);
            (fs.readFileSync as Mock).mockReturnValue('User-agent: *\nSitemap: old-url');

            const buildDone = integration.hooks['astro:build:done'];
            await buildDone({ logger });

            expect(fs.writeFileSync).toHaveBeenCalledWith(
                expect.any(URL),
                'User-agent: *\nSitemap: https://example.com/sitemap-index.xml',
                expect.anything()
            );
        });

        it('should handle errors gracefully', async () => {
            // Force error in fs.readFileSync
            (fs.existsSync as Mock).mockReturnValue(true);
            (fs.readFileSync as Mock).mockImplementation(() => { throw new Error('fail'); });

            const config = {
                outDir: new URL('file:///out/'),
                publicDir: new URL('file:///public/'),
                site: 'https://example.com',
                base: '/',
                integrations: [{ name: '@astrojs/sitemap' }]
            };
            await integration.hooks['astro:config:done']({ config });

            const buildDone = integration.hooks['astro:build:done'];
            // Should not throw
            await buildDone({ logger });
        });
    });
});
