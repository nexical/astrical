/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment */
import { describe, it, expect } from 'vitest';
import { readingTimeRemarkPlugin, responsiveTablesRehypePlugin, lazyImagesRehypePlugin } from '~/utils/frontmatter';

describe('src/utils/frontmatter', () => {
    describe('readingTimeRemarkPlugin', () => {
        it('should calculate reading time', () => {
            const plugin = (readingTimeRemarkPlugin as any)();
            // Mock AST tree
            const tree = {
                type: 'root',
                children: [
                    { type: 'text', value: 'word '.repeat(300) } // ~1-2 mins
                ]
            };
            const file: any = { data: { astro: { frontmatter: {} } } };

            // @ts-ignore
            (plugin as any)(tree, file);

            expect(file.data.astro.frontmatter.readingTime).toBeGreaterThan(0);
        });

        it('should handle empty content', () => {
            const plugin = (readingTimeRemarkPlugin as any)();
            const tree = { type: 'root', children: [] };
            const file: any = { data: { astro: { frontmatter: {} } } };
            // @ts-ignore
            (plugin as any)(tree, file);
            expect(file.data.astro.frontmatter.readingTime).toBe(0);
        });
    });

    describe('responsiveTablesRehypePlugin', () => {
        it('should wrap tables in div', () => {
            const plugin = (responsiveTablesRehypePlugin as any)();
            const tree = {
                children: [
                    { type: 'element', tagName: 'p' },
                    { type: 'element', tagName: 'table' }
                ]
            };

            (plugin as any)(tree);

            expect((tree.children[1] as any).tagName).toBe('div');
            expect((tree.children[1] as any).properties.style).toBe('overflow:auto');
            expect((tree.children[1] as any).children[0].tagName).toBe('table');
        });

        it('should ignore non-table elements', () => {
            const plugin = (responsiveTablesRehypePlugin as any)();
            const tree = {
                children: [
                    { type: 'element', tagName: 'p' }
                ]
            };
            (plugin as any)(tree);
            expect((tree.children[0] as any).tagName).toBe('p');
        });

        it('should handle tree with no children', () => {
            const plugin = (responsiveTablesRehypePlugin as any)();
            const tree = {};
            (plugin as any)(tree);
            // Should not throw
            expect(tree).toEqual({});
        });
    });

    describe('readingTimeRemarkPlugin', () => {
        // ... existing tests ...
        it('should safely handle missing astro data', () => {
            const plugin = (readingTimeRemarkPlugin as any)();
            const tree = { type: 'root', children: [] };
            const file: any = { data: {} };
            (plugin as any)(tree, file);
            expect(file.data.readingTime).toBeUndefined();
        });
    });

    describe('lazyImagesRehypePlugin', () => {
        it('should add loading="lazy" to images', () => {
            const plugin = (lazyImagesRehypePlugin as any)();
            const imgNode = { type: 'element', tagName: 'img', properties: {} };
            const tree = {
                children: [
                    { type: 'element', tagName: 'p' },
                    imgNode
                ]
            };

            // Mock visit (simple implementation for test)
            // Since real visit is imported, we can't easily mock it without module mock.
            // But we can check if it works if we use the real one.
            // If real one fails, we mock it.

            (plugin as any)(tree);

            expect((imgNode as any).properties.loading).toBe('lazy');
        });

        it('should handle tree with no children', () => {
            const plugin = (lazyImagesRehypePlugin as any)();
            const tree = {};
            (plugin as any)(tree);
            expect(tree).toEqual({});
        });
    });
});
