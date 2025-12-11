/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs';
import yaml from 'js-yaml';
import { getComponentClasses } from '~/utils/theme';

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

    describe('getComponentClasses()', () => {
        it('should resolve classes', () => {
            // Setup mock styles
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
            // twMerge 'class-base style-1' -> 'class-base style-1'
            expect(resolved.base).toContain('style-1');
            expect(resolved.base).toContain('class-base');
            expect((resolved.nested as any).inner).toBe('style-2');
        });

        it('should return empty object if no classes provided', () => {
            expect(getComponentClasses(undefined)).toEqual({});
        });
    });
});
