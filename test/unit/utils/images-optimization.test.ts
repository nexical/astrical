
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getImagesOptimized } from '~/utils/images-optimization';

// Mock astro:assets
vi.mock('astro:assets', () => ({
    getImage: vi.fn(async ({ src, width }) => ({
        src: `${typeof src === 'string' ? src : src.src}?w=${width}`,
        width: width,
        height: width, // Mock square aspect ratio
    })),
}));

describe('src/utils/images-optimization', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getImagesOptimized()', () => {
        it('should optimize image string', async () => {
            const image = '/image.png';
            const props = {
                alt: 'Test Image',
                width: 100,
                height: 100
            };

            // Pass a transformation function as the second argument (ImagesOptimizer)
            // In real usage, this is injected. In tests, we can provide a mock or rely on the default if applicable.
            // But the function expects a transformer.
            const mockTransformer = vi.fn(async (img, breakpoints) => {
                return breakpoints.map((w: number) => ({ src: `${img}?w=${w}`, width: w }));
            });

            const result = await getImagesOptimized(image, props, mockTransformer);

            expect(result.src).toBe(image);
            expect(result.attributes.width).toBe(100);
            expect(result.attributes.height).toBe(100);
            expect(result.attributes.srcset).toBeDefined();
        });

        it('should handle layout constrained', async () => {
            const image = '/image.png';
            const props = {
                alt: 'Test',
                layout: 'constrained' as const,
                width: 100,
            };
            const mockTransformer = vi.fn(async (img, breakpoints) => {
                return breakpoints.map((w: number) => ({ src: `${img}?w=${w}`, width: w }));
            });

            const result = await getImagesOptimized(image, props, mockTransformer);
            expect(result.attributes.sizes).toContain('(min-width: 100px) 100px');
        });
    });
});
