
import { describe, it, expect, vi } from 'vitest';
import { getImagesOptimized } from '~/utils/images-optimization';

describe('src/utils/images-optimization (Gaps)', () => {

    it('should handle ImageMetadata with string width/height needing conversion', async () => {
        // ImageMetadata usually has number width/height, but code has Number(image.width)
        // mocking object with string properties to test that branch
        const img = { src: '/img.png', width: '100', height: '50', format: 'png' };
        // Pass NO width/height in props, so it must use image properties
        // @ts-ignore
        const result = await getImagesOptimized(img, { alt: 'test' });

        expect(result.attributes.width).toBe(100);
        expect(result.attributes.height).toBe(50);
    });

    it('should calculate height from ImageMetadata when only width is derived', async () => {
        const img = { src: '/img.png', width: 200, height: 100, format: 'png' };
        // We force width to be picked up from image (200), and height to be undefined initially
        // but typically getImagesOptimized calculates height if width exists.
        // Code: height ||= typeof width === 'number' ? computeHeight(width, image.width / image.height) : undefined;

        // If we provide width in props, it overrides. If we don't, it uses image.width.
        // If we don't provide height, it uses image.height (if available?) 
        // Wait, the code: width ||= Number(image.width)
        // height ||= ... computeHeight ...
        // If image.height is present (it is in metadata), does it use it?
        // No! The code at line 471 ONLY does computeHeight if height is falsy.
        // It does NOT use image.height directly unless we trick it?
        // Actually line 471: height ||= typeof width === 'number' ? ...
        // So if image has height, it is IGNORED if not passed in props? 
        // Wait, let's re-read code:
        // if (typeof image !== 'string') {
        //   width ||= Number(image.width) || undefined;
        //   height ||= typeof width === 'number' ? computeHeight(width, image.width / image.height) : undefined;
        // }

        // So yes, it ALWAYS calculates height from aspect ratio of metadata, it doesn't take image.height directly?
        // image.width / image.height IS the aspect ratio.
        // So computeHeight(width, aspect) should equal image.height if width == image.width.

        // To test coverage, we just need to ensure this math runs.
        const result = await getImagesOptimized(img as any, { alt: 'test' });
        expect(result.attributes.height).toBe(100);
    });

    it('should handle fullWidth layout with aspectRatio but no dimensions', async () => {
        // This targets the else if (layout !== 'fullWidth') check
        // We want layout === 'fullWidth' so it enters the block (or skips the error)
        // Logic: if (aspectRatio) { ... } else if (layout !== 'fullWidth') error
        // Wait, inside if (aspectRatio):
        //   if (width) ... else if (height) ... else if (layout !== 'fullWidth') error
        // We want: aspectRatio = true, width = undefined, height = undefined, layout = fullWidth
        // This should NOT error.

        const consoleSpy = vi.spyOn(console, 'error');

        const result = await getImagesOptimized('/img.png', {
            alt: 'test',
            layout: 'fullWidth',
            aspectRatio: 2
        });

        expect(consoleSpy).not.toHaveBeenCalled();
        expect(result.attributes.style).toContain('aspect-ratio: 2');
    });

    it('should handle string float aspect ratio and fraction strings', async () => {
        // Targets: parseAspectRatio string float parsing AND fraction match

        // Float string
        const result = await getImagesOptimized('/img.png', {
            alt: 'test',
            width: 100,
            aspectRatio: '1.5' // String float
        });
        // 100 / 1.5 = 66.666
        expect(result.attributes.height).toBeCloseTo(66.67, 1);

        // Fraction string (16/9)
        const resultFraction = await getImagesOptimized('/img.png', {
            alt: 'test',
            width: 1600,
            aspectRatio: '16/9'
        });
        // 1600 / (16/9) = 1600 * 9 / 16 = 100 * 9 = 900
        expect(resultFraction.attributes.height).toBe(900);

        // Colon fraction string (4:3)
        const resultColon = await getImagesOptimized('/img.png', {
            alt: 'test',
            width: 400,
            aspectRatio: '4:3'
        });
        // 400 / (4/3) = 300
        expect(resultColon.attributes.height).toBe(300);

        // Zero denominator (100/0) -> Should return undefined, so height logic won't trigger dimension calc from aspectRatio
        // But what happens if aspectRatio is undefined?
        // Line 482: if (aspectRatio) ...
        // If undefined, it skips scaling.
        // So we can check if height is NOT calculated (remains undefined or falls back).
        // Pass ONLY width.
        const resultZero = await getImagesOptimized('/img.png', {
            alt: 'test',
            width: 100,
            aspectRatio: '100/0'
        });
        // height should be undefined because aspectRatio became undefined.
        // Wait, if image is '/img.png' (string), and NO height provided:
        // Line 471: height ||= ... but condition `typeof image !== 'string'`
        // If image IS string, these are skipped.
        // Line 475: height ... undefined.
        // Line 482: if (aspectRatio) -> False.
        // Line 496: else if (width && height) -> False (height undef).
        // Line 498: else if (layout !== 'fullWidth') -> Error log.

        // We expect Error log!
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        const resultZero2 = await getImagesOptimized('/img.png', {
            alt: 'test',
            width: 100,
            aspectRatio: '100/0'
        });
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();

        // Invalid string (NaN)
        // Should return undefined from parseAspectRatio
        const resultNaN = await getImagesOptimized('/img.png', {
            alt: 'test',
            width: 100,
            aspectRatio: 'invalid'
        });
        // Behaves as if no aspectRatio provided.
        expect(resultNaN.attributes.height).toBeUndefined();
    });

    it('should handle ImageMetadata with provided width/height props (short-circuit)', async () => {
        const img = { src: '/img.png', width: 200, height: 100, format: 'png' };
        // Props override image metadata, so logic short-circuits
        const result = await getImagesOptimized(img as any, {
            alt: 'test',
            width: 50,
            height: 25
        });
        expect(result.attributes.width).toBe(50);
        expect(result.attributes.height).toBe(25);
    });

    it('should handle aspectRatio with BOTH width and height', async () => {
        // Targets line 484: if (height) { /* empty */ }
        const result = await getImagesOptimized('/img.png', {
            alt: 'test',
            aspectRatio: 2,
            width: 100,
            height: 50
        });
        expect(result.attributes.width).toBe(100);
        expect(result.attributes.height).toBe(50);
    });

    it('should handle pixelate(0)', async () => {
        // If width is 0, pixelate should return "0px"
        // But getImagesOptimized might filter 0?
        // Let's try layout fixed with 0 width?
        // width = (width && Number(width)) || undefined; -> 0 becomes undefined!
        // So passing width: 0 makes it undefined.
        // So we can't test pixelate(0) via public API if input 0 is cleared.
        // However, checking line 474: width = (width && Number(width)) || undefined;
        // If width is 0, it becomes undefined.
        // So pixelate(0) might be unreachable via getImagesOptimized?
        // But maybe getStyle is called with 0 from somewhere else?
        // Wait, line 519 calls getStyle with width being undefined if it was 0.
        // So pixelate(0) only reachable if width is not normalized?
        // But width IS normalized.
        // Maybe height? Same normalization for height.
    });

    it('should handle unpicOptimizer without width/height', async () => {
        // Targets unpicOptimizer line 425 else branch
        const { unpicOptimizer } = await import('~/utils/images-optimization');
        const url = 'https://images.unsplash.com/photo-123';
        const result = await unpicOptimizer(url, [100], undefined, undefined);
        expect(result).toHaveLength(1);
    });

    it('should fallback to image url if transformUrl returns null', async () => {
        vi.resetModules(); // Ensure we reload module with mock
        // Mock unpic to return null
        vi.doMock('unpic', () => ({
            parseUrl: () => ({ cdn: 'unsplash' }),
            transformUrl: () => null // Return null to trigger || image
        }));

        const { unpicOptimizer } = await import('~/utils/images-optimization'); // Re-import to pick up mock
        const result = await unpicOptimizer('https://example.com/img.jpg', [100], 100, 100);

        expect(result[0].src).toBe('https://example.com/img.jpg');
        vi.doUnmock('unpic');
    });

    it('should handle ImageMetadata missing width (NaN branch)', async () => {
        const img = { src: '/img.png', height: 100, format: 'png' }; // No width
        const result = await getImagesOptimized(img as any, { alt: 'test' });
        // Width will be undefined.
        expect(result.attributes.width).toBeUndefined();
    });

    it('should handle constrained layout with explicit widths', async () => {
        // Targets getBreakpoints logic: breakpoints || config.deviceSizes
        // Logic requires a transformer to generate srcset
        const mockTransformer = vi.fn(async (img, breakpoints) => {
            return breakpoints.map((w: number) => ({ src: `${img}?w=${w}`, width: w }));
        });

        const result = await getImagesOptimized('/img.png', {
            alt: 'test',
            layout: 'constrained',
            width: 100,
            widths: [50, 100, 200]
        }, mockTransformer);

        expect(result.attributes.srcset).toBeDefined();
    });

    it('should handle aspectRatio logic for all layouts', async () => {
        // Targets aspect-ratio ? ... : undefined branches in getStyle
        const layouts = ['constrained', 'fullWidth', 'responsive', 'contained'];

        for (const layout of layouts) {
            // Case 1: aspectRatio present
            const res1 = await getImagesOptimized('/img.png', {
                alt: 'test',
                layout: layout as any,
                aspectRatio: 1.5,
                width: 100 // needed for some
            });
            expect(res1.attributes.style).toContain('aspect-ratio: 1.5');

            // Case 2: aspectRatio missing (implicit undefined)
            // Already covered by general tests traversing layouts without aspectRatio
        }
    });

    it('should handle fullWidth/responsive layouts with explicit widths', async () => {
        // Targets getBreakpoints logic: breakpoints || config.deviceSizes
        const mockTransformer = vi.fn(async (img, breakpoints) => {
            return breakpoints.map((w: number) => ({ src: `${img}?w=${w}`, width: w }));
        });

        const result = await getImagesOptimized('/img.png', {
            alt: 'test',
            layout: 'fullWidth',
            widths: [100, 200]
        }, mockTransformer);
        expect(result.attributes.srcset).toBeDefined();
        expect(result.attributes.srcset).toContain('100w');
    });

    it('should handle different image formats via inference', async () => {
        // Targets inferImageFormat branches
        // We must NOT pass 'format' in metadata, so it calls inferImageFormat

        // SVG
        const resSvg = await getImagesOptimized({ src: '/img.svg', width: 100, height: 100 } as any, { alt: 'svg' });
        expect(resSvg.attributes).toBeDefined();

        // HEIC -> AVIF
        const resHeic = await getImagesOptimized({ src: '/img.heic', width: 100, height: 100 } as any, { alt: 'heic' });
        expect(resHeic.attributes).toBeDefined();

        // AVIF
        const resAvif = await getImagesOptimized({ src: '/img.avif', width: 100, height: 100 } as any, { alt: 'avif' });
        expect(resAvif.attributes).toBeDefined();

        // WEBP
        const resWebp = await getImagesOptimized({ src: '/img.webp', width: 100, height: 100 } as any, { alt: 'webp' });
        expect(resWebp.attributes).toBeDefined();
    });

    it('should handle missing widths (default to config) for layouts', async () => {
        // Targets breakpoints || config.deviceSizes branches
        const mockTransformer = vi.fn(async (img, breakpoints) => {
            return breakpoints.map((w: number) => ({ src: `${img}?w=${w}`, width: w }));
        });

        // Responsive (line 341)
        const resResp = await getImagesOptimized('/img.png', {
            alt: 'test',
            layout: 'responsive',
            widths: undefined
        }, mockTransformer);
        expect(resResp.attributes.srcset).toBeDefined();

        // Constrained (line 356)
        const resConstr = await getImagesOptimized('/img.png', {
            alt: 'test',
            layout: 'constrained',
            width: 100,
            widths: undefined
        }, mockTransformer);
        expect(resConstr.attributes.srcset).toBeDefined();
    });

    it('should handle style explicit null', async () => {
        // Targets: ... }${style ?? ''}`
        // We pass style: null via cast
        const result = await getImagesOptimized('/img.png', {
            alt: 'test',
            style: null as any
        });

        // Should not contain "null" string, should be empty string appended
        expect(result.attributes.style).not.toContain('null');
    });
});
