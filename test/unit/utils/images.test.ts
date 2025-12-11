/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { findImage, adaptOpenGraphImages } from '~/utils/images';

// Mock astro:assets
vi.mock('astro:assets', () => ({
    getImage: vi.fn(async ({ src, width }) => ({
        src: typeof src === 'string' ? src : (src as any).src,
        width: width,
        height: width,
    })),
}));

// Mock @astrolib/seo
vi.mock('@astrolib/seo', () => ({
    // empty mock if needed
}));

describe('src/utils/images', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('findImage()', () => {
        it('should return absolute URLs unchanged', async () => {
            expect(await findImage('https://example.com/img.png')).toBe('https://example.com/img.png');
        });

        it('should return relative paths unchanged', async () => {
            expect(await findImage('/img.png')).toBe('/img.png');
        });

        // We assume local loading fails or returns undefined in test env for '~/assets'
        // unless we mock fetchLocalImages internal loading logic which is hard.
        // But we can verify it doesn't crash.
        it('should handle local paths gracefully', async () => {
            const result = await findImage('~/assets/images/test.png');
            expect(result).toBeNull(); // Expected since glob returns empty in our mock setup
        });
    });

    describe('adaptOpenGraphImages()', () => {
        it('should adapt images with URLs', async () => {
            const og = {
                images: [
                    { url: 'https://example.com/image.png', width: 100, height: 100 }
                ]
            };
            const site = new URL('https://site.com');
            const result = await adaptOpenGraphImages(og, site);

            expect(result.images).toHaveLength(1);
            expect(result.images![0].url).toContain('https://example.com/image.png');
        });
    });
});
