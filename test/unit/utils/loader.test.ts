/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import yaml from 'js-yaml';
// Mocking modules
vi.mock('node:fs');
vi.mock('js-yaml');
vi.mock('~/utils/cache', () => ({
    checkVar: vi.fn().mockReturnValue(false),
    getVar: vi.fn(),
    setVar: vi.fn(),
}));

// Mock process.cwd and SITE config
vi.mock('site:config', () => ({
    SITE: { contentDir: '/mock/content' },
}));

// Dynamic import to allow re-importing with fresh mocks if needed,
// but standard import should work if we rely on vi.mock hoisting.
import { getSpecs } from '~/utils/loader';

describe('src/utils/loader', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        // Setup default filesystem mocks
        vi.spyOn(process, 'cwd').mockReturnValue('/mock/cwd');

        // Mock fs.existsSync to return false for modules by default
        vi.spyOn(fs, 'existsSync').mockReturnValue(false);

        // Mock fs.readdirSync to return files
        vi.spyOn(fs, 'readdirSync').mockImplementation(((dir: string) => {
            if (dir === '/mock/content') return ['pages'];
            if (dir === '/mock/content/pages') return ['home.yaml'];
            return [];
        }) as any);

        // Mock fs.statSync
        vi.spyOn(fs, 'statSync').mockImplementation(((path: string) => ({
            isDirectory: () => !path.endsWith('.yaml'),
        })) as any);

        // Mock fs.readFileSync
        vi.spyOn(fs, 'readFileSync').mockReturnValue('yaml content');

        // Mock yaml.load
        vi.spyOn(yaml, 'load').mockReturnValue({ title: 'Home Page' });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('getSpecs()', () => {
        it('should load pages configurations', () => {
            const pages = getSpecs('pages');
            expect(pages).toEqual({
                home: { title: 'Home Page' }
            });
            expect(fs.readFileSync).toHaveBeenCalled();
            expect(yaml.load).toHaveBeenCalledWith('yaml content');
        });

        it('should throw error for missing spec type', () => {
            expect(() => getSpecs('missing')).toThrow('Data specifications are missing requested type: missing');
        });
    });
});
