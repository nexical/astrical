/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import yaml from 'js-yaml';
// Mocking modules
vi.mock('node:fs');
vi.mock('js-yaml');
import { getSpecs } from '~/utils/loader';
vi.mock('~/utils/cache', () => ({
    checkVar: vi.fn().mockReturnValue(false),
    getVar: vi.fn(),
    setVar: vi.fn(),
}));

// Mock process.cwd and SITE config
// Mock process.cwd and SITE config
vi.mock('site:config', () => ({
    SITE: { contentDir: '/mock/content' },
    I18N: { language: 'en' },
}));

// Dynamic import to allow re-importing with fresh mocks if needed,
// but standard import should work if we rely on vi.mock hoisting.

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

        it('should resolve shared components', () => {
            // Mock content with shared components and pages using them
            (fs.readdirSync as any).mockImplementation((dir: string) => {
                if (dir === '/mock/content') return ['pages', 'shared'];
                if (dir === '/mock/content/pages') return ['page.yaml'];
                if (dir === '/mock/content/shared') return ['button.yaml'];
                return [];
            });

            (yaml.load as any).mockImplementation((content: string) => {
                if (content.includes('page')) return {
                    sections: [{ component: 'button', text: 'Click me' }]
                };
                if (content.includes('button')) return {
                    type: 'Button', color: 'blue', text: 'Default'
                };
                return {};
            });

            (fs.readFileSync as any).mockImplementation((path: string) => {
                if (path.includes('page.yaml')) return 'page content';
                if (path.includes('button.yaml')) return 'button content';
                return '';
            });

            // Reset cache to force reload
            const pages = getSpecs('pages');
            expect((pages as any).page.sections[0]).toEqual({
                type: 'Button',
                color: 'blue',
                text: 'Click me' // Override
            });
        });

        it('should process Form components', () => {
            // Mock content having a form
            (fs.readdirSync as any).mockImplementation((dir: string) => {
                if (dir === '/mock/content') return ['pages'];
                if (dir === '/mock/content/pages') return ['contact.yaml'];
                return [];
            });
            (yaml.load as any).mockReturnValue({
                form: { type: 'Form', name: 'contact-form' }
            });

            const forms = getSpecs('forms');
            expect(forms['contact-form']).toBeDefined();
        });
    });

    it('should return cached content in production', async () => {
        vi.resetModules();

        // Using doMock to ensure it applies for this test run after resetModules
        vi.doMock('~/utils/utils', async () => {
            const actual = await vi.importActual<any>('~/utils/utils');
            return {
                ...actual,
                isProd: () => true
            };
        });

        // Re-import modules to pick up the mock
        const { getSpecs: getSpecsFresh } = await import('~/utils/loader');
        const { checkVar: checkVarFresh, getVar: getVarFresh } = await import('~/utils/cache');

        (checkVarFresh as any).mockReturnValue(true);
        const cachedMock = { pages: { title: 'Cached' } };
        (getVarFresh as any).mockReturnValue(cachedMock);

        const result = getSpecsFresh('pages');
        expect(result).toEqual(cachedMock.pages);
        expect(fs.readFileSync).not.toHaveBeenCalled();

        vi.unstubAllGlobals();
    });

    describe('Module loading', () => {
        it('should load content from modules but exclude menus', () => {
            (fs.existsSync as any).mockReturnValue(true); // Modules exist
            (fs.readdirSync as any).mockImplementation((dir: string) => {
                if (dir.endsWith('modules')) return ['blog'];
                if (dir.includes('modules/blog/content')) return ['posts.yaml', 'menus.yaml'];
                if (dir === '/mock/content') return [];
                return [];
            });
            (fs.statSync as any).mockImplementation(() => ({ isDirectory: () => true }));

            // We need to trigger loadModuleContent which is called by getContent
            // But we can't inspect internal state easily.
            // We can check if 'posts' are loaded (if we map them to spec type)
            // Implementation detail: module content is merged. 
            // 'posts.yaml' -> content['posts']...

            // Reset cache
            (global as any).import = { meta: { env: { DEV: true } } }; // Force reload

            // Setup module content
            (fs.readdirSync as any).mockImplementation((dir: string) => {
                if (dir.endsWith('modules')) return ['blog'];
                if (dir.endsWith('modules/blog/content')) return ['posts'];
                if (dir.endsWith('modules/blog/content/posts')) return ['post1.yaml'];
                if (dir === '/mock/content') return [];
                return [];
            });

            (fs.statSync as any).mockImplementation((path: string) => ({
                isDirectory: () => !path.endsWith('.yaml')
            }));
            (fs.readFileSync as any).mockImplementation((path: string) => {
                if (path.includes('menus')) return 'items: []';
                return 'title: Post';
            });
            (yaml.load as any).mockImplementation((content: string) => {
                if (content.includes('items: []')) return ({ items: [] });
                return { title: 'Post' };
            });

            // getSpecs('posts') should resolve posts from module
            const posts = getSpecs('posts');
            expect(posts.post1).toBeDefined(); // specPath from posts/post1.yaml -> post1'

            // Should NOT have loaded menus (verify deletion)
            expect(() => getSpecs('menus')).toThrow();
        });

        it('should merge module content with project content precedence', () => {
            (fs.existsSync as any).mockReturnValue(true);
            (fs.readdirSync as any).mockImplementation((dir: string) => {
                if (dir.endsWith('modules')) return ['blog'];
                if (dir.endsWith('modules/blog/content')) return ['posts'];
                if (dir.endsWith('modules/blog/content/posts')) return ['post1.yaml'];
                if (dir === '/mock/content') return ['posts'];
                if (dir === '/mock/content/posts') return ['post1.yaml']; // Same filename in project
                return [];
            });

            (fs.statSync as any).mockImplementation((path: string) => ({
                isDirectory: () => !path.endsWith('.yaml')
            }));

            (fs.readFileSync as any).mockImplementation((path: string) => {
                if (path.includes('modules/blog')) return 'message: "Module Content"';
                return 'message: "Project Content"';
            });

            (yaml.load as any).mockImplementation((content: string) => {
                if (content.includes('Module Content')) return { message: 'Module Content' };
                return { message: 'Project Content' };
            });

            // Force reload
            (global as any).import = { meta: { env: { DEV: true } } };

            const posts = getSpecs('posts') as any;
            // Project content should override module content for same key (filename matches)
            expect((posts as any).post1.message).toBe('Project Content');
        });
    });
});
