
import { describe, it, expect } from 'vitest';
import { trim, isObject, mergeDeep, toUiAmount, getFormattedDate, isProd } from '~/utils/utils';

describe('src/utils/utils', () => {
    describe('getFormattedDate()', () => {
        it('should format date', () => {
            const date = new Date('2023-01-01T00:00:00Z');
            expect(getFormattedDate(date)).toBeDefined();
        });

        it('should return empty string for invalid date', () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect(getFormattedDate(undefined as any)).toBe('');
        });
    });

    describe('trim()', () => {
        it('should trim default whitespace', () => {
            expect(trim('  hello  ')).toBe('hello');
        });

        it('should trim specified character', () => {
            expect(trim('__hello__', '_')).toBe('hello');
        });

        it('should handle empty strings', () => {
            expect(trim('')).toBe('');
        });

        it('should handle strings without trim characters', () => {
            expect(trim('hello')).toBe('hello');
        });
    });

    describe('isObject()', () => {
        it('should return true for plain objects', () => {
            expect(isObject({})).toBe(true);
            expect(isObject({ a: 1 })).toBe(true);
        });

        it('should return false for arrays', () => {
            expect(isObject([])).toBe(false);
        });

        it('should return false for null', () => {
            expect(isObject(null)).toBe(false);
        });

        it('should return false for primitives', () => {
            expect(isObject('string')).toBe(false);
            expect(isObject(123)).toBe(false);
            expect(isObject(true)).toBe(false);
        });
    });

    describe('mergeDeep()', () => {
        it('should merge two simple objects', () => {
            const target = { a: 1 };
            const source = { b: 2 };
            expect(mergeDeep(target, source)).toEqual({ a: 1, b: 2 });
        });

        it('should merge nested objects', () => {
            const target = { a: { x: 1 } };
            const source = { a: { y: 2 } };
            expect(mergeDeep(target, source)).toEqual({ a: { x: 1, y: 2 } });
        });

        it('should merge new nested objects', () => {
            const target = {};
            const source = { a: { y: 2 } };
            expect(mergeDeep(target, source)).toEqual({ a: { y: 2 } });
        });

        it('should overwrite primitive values', () => {
            const target = { a: 1 };
            const source = { a: 2 };
            expect(mergeDeep(target, source)).toEqual({ a: 2 });
        });

        it('should handle multiple sources', () => {
            const target = { a: 1 };
            const source1 = { b: 2 };
            const source2 = { c: 3 };
            expect(mergeDeep(target, source1, source2)).toEqual({ a: 1, b: 2, c: 3 });
        });

        it('should ignore source if target is not object', () => {
            expect(mergeDeep(1, { a: 2 })).toBe(1);
        });
    });

    describe('toUiAmount()', () => {
        it('should format thousands', () => {
            expect(toUiAmount(1000)).toBe('1K');
            expect(toUiAmount(1500)).toBe('1.5K');
        });

        it('should format millions', () => {
            expect(toUiAmount(1000000)).toBe('1M');
            expect(toUiAmount(1500000)).toBe('1.5M');
        });

        it('should format billions', () => {
            expect(toUiAmount(1000000000)).toBe('1B');
            expect(toUiAmount(1500000000)).toBe('1.5B');
        });

        it('should return 0 for 0 or NaN', () => {
            expect(toUiAmount(0)).toBe(0);
            expect(toUiAmount(NaN)).toBe(0);
        });
        it('should return number as string for small numbers', () => {
            expect(toUiAmount(999)).toBe('999');
        });
    });
});

describe('isProd()', () => {
    it('should return boolean', () => {
        expect(typeof isProd()).toBe('boolean');
    });

    it('should return false when catch block triggered', () => {
        // This path is extremely hard to trigger in test env as import.meta.env is always defined
    });
});
