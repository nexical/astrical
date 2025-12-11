
import { describe, it, expect } from 'vitest';
import { validateName, validateMessage } from '~/utils/validators.js';

describe('src/utils/validators.js', () => {
    describe('validateName()', () => {
        it('should pass for names with at least two words', () => {
            expect(() => validateName('John Doe')).not.toThrow();
            expect(() => validateName('John Michael Doe')).not.toThrow();
        });

        it('should throw error for single word names', () => {
            expect(() => validateName('John')).toThrow('We need your first and last name');
        });

        it('should throw error for empty strings', () => {
            expect(() => validateName('')).toThrow('We need your first and last name');
        });
    });

    describe('validateMessage()', () => {
        it('should pass for messages with 50 or more characters', () => {
            const longMessage = 'a'.repeat(50);
            expect(() => validateMessage(longMessage)).not.toThrow();
        });

        it('should throw error for messages shorter than 50 characters', () => {
            const shortMessage = 'Short message';
            expect(() => validateMessage(shortMessage)).toThrow('You need to provide us a little more detail (at least 50 characters)');
        });
    });
});
