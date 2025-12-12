/**
 * src/core/test/unit/utils/form-registry.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { FormHandler } from '~/types';

// Mock astro:env/server before importing the registry (which imports handlers)
vi.mock('astro:env/server', () => ({
    getSecret: (key: string) => {
        if (key === 'SMTP_PORT') return '587';
        if (key === 'SMTP_SECURE') return 'false';
        return 'test-value';
    }
}));

import * as formHandlerRegistryModule from '~/form-registry';
const { formHandlers: formHandlerRegistry } = formHandlerRegistryModule;



describe('FormHandlerRegistry', () => {
    describe('Auto-registration', () => {
        it('should have default handlers registered from core', () => {
            // SMTP and Mailgun should be auto-registered
            expect(formHandlerRegistry.get('smtp')).toBeDefined();
            expect(formHandlerRegistry.get('mailgun')).toBeDefined();
        });
    });

    describe('Manual Management', () => {
        beforeEach(() => {
            // Since it's a singleton, we need to clear it before each test
            // I added a clear() method to the implementation for this purpose.
            formHandlerRegistry.clear();
        });

        const mockHandler: FormHandler = {
            name: 'test-handler',
            description: 'A test handler',
            handle: async () => { }
        };

        it('should register a handler', () => {
            formHandlerRegistry.register(mockHandler);
            expect(formHandlerRegistry.get('test-handler')).toBe(mockHandler);
        });

        it('should return undefined for unknown handler', () => {
            expect(formHandlerRegistry.get('unknown')).toBeUndefined();
        });

        it('should return all registered handlers', () => {
            formHandlerRegistry.register(mockHandler);
            const handlers = formHandlerRegistry.getAll();
            expect(handlers).toHaveLength(1);
            expect(handlers[0]).toBe(mockHandler);
        });

        it('should overwrite existing handler with same name', () => {
            const handler2 = { ...mockHandler, description: 'Updated handler' };
            formHandlerRegistry.register(mockHandler);
            formHandlerRegistry.register(handler2);

            expect(formHandlerRegistry.get('test-handler')).toBe(handler2);
            expect(formHandlerRegistry.getAll()).toHaveLength(1);
        });
    });

    describe('Discovery Logic', () => {
        const { discoverHandlers, FormHandlerRegistry } = formHandlerRegistryModule;

        it('should handle invalid exports gracefully', () => {
            const registry = new FormHandlerRegistry();
            const handlers = {
                'mod1': {
                    'notAClass': 123,
                    'funcNoProto': () => { },
                    'classError': class { constructor() { throw new Error('Fail'); } },
                    'classNoInterface': class { name = 123; }, // Invalid name type
                    'valid': class { name = 'valid'; handle = async () => { }; }
                }
            };

            // Should not throw
            discoverHandlers(registry, handlers);

            expect(registry.get('valid')).toBeDefined();
            expect(registry.getAll()).toHaveLength(1);
        });

        it('should ignore duplicate handlers', () => {
            const registry = new FormHandlerRegistry();
            const handlerClass = class { name = 'duplicate'; handle = async () => { }; };
            const handlers = {
                'mod1': { 'h1': handlerClass },
                'mod2': { 'h2': handlerClass }
            };

            discoverHandlers(registry, handlers);
            expect(registry.getAll()).toHaveLength(1);
        });
    });
});
