
import { describe, it, expect, beforeEach } from 'vitest';
import { checkVar, getVar, getObject, setVar, addVars, deleteVar } from '~/utils/cache';

// We need to access the underlying map to reset it, or use the exposed methods.
// Since `cache.ts` doesn't export the map, we rely on the exported methods.

describe('src/utils/cache', () => {
    const TEST_KEY = 'testKey';
    const TEST_VALUE = 'testValue';

    beforeEach(() => {
        // Clear the specific test key before each test
        deleteVar(TEST_KEY);
        deleteVar('objKey');
    });

    describe('setVar() & checkVar()', () => {
        it('should set a variable and return true for existence', () => {
            setVar(TEST_KEY, TEST_VALUE);
            expect(checkVar(TEST_KEY)).toBe(true);
        });

        it('should return false for non-existent variable', () => {
            expect(checkVar('nonExistent')).toBe(false);
        });
    });

    describe('getVar()', () => {
        it('should retrieve a stored variable', () => {
            setVar(TEST_KEY, TEST_VALUE);
            expect(getVar(TEST_KEY)).toBe(TEST_VALUE);
        });

        it('should return default value if variable does not exist', () => {
            expect(getVar('nonExistent', 'default')).toBe('default');
        });

        it('should return null by default if variable does not exist', () => {
            expect(getVar('nonExistent')).toBeNull();
        });
    });

    describe('getObject()', () => {
        it('should return a copy of the stored object', () => {
            const obj = { a: 1 };
            setVar('objKey', obj);
            const retrieved = getObject('objKey');
            expect(retrieved).toEqual(obj);
            expect(retrieved).not.toBe(obj); // Ensure it's a copy (shallow copy via Object.assign)
        });

        it('should return empty object if not found', () => {
            expect(getObject('nonExistent')).toEqual({});
        });
    });

    describe('addVars()', () => {
        it('should add variables to an existing object in cache', () => {
            setVar('objKey', { a: 1 });
            addVars('objKey', { b: 2 });
            expect(getVar('objKey')).toEqual({ a: 1, b: 2 });
        });

        it('should create new object if key does not exist', () => {
            addVars('objKey', { b: 2 });
            expect(getVar('objKey')).toEqual({ b: 2 });
        });
    });

    describe('deleteVar()', () => {
        it('should delete a variable from cache', () => {
            setVar(TEST_KEY, TEST_VALUE);
            deleteVar(TEST_KEY);
            expect(checkVar(TEST_KEY)).toBe(false);
        });
    });
});
