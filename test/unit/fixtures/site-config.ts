/**
 * Fixture: site-config
 *
 * This file mocks the 'site:config' virtual module for unit testing.
 * It provides default/empty values for the configuration objects
 * exported by the real module.
 */

export const SITE = {
    name: 'Test Site',
    contentDir: '/tmp/content',
    site: 'https://example.com',
    base: '/',
    trailingSlash: false,
};

export const I18N = {
    language: 'en',
    textDirection: 'ltr',
    dateFormatter: new Intl.DateTimeFormat('en'),
};

export const METADATA = {
    title: {
        default: 'Test Site',
        template: '%s | Test Site',
    },
    description: 'Test Description',
    robots: {
        index: false,
        follow: false,
    },
    openGraph: {
        type: 'website',
    },
};

export const UI = {
    theme: 'default',
};

export const ANALYTICS = {
    vendors: {
        googleAnalytics: {
            id: undefined,
            partytown: true,
        },
    },
};
