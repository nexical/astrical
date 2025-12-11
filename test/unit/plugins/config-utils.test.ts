/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import buildConfig from '../../../plugins/config/utils/builder';
import { loadConfig } from '../../../plugins/config/utils/loader';
import fs from 'node:fs';

// Mock node:fs
vi.mock('node:fs', async () => {
    return {
        default: {
            readFileSync: vi.fn(),
        }
    };
});

describe('plugins/config/utils', () => {
    describe('builder', () => {
        it('should use defaults when config is empty', () => {
            const result = buildConfig({});

            expect(result.SITE.name).toBe('Website');
            expect(result.SITE.base).toBe('/');
            expect(result.METADATA.robots?.index).toBe(false);
            expect(result.I18N.language).toBe('en');
            expect(result.UI.theme).toBe('default');
            expect(result.ANALYTICS.vendors.googleAnalytics.partytown).toBe(true);
        });

        it('should merge provided values', () => {
            const result = buildConfig({
                site: { name: 'My Site' },
                i18n: { language: 'fr' }
            } as any);

            expect(result.SITE.name).toBe('My Site');
            expect(result.I18N.language).toBe('fr');
        });

        it('should handle nested overrides', () => {
            const result = buildConfig({
                analytics: { vendors: { googleAnalytics: { id: 'G-123' } } }
            } as any);

            expect(result.ANALYTICS.vendors.googleAnalytics.id).toBe('G-123');
            expect(result.ANALYTICS.vendors.googleAnalytics.partytown).toBe(true); // default preserved
        });

        // Test coverage for getMetadata which calls getSite
        it('should use site name as default title', () => {
            const result = buildConfig({ site: { name: 'Custom Site' } } as any);
            expect(result.METADATA.title?.default).toBe('Custom Site');
        });
    });

    describe('loader', () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it('should pass through objects', async () => {
            const config = { foo: 'bar' };
            const result = await loadConfig(config);
            expect(result).toBe(config);
        });

        it('should load and parse YAML files', async () => {
            (fs.readFileSync as Mock).mockReturnValue('name: Test');

            const result = await loadConfig('config.yaml');
            expect(result).toEqual({ name: 'Test' });
            expect(fs.readFileSync).toHaveBeenCalledWith('config.yaml', 'utf8');
        });

        it('should return raw content for non-yaml files', async () => {
            (fs.readFileSync as Mock).mockReturnValue('some content');

            const result = await loadConfig('config.txt');
            expect(result).toBe('some content');
        });
    });
});
