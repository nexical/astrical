/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { routes, getLayout } from '~/utils/router';

vi.mock('~/utils/loader', () => ({
    getSpecs: vi.fn(),
}));

import { getSpecs } from '~/utils/loader';

describe('src/utils/router', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe('routes()', () => {
        it('should return array of cards for pages', () => {
            const mockPages = {
                'page1': { title: 'Page 1' },
                'page2': { title: 'Page 2' }
            };
            (getSpecs as any).mockReturnValue(mockPages);

            const result = routes();
            expect(result).toHaveLength(2);
            expect(result).toContainEqual({ name: 'page1', props: { title: 'Page 1' } });
            expect(result).toContainEqual({ name: 'page2', props: { title: 'Page 2' } });
        });
    });

    describe('getLayout()', () => {
        it('should return empty object if name is undefined', () => {
            expect(getLayout(undefined)).toEqual({});
        });

        it('should extract layout blocks', () => {
            const mockPage = {
                metadata: {
                    title: 'Meta Title',
                    announcement: { id: 'announce' },
                    header: { id: 'header' },
                    footer: { id: 'footer' },
                }
            };
            (getSpecs as any).mockReturnValue({ 'test-page': mockPage });

            const layout = getLayout('test-page');
            expect(layout.announcement).toEqual({ id: 'announce' });
            expect(layout.header).toEqual({ id: 'header' });
            expect(layout.footer).toEqual({ id: 'footer' });
            expect(layout.metadata).toEqual({ title: 'Meta Title' });
        });

        it('should handle metadata without layout configurations', () => {
            const mockPage = {
                metadata: {
                    title: 'Just Title'
                }
            };
            (getSpecs as any).mockReturnValue({ 'simple-page': mockPage });

            const layout = getLayout('simple-page');
            expect(layout.announcement).toBeUndefined();
            expect(layout.header).toBeUndefined();
            expect(layout.footer).toBeUndefined();
            expect(layout.metadata).toEqual({ title: 'Just Title' });
        });

        it('should return empty props if page not found', () => {
            (getSpecs as any).mockReturnValue({});
            expect(getLayout('missing-page')).toEqual({});
        });

        it('should extract access configuration', () => {
            const mockPage = {
                metadata: {
                    title: 'Access Title',
                    access: ['public']
                }
            };
            (getSpecs as any).mockReturnValue({ 'access-page': mockPage });

            const layout = getLayout('access-page');
            expect(layout.access).toEqual(['public']);
            expect(layout.metadata).toEqual({ title: 'Access Title' });
        });
    });
});
