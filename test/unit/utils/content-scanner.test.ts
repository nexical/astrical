/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import yaml from 'js-yaml';
// Mocking modules
vi.mock('node:fs');
vi.mock('js-yaml');
import { scanContent } from '~/utils/content-scanner';

// Mock process.cwd and SITE config
vi.mock('site:config', () => ({
    SITE: { contentDir: '/mock/content' }, // Although scanContent takes dir as arg
    I18N: { language: 'en' },
}));


describe('src/utils/content-scanner', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.resetAllMocks();
        // Setup default filesystem mocks
        vi.spyOn(process, 'cwd').mockReturnValue('/mock/cwd');

        // Mock fs.existsSync
        vi.spyOn(fs, 'existsSync').mockImplementation(((path: string) => {
            if (path.startsWith('/mock/content')) return true;
            if (path.includes('modules')) return false; // Default for modules
            return false;
        }) as any);

        // Mock fs.readdirSync to return files
        vi.spyOn(fs, 'readdirSync').mockImplementation(((dir: string) => {
            if (dir === '/mock/content') return ['pages'];
            if (dir === '/mock/content/pages') return ['home.yaml'];
            return [];
        }) as any);

        // Mock fs.statSync
        vi.spyOn(fs, 'statSync').mockImplementation(((path: string) => ({
            isDirectory: () => !path.endsWith('.yaml') && !path.endsWith('.yml'),
        })) as any);

        // Mock fs.readFileSync
        vi.spyOn(fs, 'readFileSync').mockReturnValue('yaml content');

        // Mock yaml.load
        vi.spyOn(yaml, 'load').mockReturnValue({ title: 'Home Page' });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('scanContent()', () => {
        it('should load pages configurations', () => {
            const content = scanContent('/mock/content');
            expect(content.pages).toEqual({
                home: { title: 'Home Page' }
            });
            expect(fs.readFileSync).toHaveBeenCalled();
            expect(yaml.load).toHaveBeenCalledWith('yaml content');
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

            const content = scanContent('/mock/content');
            expect((content.pages as any).page.sections[0]).toEqual({
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

            const content = scanContent('/mock/content');
            expect((content.forms as any)['contact-form']).toBeDefined();
        });
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
            (fs.statSync as any).mockImplementation(((_path: string) => ({
                isDirectory: () => true
            })) as any);

            // Setup module content
            (fs.readdirSync as any).mockImplementation((dir: string) => {
                if (dir.endsWith('modules')) return ['blog'];
                if (dir.endsWith('modules/blog/content')) return ['posts', 'menus.yaml'];
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

            const content = scanContent('/mock/content');
            // posts should be defined
            expect((content.posts as any).post1).toBeDefined();

            // Should NOT have loaded menus
            expect(content.menus).toBeUndefined();
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

            const content = scanContent('/mock/content');
            const posts = content.posts as any;
            expect((posts as any).post1.message).toBe('Project Content');
        });
    });

    describe('Coverage Gaps', () => {
        it('should load .yml files', () => {
            (fs.readdirSync as any).mockImplementation((dir: string) => {
                if (dir === '/mock/content') return ['pages'];
                if (dir === '/mock/content/pages') return ['old.yml'];
                return [];
            });
            (fs.statSync as any).mockImplementation((path: string) => ({
                isDirectory: () => !path.endsWith('.yml'),
            }));
            (fs.readFileSync as any).mockReturnValue('old: true');
            (yaml.load as any).mockReturnValue({ old: true });

            const content = scanContent('/mock/content');
            expect((content.pages as any).old).toEqual({ old: true });
        });

        it('should keep component reference if not found in shared', () => {
            (fs.readdirSync as any).mockImplementation((dir: string) => {
                if (dir === '/mock/content') return ['pages'];
                if (dir === '/mock/content/pages') return ['test.yaml'];
                return [];
            });

            (fs.readFileSync as any).mockReturnValue('content');
            (yaml.load as any).mockReturnValue({
                sections: [{ component: 'unknown-component', prop: 1 }]
            });

            const content = scanContent('/mock/content');
            const pages = content.pages as any;
            expect(pages.test.sections[0]).toEqual({ component: 'unknown-component', prop: 1 });
        });

        it('should ignore non-yaml files', () => {
            (fs.readdirSync as any).mockImplementation((dir: string) => {
                if (dir === '/mock/content') return ['pages'];
                if (dir === '/mock/content/pages') return ['valid.yaml', 'ignored.txt'];
                return [];
            });

            (fs.statSync as any).mockImplementation((path: string) => ({
                isDirectory: () => path.endsWith('pages')
            }));
            (fs.readFileSync as any).mockImplementation((path: string) => {
                if (path.includes('valid.yaml')) return 'valid: true';
                return 'ignored: true';
            });
            (yaml.load as any).mockImplementation((content: string) => {
                if (content.includes('valid: true')) return { valid: true };
                return { ignored: true };
            });

            const content = scanContent('/mock/content');
            expect(content.pages).toEqual({ valid: { valid: true } });
        });

        it('should handle multiple files in same spec type', () => {
            (fs.readdirSync as any).mockImplementation((dir: string) => {
                if (dir === '/mock/content') return ['pages'];
                if (dir === '/mock/content/pages') return ['p1.yaml', 'p2.yaml'];
                return [];
            });
            (fs.readFileSync as any).mockImplementation((path: string) => {
                if (path.includes('p1')) return 'title: P1';
                return 'title: P2';
            });
            (yaml.load as any).mockImplementation((content: string) => {
                if (content.includes('P1')) return { title: 'P1' };
                return { title: 'P2' };
            });

            const content = scanContent('/mock/content');
            expect((content.pages as any).p1).toEqual({ title: 'P1' });
            expect((content.pages as any).p2).toEqual({ title: 'P2' });
        });
    });
});
