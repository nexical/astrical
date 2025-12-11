
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getImagesOptimized, astroAssetsOptimizer, unpicOptimizer, isUnpicCompatible } from '~/utils/images-optimization';

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

    describe('Optimizers', () => {
        it('astroAssetsOptimizer should optimize local images', async () => {
            const result = await astroAssetsOptimizer({ src: '/local.png', width: 100, height: 100, format: 'png' }, [100, 200]);
            expect(result).toHaveLength(2);
            expect(result[0].src).toContain('?w=100');
        });

        it('unpicOptimizer should support compatible URLs', async () => {
            expect(isUnpicCompatible('https://images.unsplash.com/photo-123')).toBe(true);
            expect(isUnpicCompatible('/local.png')).toBe(false);
        });

        it('unpicOptimizer should optimize remote images', async () => {
            const url = 'https://images.unsplash.com/photo-123';
            const result = await unpicOptimizer(url, [100], 800, 600);
            expect(result).toHaveLength(1);
            expect(result[0].src).not.toBe(url); // Should be transformed
        });
    });

    describe('getImagesOptimized()', () => {
        const mockTransformer = vi.fn(async (img, breakpoints) => {
            return breakpoints.map((w: number) => ({ src: `${img}?w=${w}`, width: w }));
        });

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


            const result = await getImagesOptimized(image, props, mockTransformer);
            expect(result.attributes.sizes).toContain('(min-width: 100px) 100px');
        });

        it('should handle aspect ratio formats', async () => {
            // Number
            let res = await getImagesOptimized('/img', { aspectRatio: 1.5, width: 100 }, mockTransformer);
            expect(res.attributes.height).toBeCloseTo(66.67, 1);

            // String "w:h"
            res = await getImagesOptimized('/img', { aspectRatio: "16:9", width: 160 }, mockTransformer);
            expect(res.attributes.height).toBe(90);

            // String "w/h"
            res = await getImagesOptimized('/img', { aspectRatio: "16/9", width: 160 }, mockTransformer);
            expect(res.attributes.height).toBe(90);
        });

        it('should calculate missing dimension from aspect ratio', async () => {
            // Missing height
            let res = await getImagesOptimized('/img', { aspectRatio: 2, width: 100 }, mockTransformer);
            expect(res.attributes.height).toBe(50);

            // Missing width
            res = await getImagesOptimized('/img', { aspectRatio: 2, height: 50 }, mockTransformer);
            expect(res.attributes.width).toBe(100);
        });

        it('should handle different layouts', async () => {
            // Fixed
            let res = await getImagesOptimized('/img', { layout: 'fixed', width: 100 }, mockTransformer);
            expect(res.attributes.style).toContain('width: 100px');
            expect(res.attributes.sizes).toBe('100px');

            // FullWidth
            res = await getImagesOptimized('/img', { layout: 'fullWidth', width: 1000 }, mockTransformer);
            expect(res.attributes.style).toContain('width: 100%');
            expect(res.attributes.sizes).toBe('100vw');

            // Cover
            res = await getImagesOptimized('/img', { layout: 'cover' }, mockTransformer);
            expect(res.attributes.style).toContain('width: 100%');
        });

        it('should handle background option', async () => {
            // Color
            let res = await getImagesOptimized('/img', { style: 'foo', background: 'red' }, mockTransformer);
            expect(res.attributes.style).toContain('background: red');

            // Image URL
            res = await getImagesOptimized('/img', { background: 'https://bg.jpg' }, mockTransformer);
            expect(res.attributes.style).toContain('background-image: url(https://bg.jpg)');
        });

        it('should infer dimensions from ImageMetadata', async () => {
            const meta = { src: '/img.png', width: 200, height: 100, format: 'png' };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res = await getImagesOptimized(meta as any, {}, mockTransformer);
            expect(res.attributes.width).toBe(200);
            expect(res.attributes.height).toBe(100);
        });

        it('should log error when aspectRatio is provided without dimensions', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            await getImagesOptimized('/img', { aspectRatio: 1.5 }, mockTransformer);
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('When aspectRatio is set'));
            consoleSpy.mockRestore();
        });

        it('should log error when dimensions are missing', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            await getImagesOptimized('/img', {}, mockTransformer);
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Either aspectRatio or both width and height must be set'));
            consoleSpy.mockRestore();
        });
    });
});
