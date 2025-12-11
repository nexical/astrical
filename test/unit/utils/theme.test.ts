/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs';
import yaml from 'js-yaml';
import { getComponentClasses, getClasses } from '~/utils/theme';

vi.mock('node:fs');
vi.mock('js-yaml');
vi.mock('~/utils/cache', () => ({
    checkVar: vi.fn(() => false),
    getVar: vi.fn(),
    setVar: vi.fn(),
}));
vi.mock('site:config', () => ({
    UI: { theme: 'default' },
    I18N: {
        language: 'en',
        textDirection: 'ltr',
    }
}));

describe('src/utils/theme', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        vi.spyOn(process, 'cwd').mockReturnValue('/mock/cwd');
        vi.spyOn(fs, 'existsSync').mockReturnValue(true);
        vi.spyOn(fs, 'readFileSync').mockReturnValue('');
        vi.spyOn(yaml, 'load').mockReturnValue({});
    });

    it('should return cached styles in production', async () => {
        vi.resetModules();

        vi.mock('~/utils/utils', async () => {
            const actual = await vi.importActual<any>('~/utils/utils');
            return {
                ...actual,
                isProd: () => true
            };
        });

        const { getClasses: getClassesFresh } = await import('~/utils/theme');
        const { checkVar: checkVarFresh, getVar: getVarFresh } = await import('~/utils/cache');

        (checkVarFresh as any).mockReturnValue(true);
        const cachedMock = { color: 'red' };
        (getVarFresh as any).mockReturnValue(cachedMock);

        getClassesFresh('color');

        expect(fs.readFileSync).not.toHaveBeenCalled();
        // Since loadStyles is not exported, we can't check the return value directly easily
        // unless we mock what getClasses does with it. 
        // But verifying fs.readFileSync NOT called is enough proof cache was used
        // (assuming getClasses doesn't short circuit earlier).

        vi.clearAllMocks();
    });

    it('should load module styles', () => {
        vi.spyOn(fs, 'existsSync').mockReturnValue(true);
        vi.spyOn(fs, 'readdirSync').mockImplementation(((path: string) => {
            if (path.endsWith('modules')) return ['mod1'];
            return [];
        }) as any);
        vi.spyOn(fs, 'readFileSync').mockReturnValue('color: blue');
        (yaml.load as any).mockReturnValue({ color: 'blue' });

        const classes = getClasses('color');
        // If module styles loaded, they merge.
        expect(classes).toBeDefined();
    });

    describe('getComponentClasses()', () => {
        it('should resolve classes', () => {
            const mockThemeStyles = {
                'group1': 'style-1',
                'group2': 'style-2',
            };
            (yaml.load as any).mockReturnValue(mockThemeStyles);

            const classes = {
                base: 'class-base @group1',
                nested: {
                    inner: '@group2'
                }
            };

            const resolved = getComponentClasses(classes);
            expect(resolved.base).toContain('style-1');
            expect(resolved.base).toContain('class-base');
            expect((resolved.nested as any).inner).toBe('style-2');
        });

        it('should return empty object if no classes provided', () => {
            expect(getComponentClasses(undefined)).toEqual({});
        });

        it('should resolve recursive group references', () => {
            const mockThemeStyles = {
                'group1': '@group2',
                'group2': 'final-style',
            };
            (yaml.load as any).mockReturnValue(mockThemeStyles);

            const classes = { base: '@group1' };
            const resolved = getComponentClasses(classes);
            expect(resolved.base).toBe('final-style');
        });

        it('should handle non-string resolution', () => {
            const mockThemeStyles = { 'group': 123 }; // Invalid group type
            (yaml.load as any).mockReturnValue(mockThemeStyles);

            const classes = { base: '@group', other: 456, deep: { val: 789 } };
            const resolved = getComponentClasses(classes);
            expect(resolved.base).toBe(''); // Should resolve to empty string
            expect(resolved.other).toBe(456); // Should pass through
            expect((resolved.deep as any).val).toBe(789);
        });
    });

    describe('getClasses()', () => {
        it('should merge theme and override classes', () => {
            const mockThemeStyles = {
                'Button': { base: 'btn-base', icon: 'icon-base' }
            };
            (yaml.load as any).mockReturnValue(mockThemeStyles);

            const overrides = { base: 'btn-override' };

            const result = getClasses('Button', overrides);

            expect(result.base).toBe('btn-override');
            expect(result.icon).toBe('icon-base');
        });
    });

    describe('Error handling', () => {
        it('should handle fs errors gracefully', () => {
            (fs.readFileSync as any).mockImplementation(() => { throw new Error('File not found'); });
            const resolved = getComponentClasses({});
            expect(resolved).toEqual({});
        });
    });
});
