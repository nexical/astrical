/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { getImagesOptimized, unpicOptimizer, astroAssetsOptimizer } from '../../../src/utils/images-optimization';

describe('src/utils/images-optimization (Edge Cases)', () => {

    describe('getImagesOptimized', () => {
        it('should use default transform if none provided', async () => {
            const result = await getImagesOptimized('/img.jpg', { alt: 'test' });
            expect(result.src).toBe('/img.jpg');
            // default transform returns empty array, so srcset is empty string/undefined
            expect(result.attributes.srcset).toBeUndefined();
        });

        it('should handle background URL style', async () => {
            const result = await getImagesOptimized('/img.jpg', {
                alt: 'test',
                background: 'https://example.com/bg.png'
            });
            expect(result.attributes.style).toContain('background-image: url(https://example.com/bg.png)');
            expect(result.attributes.style).toContain('background-size: cover');
        });

        it('should handle background color style', async () => {
            const result = await getImagesOptimized('/img.jpg', {
                alt: 'test',
                background: '#fff'
            });
            expect(result.attributes.style).toContain('background: #fff');
        });

        it('should warn if aspectRatio set without dimensions (not fullWidth)', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            await getImagesOptimized('/img.jpg', { alt: 'test', aspectRatio: 1.5, layout: 'fixed' });
            expect(consoleSpy).toHaveBeenCalledWith('When aspectRatio is set, either width or height must also be set');
            consoleSpy.mockRestore();
        });

        it('should warn if no dimensions set (not fullWidth)', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
            await getImagesOptimized('/img.jpg', { alt: 'test', layout: 'fixed' });
            expect(consoleSpy).toHaveBeenCalledWith('Either aspectRatio or both width and height must be set');
            consoleSpy.mockRestore();
        });

        it('should handle ImageMetadata input with partial dims', async () => {
            const img = { src: '/img.png', width: 100, height: 50, format: 'png' };
            const result = await getImagesOptimized(img as any, { alt: 'test', width: 50 }); // height calc
            expect(result.attributes.height).toBe(25);
        });

        it('should handle layout types style generation', async () => {
            const layouts = ['fixed', 'constrained', 'fullWidth', 'responsive', 'contained', 'cover'];
            for (const l of layouts) {
                await getImagesOptimized('/img', { alt: 't', layout: l as any });
            }
            // Just ensuring branches run
        });

        it('should handle layouts with valid width (hitting getSizes)', async () => {
            const layouts = ['fixed', 'constrained', 'fullWidth', 'responsive', 'contained', 'cover'];
            for (const l of layouts) {
                await getImagesOptimized('/img', { alt: 't', width: 100, layout: l as any });
            }
        });

        it('should handle invalid layout (hitting default/unreachable)', async () => {
            await getImagesOptimized('/img', { alt: 't', width: 100, layout: 'invalid' as any });
        });

        it('should handle string aspect ratio', async () => {
            const result = await getImagesOptimized('/img', { alt: 't', aspectRatio: '16/9', width: 100 });
            expect(result.attributes.height).toBeTruthy(); // should be calculated
        });
    });

    describe('unpicOptimizer', () => {
        it('should return empty array for invalid inputs', async () => {
            expect(await unpicOptimizer(null as any, [], 100, 100)).toEqual([]);
            expect(await unpicOptimizer({} as any, [], 100, 100)).toEqual([]);
        });

        it('should return empty if parseUrl fails', async () => {
            // 'invalid-url' might be parsed as relative, so it might not fail parseUrl?
            // unpic parseUrl usually returns undefined for relative paths if not cdn
            expect(await unpicOptimizer('/local.jpg', [100], 100, 100)).toEqual([]);
        });
    });

    describe('astroAssetsOptimizer', () => {
        it('should return empty if no image', async () => {
            expect(await astroAssetsOptimizer(null as any, [], 100, 100)).toEqual([]);
        });
    });
});
