/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generate, generateLinks, getHeaderMenu } from '~/utils/generator';

vi.mock('~/utils/loader', () => ({
    getSpecs: vi.fn(),
}));
vi.mock('~/utils/router', () => ({
    routes: vi.fn(),
}));
vi.mock('~/components', () => ({
    supportedTypes: {
        'TestComponent': { isAstro: true }
    }
}));
// Mock site:config
vi.mock('site:config', () => ({
    SITE: { organization: 'Test Org' }
}));

import { getSpecs } from '~/utils/loader';
import { routes } from '~/utils/router';

describe('src/utils/generator', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe('getHeaderMenu()', () => {
        it('should return header menu', () => {
            (getSpecs as any).mockReturnValue({
                'header': [{ text: 'Home', href: '/' }]
            });
            expect(getHeaderMenu()).toEqual([{ text: 'Home', href: '/' }]);
        });
    });

    describe('generate()', () => {
        it('should resolve supported components', () => {
            const components = [
                { type: 'TestComponent', props: { a: 1 } },
                { type: 'Unknown', props: { b: 2 } }
            ];
            const result = generate(components as any);
            expect(result).toHaveLength(1);
            expect(result[0].props).toEqual({ type: 'TestComponent', props: { a: 1 } });
        });
    });

    describe('generateLinks()', () => {
        it('should return page links excluding home', () => {
            (routes as any).mockReturnValue([
                { name: 'home' },
                { name: 'page1' },
                { name: 'page2' }
            ]);
            expect(generateLinks()).toEqual(['page1', 'page2']);
        });
    });
});
