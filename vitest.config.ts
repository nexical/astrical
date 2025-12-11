
/// <reference types="vitest" />
import { getViteConfig } from 'astro/config';
import path from 'path';

export default getViteConfig({
    // @ts-expect-error - 'test' is not in UserConfig type but supported by Vitest
    test: {
        environment: 'jsdom',
        globals: true,
        coverage: {
            reporter: ['text', 'json', 'html'],
            include: ['src/**/*.ts', 'plugins/**/*.ts'],
            exclude: ['src/**/*.d.ts', 'test/**', 'src/types/**'],
        },
        alias: {
            'lite-youtube-embed/src/lite-yt-embed.css': path.resolve(process.cwd(), 'test/empty.ts'),
            'site:config': path.resolve(process.cwd(), 'test/unit/fixtures/site-config.ts'),
            '~/': path.resolve(process.cwd(), 'src/'),
            '@modules/': path.resolve(process.cwd(), 'modules/'),
            '@plugins/': path.resolve(process.cwd(), 'plugins/')
        }
    },
});
