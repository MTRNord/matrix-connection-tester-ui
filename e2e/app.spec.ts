import { test, expect } from '@playwright/test';

test.describe('Matrix Connection Tester', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the application
        await page.goto('/');
    });

    test('has correct title', async ({ page }) => {
        await expect(page).toHaveTitle(/Matrix Connection Tester/);
    });

    test('displays main heading and form', async ({ page }) => {
        // Check for main heading
        const heading = page.getByRole('heading', { level: 1 });
        await expect(heading).toBeVisible();

        // Check for form elements
        const serverInput = page.getByRole('textbox', { name: /server name/i });
        const submitButton = page.getByRole('button', { name: /go/i });

        await expect(serverInput).toBeVisible();
        await expect(submitButton).toBeVisible();
    });

    test('shows placeholder text in server input', async ({ page }) => {
        const serverInput = page.getByRole('textbox', { name: /server name/i });
        await expect(serverInput).toHaveAttribute('placeholder', 'example.com');
    });

    test('validates server name input pattern', async ({ page }) => {
        const serverInput = page.getByRole('textbox', { name: /server name/i });

        // Check that the input has the correct pattern attribute (note escaped hyphen)
        await expect(serverInput).toHaveAttribute('pattern', '^[a-zA-Z0-9.\\-]+(:[0-9]+)?$');
        await expect(serverInput).toHaveAttribute('required');
    });

    test('can type in server name input', async ({ page }) => {
        const serverInput = page.getByRole('textbox', { name: /server name/i });

        await serverInput.fill('matrix.org');
        await expect(serverInput).toHaveValue('matrix.org');
    });

    test('form submission requires non-empty server name', async ({ page }) => {
        const submitButton = page.getByRole('button', { name: /go/i });

        // Try to submit empty form
        await submitButton.click();

        // Check that HTML5 validation prevents submission
        const serverInput = page.getByRole('textbox', { name: /server name/i });
        await expect(serverInput).toHaveJSProperty('validity.valueMissing', true);
    });

    test('accepts valid server names', async ({ page }) => {
        const serverInput = page.getByRole('textbox', { name: /server name/i });

        const validServerNames = [
            'matrix.org',
            'example.com',
            'server.example.org',
            'localhost:8008',
            'sub-domain.example.com',
            '192.168.1.1:8008'
        ];

        for (const serverName of validServerNames) {
            await serverInput.fill(serverName);
            // Check that the input accepts the value (no validation error)
            await expect(serverInput).toHaveJSProperty('validity.valid', true);
            await serverInput.clear();
        }
    });

    test('rejects invalid server names', async ({ page }) => {
        const serverInput = page.getByRole('textbox', { name: /server name/i });

        const invalidServerNames = [
            'invalid_server',  // underscores not allowed
            'server with spaces',  // spaces not allowed
            'server@domain.com',  // @ symbol not allowed
            'https://example.com',  // protocol not allowed
            'server:',  // missing port number
            'server:abc',  // non-numeric port
        ];

        for (const serverName of invalidServerNames) {
            await serverInput.fill(serverName);
            // Check that the input shows validation error
            await expect(serverInput).toHaveJSProperty('validity.valid', false);
            await serverInput.clear();
        }
    });

    test('updates URL when server name is submitted', async ({ page }) => {
        const serverInput = page.getByRole('textbox', { name: /server name/i });
        const submitButton = page.getByRole('button', { name: /go/i });

        await serverInput.fill('matrix.org');
        await submitButton.click();

        // Check that URL contains the server name parameter
        await expect(page).toHaveURL(/serverName=matrix\.org/);
    });

    test('reads server name from URL on page load', async ({ page }) => {
        // Navigate with server name in URL
        await page.goto('/?serverName=example.com');

        const serverInput = page.getByRole('textbox', { name: /server name/i });
        await expect(serverInput).toHaveValue('example.com');
    });

    test('displays loading state when API is called', async ({ page }) => {
        // Mock a slow API response using a promise that we control
        await page.route('**/config.json', async (route) => {
            await route.fulfill({
                json: { api_server_url: 'https://api.example.com' },
                headers: { 'Content-Type': 'application/json' }
            });
        });

        // Track if we've checked the loading state
        let loadingStateChecked = false;

        await page.route('https://api.example.com/api/report**', async (route) => {
            // Give the UI time to show loading state, but only check once
            if (!loadingStateChecked) {
                await new Promise(resolve => setTimeout(resolve, 200));
                loadingStateChecked = true;
            }

            await route.fulfill({
                json: {
                    ConnectionReports: {
                        "matrix.org:443": {
                            Certificates: [],
                            Checks: {
                                AllChecksOK: true,
                                AllEd25519ChecksOK: true,
                                Ed25519Checks: {},
                                FutureValidUntilTS: true,
                                HasEd25519Key: true,
                                MatchingServerName: true,
                                ValidCertificates: true,
                                ServerVersionParses: true,
                            },
                            Cipher: { CipherSuite: "TLS_AES_256_GCM_SHA384", Version: "TLSv1.3" },
                            Ed25519VerifyKeys: {
                                "ed25519:auto": "Noi6WqcDj0QmPxCNQqgezwTlBKrfqehY1u2FyWP9uYw"
                            },
                            Keys: {
                                server_name: "matrix.org",
                                signatures: { "matrix.org": { "ed25519:auto": "signature_here" } },
                                valid_until_ts: 1640995200000,
                                verify_keys: { "ed25519:auto": { key: "Noi6WqcDj0QmPxCNQqgezwTlBKrfqehY1u2FyWP9uYw" } }
                            },
                            Version: { name: "Synapse", version: "1.70.0" }
                        }
                    },
                    DNSResult: { Addrs: ["192.168.1.1"], SRVSkipped: false },
                    FederationOK: true,
                    Version: { name: "Synapse", version: "1.70.0" },
                    WellKnownResult: { "matrix.org": { CacheExpiresAt: 1640995200000, "m.server": "matrix.org:443" } }
                },
                headers: { 'Content-Type': 'application/json' }
            });
        });

        const serverInput = page.getByRole('textbox', { name: /server name/i });
        const submitButton = page.getByRole('button', { name: /go/i });

        await serverInput.fill('matrix.org');
        await submitButton.click();

        // Look for loading indicator - check quickly before the delayed response
        const loadingText = page.getByText(/getting info from api/i);
        await expect(loadingText).toBeVisible({ timeout: 1000 });
    });

    test('handles API errors gracefully', async ({ page }) => {
        // Mock config response
        await page.route('**/config.json', async (route) => {
            await route.fulfill({
                json: { api_server_url: 'https://api.example.com' },
                headers: { 'Content-Type': 'application/json' }
            });
        });

        // Mock API error response
        await page.route('**/api/report**', async (route) => {
            await route.fulfill({
                status: 500,
                body: 'Internal Server Error'
            });
        });

        const serverInput = page.getByRole('textbox', { name: /server name/i });
        const submitButton = page.getByRole('button', { name: /go/i });

        await serverInput.fill('matrix.org');
        await submitButton.click();

        // Look for error message
        const errorText = page.getByText(/something went wrong talking to the api/i);
        await expect(errorText).toBeVisible();
    });

    test('can navigate between tabs when results are shown', async ({ page }) => {
        // Mock successful API responses
        await page.route('**/config.json', async (route) => {
            await route.fulfill({
                json: { api_server_url: 'https://api.example.com' },
                headers: { 'Content-Type': 'application/json' }
            });
        });

        await page.route('https://api.example.com/api/report**', async (route) => {
            await route.fulfill({
                json: {
                    ConnectionReports: {
                        "matrix.org:443": {
                            Certificates: [],
                            Checks: {
                                AllChecksOK: true,
                                AllEd25519ChecksOK: true,
                                Ed25519Checks: {},
                                FutureValidUntilTS: true,
                                HasEd25519Key: true,
                                MatchingServerName: true,
                                ValidCertificates: true,
                                ServerVersionParses: true,
                            },
                            Cipher: { CipherSuite: "TLS_AES_256_GCM_SHA384", Version: "TLSv1.3" },
                            Ed25519VerifyKeys: {
                                "ed25519:auto": "Noi6WqcDj0QmPxCNQqgezwTlBKrfqehY1u2FyWP9uYw"
                            },
                            Keys: {
                                server_name: "matrix.org",
                                signatures: { "matrix.org": { "ed25519:auto": "signature_here" } },
                                valid_until_ts: 1640995200000,
                                verify_keys: { "ed25519:auto": { key: "Noi6WqcDj0QmPxCNQqgezwTlBKrfqehY1u2FyWP9uYw" } }
                            },
                            Version: { name: "Synapse", version: "1.70.0" }
                        }
                    },
                    DNSResult: { Addrs: ["192.168.1.1"], SRVSkipped: false },
                    FederationOK: true,
                    Version: { name: "Synapse", version: "1.70.0" },
                    WellKnownResult: { "matrix.org": { CacheExpiresAt: 1640995200000, "m.server": "matrix.org:443" } }
                },
                headers: { 'Content-Type': 'application/json' }
            });
        });

        await page.route('https://matrix.org/.well-known/matrix/support', async (route) => {
            await route.fulfill({
                json: {
                    contacts: [
                        { matrix_id: '@admin:matrix.org', email_address: 'admin@matrix.org', role: 'admin' }
                    ]
                }
            });
        });

        const serverInput = page.getByRole('textbox', { name: /server name/i });
        const submitButton = page.getByRole('button', { name: /go/i });

        await serverInput.fill('matrix.org');
        await submitButton.click();

        // Wait for results to load and check for tab navigation
        await page.waitForSelector('[data-testid="federation-results"]', { timeout: 10000 });

        // Find tabs by their text content since govuk-react may not use proper ARIA roles
        const overviewTab = page.locator('a').filter({ hasText: /^Overview$/ });
        const dnsTab = page.locator('a').filter({ hasText: /^DNS Resolution$/ });

        await expect(overviewTab).toBeVisible();
        await expect(dnsTab).toBeVisible();

        // Test tab switching
        await dnsTab.click();

        // Verify that clicking the tab changes the content
        await expect(page.getByRole('heading', { name: 'Direct IP Addresses' })).toBeVisible();

        // Switch back to overview
        await overviewTab.click();
        await expect(page.getByText(/federation is working\./i)).toBeVisible();
    });
});
