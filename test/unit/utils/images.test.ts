/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getImage } from 'astro:assets';
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

        it('should return any string unchanged', async () => {
            // In the new implementation, everything that is a string is returned as is
            expect(await findImage('~/assets/images/test.png')).toBe('~/assets/images/test.png');
        });

        it('should return non-string inputs as-is', async () => {
            const meta = { src: 'img.png', width: 100, height: 100 } as any;
            expect(await findImage(meta)).toBe(meta);
            expect(await findImage(null)).toBeNull();
        });
    });

    describe('adaptOpenGraphImages()', () => {
        it('should handle getImage failure (returning non-object)', async () => {
            // Mock getImage to return null to hit the fallback branch
            (getImage as any).mockResolvedValueOnce(null);

            const openGraph = { images: [{ url: 'https://example.com/test.png' }] };
            const result = await adaptOpenGraphImages(openGraph as any);
            expect(result.images?.[0].url).toBe('');
        });

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

        it('should handle empty images list', async () => {
            const og = { images: [] };
            const result = await adaptOpenGraphImages(og as any, new URL('https://site.com'));
            expect(result).toEqual(og);
        });

        it('should handle missing image url', async () => {
            const og = { images: [{ width: 100 }] };
            const result = await adaptOpenGraphImages(og as any, new URL('https://site.com'));
            expect(result.images![0].url).toBe('');
        });

        it('should handle getImage having invalid src', async () => {
            // Mock getImage returning object without src
            (getImage as any).mockResolvedValueOnce({ width: 100 });
            const og = { images: [{ url: 'https://example.com/img.png' }] };
            const result = await adaptOpenGraphImages(og as any, new URL('https://site.com'));
            // The code returns 'pepe' in this case
            expect(result.images![0].url).toBe('pepe');
        });

        it('should handle getImage having non-string src', async () => {
            // Mock getImage returning object with non-string src
            (getImage as any).mockResolvedValueOnce({ src: 123, width: 100 });
            const og = { images: [{ url: 'https://example.com/img.png' }] };
            const result = await adaptOpenGraphImages(og as any, new URL('https://site.com'));
            expect(result.images![0].url).toBe('pepe');
        });

        it('should handle adaptOpenGraphImages returning object without dimensions', async () => {
            (getImage as any).mockResolvedValueOnce({
                src: 'optimized.jpg'
                // missing width/height
            });

            const og = {
                images: [{ url: 'http://example.com/image.jpg' }]
            };

            const result = await adaptOpenGraphImages(og, new URL('https://example.com'));
            expect(result.images?.[0].width).toBeUndefined();
        });
    });
});
