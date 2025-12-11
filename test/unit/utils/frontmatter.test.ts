/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment */
import { describe, it, expect } from 'vitest';
import { readingTimeRemarkPlugin } from '~/utils/frontmatter';

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
            expect(file.data.astro.frontmatter.readingTime).toBe(0); // or 1 depending on implementation
        });
    });
});
