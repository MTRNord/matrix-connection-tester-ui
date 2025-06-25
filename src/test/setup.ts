import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock global variables
Object.defineProperty(globalThis, '__APP_VERSION__', {
    value: 'test-version',
    writable: true,
});

// Mock i18next with more realistic translations
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => {
            // Return more realistic translations for key elements
            const translations: Record<string, string> = {
                'app.title': 'Matrix Connection Tester',
                'app.description': 'Test your Matrix server connection',
                'app.form.serverName': 'Server Name',
                'app.form.ariaLabel': 'Matrix server name',
                'app.form.placeholder': 'example.com',
                'app.form.title': 'Server name format',
                'app.form.goButton': 'Test Connection',
                'federation.title': 'Federation Results',
                'federation.overview.status.working': 'Working',
                'federation.overview.status.failed': 'Failed',
                'federation.overview.maturity.Stable': 'Stable',
                'federation.tabs.overview': 'Overview',
                'federation.tabs.dns': 'DNS',
                'federation.tabs.wellKnown': 'Well-Known',
                'federation.tabs.reports': 'Reports',
                'federation.tabs.raw': 'Raw',
                'common.unknown': 'Unknown',
                'loading': 'Loading...',
                'error': 'Error',
            };
            return translations[key] || key;
        },
        i18n: {
            changeLanguage: vi.fn(),
        },
    }),
    Trans: ({ children }: { children: React.ReactNode }) => children,
    initReactI18next: {
        type: '3rdParty',
        init: vi.fn(),
    },
}));

// Mock SWR
vi.mock('swr', () => ({
    default: vi.fn(),
    mutate: vi.fn(),
}));

// Setup fetch mock
global.fetch = vi.fn();

// Mock window.location
Object.defineProperty(window, 'location', {
    value: {
        search: '',
        pathname: '/',
        hash: '',
        href: 'http://localhost/',
    },
    writable: true,
});

// Mock window.history
Object.defineProperty(window, 'history', {
    value: {
        replaceState: vi.fn(),
        pushState: vi.fn(),
    },
    writable: true,
});
