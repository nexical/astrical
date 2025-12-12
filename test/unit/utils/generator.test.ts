/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generate, generateLinks, getHeaderMenu, getFooterMenu, getActions, getAuxMenu, getSocialMenu, getFootNote, getFormField, generateData, generateSite, generateSection } from '~/utils/generator';

vi.mock('~/utils/loader', () => ({
    getSpecs: vi.fn(),
}));
vi.mock('~/utils/router', () => ({
    routes: vi.fn(),
}));
vi.mock('~/components', () => ({
    supportedTypes: {
        'TestComponent': { isAstro: true }
    }
}));
// Mock site:config
vi.mock('site:config', () => ({
    SITE: { organization: 'Test Org' }
}));

import { getSpecs } from '~/utils/loader';
import { routes } from '~/utils/router';

describe('src/utils/generator', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe('Menu Getters', () => {
        beforeEach(() => {
            (getSpecs as any).mockReturnValue({
                'header': [{ text: 'Home' }],
                'footer': [{ title: 'Links' }],
                'actions': [{ text: 'Click' }],
                'auxillary': [{ text: 'Aux' }],
                'social': [{ text: 'Social' }]
            });
        });

        it('should retrieve all menu types', () => {

            expect(getHeaderMenu()).toEqual([{ text: 'Home' }]);
            expect(getFooterMenu()).toEqual([{ title: 'Links' }]);
            expect(getActions()).toEqual([{ text: 'Click' }]);
            expect(getAuxMenu()).toEqual([{ text: 'Aux' }]);
            expect(getSocialMenu()).toEqual([{ text: 'Social' }]);
        });
    });

    describe('getFootNote()', () => {
        it('should return copyright string with year and org', () => {
            const year = new Date().getFullYear();
            expect(getFootNote()).toBe(`© ${year}, Test Org`);
        });
    });

    describe('generate() & generateSection()', () => {

        it('should resolve supported components', () => {
            const components = [
                { type: 'TestComponent', props: { a: 1 } },
                { type: 'Unknown', props: { b: 2 } }
            ];
            const result = generate(components as any);
            expect(result).toHaveLength(1);
            expect(result[0].props).toEqual({ type: 'TestComponent', props: { a: 1 } });
        });

        it('should handle empty input', () => {
            expect(generate(undefined as any)).toEqual([]);
            expect(generateSection(undefined as any)).toEqual([]);
        });
    });

    describe('generateLinks()', () => {
        it('should return page links excluding home', () => {
            (routes as any).mockReturnValue([
                { name: 'home' },
                { name: 'page1' },
                { name: 'page2' }
            ]);
            expect(generateLinks()).toEqual(['page1', 'page2']);
        });
    });

    describe('getFormField()', () => {

        it('should generate form field config', () => {
            const item = { name: 'email', type: 'text', label: 'Email', placeholder: 'Enter email' };
            const result = getFormField('contact', item as any);

            expect(result.name).toBe('contact-email');
            expect(result.type).toBe('field');
            expect(result.props.name).toBe('contact-email');
            expect(result.props.label).toBe('Email');
            expect(result.tag).toBeUndefined(); // 'text' not in supportedTypes mock
        });

        it('should handle supported field type', () => {
            const item = { name: 'field1', type: 'TestComponent' };
            const result = getFormField('form', item as any);
            expect(result.tag).toBeDefined();
            expect(result.tag).toEqual({ isAstro: true });
        });
    });

    describe('Data Generation', () => {
        it('should generate clean data stripping styles', () => {
            (getSpecs as any).mockImplementation((type: string) => {
                if (type === 'pages') return {
                    'home': {
                        title: 'Home',
                        bg: 'red',
                        classes: 'p-4',
                        content: {
                            text: 'Hello',
                            bg: 'blue' // Nested style
                        }
                    }
                };
                if (type === 'menus') return { header: [] };
                return {};
            });

            const data = generateData('home');
            expect(data).toEqual({
                title: 'Home',
                content: { text: 'Hello' }
            });
            // Should removed bg and classes
            expect((data as any).bg).toBeUndefined();
        });

        it('should return null for missing page', () => {
            (getSpecs as any).mockReturnValue({});
            expect(generateData('missing')).toBeNull();
        });

        it('should generate complete site data', () => {
            (getSpecs as any).mockImplementation((type: string) => {
                if (type === 'pages') return { 'p1': { title: 'P1' } };
                if (type === 'menus') return { header: [{ text: 'H' }] };
                return {};
            });

            const site = generateSite();
            expect(site.menus).toEqual({ header: [{ text: 'H' }] });
            expect(site.pages).toEqual({ 'p1': { title: 'P1' } });
        });
    });
});
