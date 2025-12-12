import { describe, it, expect, vi } from 'vitest';

// Mock config BEFORE import
vi.mock('site:config', () => ({
    SITE: {
        site: 'https://example.com',
        base: undefined, // Test default fallback
        trailingSlash: false,
    },
    I18N: {
        language: 'en',
        textDirection: 'ltr',
    }
}));

describe('src/utils/permalinks (Base Path Fallback)', () => {
    it('should fall back to / if base is undefined', async () => {
        // Dynamic import to ensure module is evaluated with current mock
        const { getPermalink } = await import('~/utils/permalinks');

        // Base is undefined -> '/'
        // getPermalink('about') -> createPath('/', 'about') -> '/about'
        expect(getPermalink('about')).toBe('/about');
    });
});
