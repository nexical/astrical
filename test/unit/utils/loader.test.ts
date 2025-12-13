/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getSpecs } from '~/utils/loader';
import * as scanner from '~/utils/content-scanner';
// import * as cache from '~/utils/cache';

// Mock dependencies
vi.mock('~/utils/content-scanner', () => ({
    scanContent: vi.fn(),
}));

vi.mock('~/utils/cache', () => ({
    checkVar: vi.fn().mockReturnValue(false),
    getVar: vi.fn(),
    setVar: vi.fn(),
}));

vi.mock('site:config', () => ({
    SITE: { contentDir: '/mock/content' },
    I18N: { language: 'en' },
}));

describe('src/utils/loader', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('getSpecs()', () => {
        it('should delegate to scanContent and return requested type', () => {
            const mockContent = { pages: { home: {} }, forms: {} };
            (scanner.scanContent as any).mockReturnValue(mockContent);

            const result = getSpecs('pages');

            expect(scanner.scanContent).toHaveBeenCalledWith('/mock/content');
            expect(result).toEqual(mockContent.pages);
        });

        it('should throw error for missing spec type', () => {
            (scanner.scanContent as any).mockReturnValue({ pages: {} });

            expect(() => getSpecs('missing')).toThrow('Data specifications are missing requested type: missing');
        });

        it('should return cached content in production', async () => {
            vi.resetModules();

            // Using doMock to ensure it applies for this test run after resetModules
            vi.doMock('~/utils/utils', async () => {
                const actual = await vi.importActual<any>('~/utils/utils');
                return {
                    ...actual,
                    isProd: () => true
                };
            });
            // Re-mock dependencies for this isolated run
            vi.doMock('~/utils/content-scanner', () => ({
                scanContent: vi.fn(),
            }));
            vi.doMock('site:config', () => ({
                SITE: { contentDir: '/mock/content' },
                I18N: { language: 'en' },
            }));
            vi.doMock('~/utils/cache', () => ({
                checkVar: vi.fn(),
                getVar: vi.fn(),
                setVar: vi.fn(),
            }));

            const { getSpecs: getSpecsFresh } = await import('~/utils/loader');
            const scannerFresh = await import('~/utils/content-scanner');
            const cacheFresh = await import('~/utils/cache');

            const cachedContent = { pages: { title: 'Cached' } };
            (cacheFresh.checkVar as any).mockReturnValue(true);
            (cacheFresh.getVar as any).mockReturnValue(cachedContent);

            const result = getSpecsFresh('pages');

            expect(result).toEqual(cachedContent.pages);
            expect(scannerFresh.scanContent).not.toHaveBeenCalled();

            vi.unstubAllGlobals();
        });
    });
});
