
import { describe, it, expect } from 'vitest';
import { createComponentMap, supportedTypes, supportedLayouts } from '../../src/components';
import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

describe('src/components.ts', () => {
    describe('createComponentMap', () => {
        it('should create a map of component names to factories', () => {
            const mockFactory = (() => 'mock-component') as unknown as AstroComponentFactory;
            const glob = {
                '/path/to/ComponentA.astro': { default: mockFactory },
                '/path/to/ComponentB.astro': { default: mockFactory },
            };

            const result = createComponentMap(glob);

            expect(result).toEqual({
                ComponentA: mockFactory,
                ComponentB: mockFactory,
            });
        });

        it('should ignore entries with invalid paths or names', () => {
            const mockFactory = (() => 'mock-component') as unknown as AstroComponentFactory;
            const glob = {
                '/path/to/.astro': { default: mockFactory }, // Edge case: hidden file or empty name?
                // actually split('/').pop() for '/path/to/.astro' is '.astro', replaced to '' -> empty string.
            };

            // If componentName is empty string check
            // path.split('/').pop()?.replace('.astro', '')
            // '.astro' -> ''

            const result = createComponentMap(glob);
            expect(result).toEqual({});
        });

        it('should handle paths without .astro extension correctly if passed (though glob usually filters)', () => {
            const mockFactory = (() => 'mock-component') as unknown as AstroComponentFactory;
            // logic is simply replace('.astro', '')
            const glob = {
                '/path/to/ComponentC.js': { default: mockFactory }
            };
            // ComponentC.js -> ComponentC.js (replace fails)
            const result = createComponentMap(glob);
            expect(result).toEqual({
                'ComponentC.js': mockFactory
            });
        });
    });

    describe('Module Exports', () => {
        it('should export supportedTypes object', () => {
            expect(supportedTypes).toBeDefined();
            expect(typeof supportedTypes).toBe('object');
        });

        it('should export supportedLayouts object', () => {
            expect(supportedLayouts).toBeDefined();
            expect(typeof supportedLayouts).toBe('object');
        });
    });
});
