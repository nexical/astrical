/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { trimSlash, createPath, getCanonical, getPermalink, getAsset } from '~/utils/permalinks';
import { SITE } from 'site:config';

vi.mock('site:config', () => ({
    SITE: {
        site: 'https://example.com',
        base: '/base',
        trailingSlash: false,
    },
    I18N: {
        language: 'en',
        textDirection: 'ltr',
    }
}));

describe('src/utils/permalinks', () => {
    describe('trimSlash()', () => {
        it('should trim slashes from both ends', () => {
            expect(trimSlash('/slug/')).toBe('slug');
        });
        it('should return empty string for slash only', () => {
            expect(trimSlash('/')).toBe('');
        });
    });

    describe('createPath()', () => {
        it('should create a path from arguments', () => {
            expect(createPath('foo', 'bar')).toBe('/foo/bar');
            // No, createPath implementation: '/' + paths + trailing...
            // It DOES NOT prepend BASE_PATHNAME.
            // But definitivePermalink DOES.
            // Let's check source code of createPath:
            /*
            export const createPath = (...params: string[]) => {
              const paths = params...
              return '/' + paths + ...
            };
            */
            // So createPath('foo', 'bar') -> '/foo/bar'.
            expect(createPath('foo', 'bar')).toBe('/foo/bar');
        });
    });

    describe('getCanonical()', () => {
        it('should return canonical url', () => {
            expect(getCanonical('/path')).toBe('https://example.com/path');
        });

        it('should append trailing slash when configured', () => {
            // Mock trailingSlash = true
            vi.mocked(SITE).trailingSlash = true as any;
            expect(getCanonical('/path')).toBe('https://example.com/path/');
            vi.mocked(SITE).trailingSlash = false as any; // Reset
        });

        it('should handle trailing slash config', () => {
            expect(getCanonical('/path/')).toBe('https://example.com/path'); // Should remove slash per mock config
        });

        it('should handle empty path (home)', () => {
            expect(getCanonical('')).toBe('https://example.com/');
        });
    });

    describe('getPermalink()', () => {
        it('should return external links as is', () => {
            expect(getPermalink('https://google.com')).toBe('https://google.com');
        });

        it('should generate page permalink', () => {
            // getPermalink calls definitivePermalink which calls createPath(BASE_PATHNAME, permalink)
            // BASE_PATHNAME is SITE.base which is '/base'
            // So '/base/about'
            expect(getPermalink('about')).toBe('/base/about');
        });

        it('should generate home permalink', () => {
            expect(getPermalink('', 'home')).toBe('/base');
        });

        it('should generate asset permalink', () => {
            expect(getPermalink('image.png', 'asset')).toBe('/base/image.png');
        });
    });

    describe('getAsset()', () => {
        it('should generate asset url', () => {
            expect(getAsset('styles.css')).toBe('/base/styles.css');
        });
    });
});
