import { defineConfig, devices } from '@playwright/test';
import * as os from 'os';
import * as fs from 'fs';

// Check if WebKit is supported on this system
function isWebKitSupported(): boolean {
    // Skip WebKit on Linux if it's not Ubuntu (due to dependency issues)
    if (os.platform() === 'linux') {
        try {
            // Check if we're on Ubuntu by looking for lsb-release
            if (fs.existsSync('/etc/lsb-release')) {
                const lsbRelease = fs.readFileSync('/etc/lsb-release', 'utf8');
                return lsbRelease.includes('Ubuntu');
            }
            // If not Ubuntu, skip WebKit
            return false;
        } catch {
            return false;
        }
    }
    // WebKit should work on macOS and Windows
    return true;
}

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
    testDir: './e2e',
    /* Run tests in files in parallel */
    fullyParallel: true,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,
    /* Opt out of parallel tests on CI. */
    workers: process.env.CI ? 1 : undefined,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: 'html',
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Base URL to use in actions like `await page.goto('/')`. */
        baseURL: 'http://localhost:4173',

        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'on-first-retry',
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },

        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        },

        // Only include WebKit if supported on this system
        ...(isWebKitSupported() ? [{
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
        }] : []),

        /* Test against mobile viewports. */
        // {
        //   name: 'Mobile Chrome',
        //   use: { ...devices['Pixel 5'] },
        // },
        // {
        //   name: 'Mobile Safari',
        //   use: { ...devices['iPhone 12'] },
        // },

        /* Test against branded browsers. */
        // {
        //   name: 'Microsoft Edge',
        //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
        // },
        // {
        //   name: 'Google Chrome',
        //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
        // },
    ],

    /* Run your local dev server before starting the tests */
    webServer: {
        command: 'pnpm preview',
        url: 'http://localhost:4173',
        reuseExistingServer: !process.env.CI,
    },
});
