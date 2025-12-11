
import { describe, it, expect } from 'vitest';
import { trimSlash, createPath } from '~/utils/permalinks';

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
            expect(createPath('base', 'slug')).toBe('/base/slug');
        });
        it('should handle empty arguments', () => {
            expect(createPath()).toBe('/');
        });
    });
});
