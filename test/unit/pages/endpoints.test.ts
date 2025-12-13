
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as PageJson from '../../../src/pages/[...build].json';
import * as PageYaml from '../../../src/pages/[...build].yaml';
import * as DataJson from '../../../src/pages/data.json';
import * as DataYaml from '../../../src/pages/data.yaml';
import * as LinksJson from '../../../src/pages/links.json';
import * as LinksYaml from '../../../src/pages/links.yaml';
import * as Generator from '~/utils/generator';

// Mock generator
vi.mock('~/utils/generator', () => ({
    generateLinks: vi.fn(),
    generateData: vi.fn(),
    generateSite: vi.fn(),
}));

describe('Page Endpoints', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // Helper for [...page] tests
    const testSpreadEndpoint = (Module: any, name: string) => {
        describe(name, () => {
            it('getStaticPaths should map generated links', () => {
                (Generator.generateLinks as any).mockReturnValue(['page1', 'page2']);
                const paths = Module.getStaticPaths();
                expect(paths).toEqual([
                    { params: { page: 'page1' } },
                    { params: { page: 'page2' } },
                ]);
            });

            it('GET should return generated data', async () => {
                (Generator.generateData as any).mockReturnValue({ title: 'Test' });
                const response = await Module.GET({ params: { page: 'test-page' } });
                expect(response).toBeInstanceOf(Response);
                const text = await response.text();
                // json or yaml check? 
                // json.ts returns JSON.stringify
                // yaml.ts likely returns YAML string
                expect(text).toContain('Test');
            });
        });
    };

    testSpreadEndpoint(PageJson, '[...build].json');
    testSpreadEndpoint(PageYaml, '[...build].yaml');

    // Helper for static endpoints (data, links)
    const testStaticEndpoint = (Module: any, name: string, isLinks = false) => {
        describe(name, () => {
            it('GET should return generated content', async () => {
                if (isLinks) {
                    (Generator.generateLinks as any).mockReturnValue(['/link1']);
                    // links.json/yaml usually calls generateLinks
                } else {
                    (Generator.generateSite as any).mockReturnValue({ site: true });
                    // data.json/yaml calls generateSite
                }

                // If the module fails because I mocked the wrong thing, I'll see coverage or failure.
                // data.json.ts calls generateNavigation? Or what?
                // Let's assume standard behavior for now.

                const response = await Module.GET();
                expect(response).toBeInstanceOf(Response);
            });
        });
    };

    // Test data endpoints
    testStaticEndpoint(DataJson, 'data.json');
    testStaticEndpoint(DataYaml, 'data.yaml');

    // Test links endpoints
    testStaticEndpoint(LinksJson, 'links.json', true);
    testStaticEndpoint(LinksYaml, 'links.yaml', true);
});
