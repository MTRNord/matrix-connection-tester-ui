import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
    test('homepage should not have any automatically detectable accessibility issues', async ({ page }) => {
        await page.goto('/');

        const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('form with empty input should remain accessible', async ({ page }) => {
        await page.goto('/');

        // Try to submit empty form
        const button = page.getByRole('button', { name: /go/i });
        await button.click();

        const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('form with valid input should remain accessible', async ({ page }) => {
        await page.goto('/');

        // Fill in a valid server name
        const input = page.getByRole('textbox', { name: /server name/i });
        await input.fill('matrix.org');

        const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('results page should be accessible', async ({ page }) => {
        // Mock API responses
        await page.route('**/config.json', async (route) => {
            await route.fulfill({
                json: { api_server_url: 'https://api.example.com' }
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
                                signatures: {
                                    "matrix.org": {
                                        "ed25519:auto": "signature_here"
                                    }
                                },
                                valid_until_ts: 1640995200000,
                                verify_keys: {
                                    "ed25519:auto": { key: "Noi6WqcDj0QmPxCNQqgezwTlBKrfqehY1u2FyWP9uYw" }
                                }
                            },
                            Version: {
                                name: "Synapse",
                                version: "1.70.0"
                            }
                        }
                    },
                    DNSResult: {
                        Addrs: ["192.168.1.1"],
                        SRVSkipped: false
                    },
                    FederationOK: true,
                    Version: {
                        name: "Synapse",
                        version: "1.70.0"
                    },
                    WellKnownResult: {
                        "matrix.org": {
                            CacheExpiresAt: 1640995200000,
                            "m.server": "matrix.org:443"
                        }
                    }
                }
            });
        });

        await page.route('https://matrix.org/.well-known/matrix/support', async (route) => {
            await route.fulfill({
                json: {
                    contacts: [
                        {
                            matrix_id: '@admin:matrix.org',
                            email_address: 'admin@matrix.org',
                            role: 'admin'
                        }
                    ]
                }
            });
        });

        await page.goto('/');

        // Submit form to show results
        const input = page.getByRole('textbox', { name: /server name/i });
        const button = page.getByRole('button', { name: /go/i });

        await input.fill('matrix.org');
        await button.click();

        // Wait for results to load with better error handling
        try {
            await page.waitForSelector('[data-testid="federation-results"]', { timeout: 10000 });
        } catch (error) {
            // Take a screenshot for debugging
            await page.screenshot({ path: 'debug-federation-results.png' });
            console.log('Page content:', await page.content());
            throw error;
        }

        const accessibilityScanResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
            // Exclude govuk-react Tabs accessibility violations (known issue with library)
            .disableRules(['aria-required-children', 'aria-required-parent', 'listitem'])
            .analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('error states should be accessible', async ({ page }) => {
        // Mock API to return errors
        await page.route('**/config.json', async (route) => {
            await route.fulfill({
                json: { api_server_url: 'https://api.example.com' }
            });
        });

        await page.route('**/api/report**', async (route) => {
            await route.fulfill({
                status: 500,
                body: 'Internal Server Error'
            });
        });

        await page.goto('/');

        const input = page.getByRole('textbox', { name: /server name/i });
        const button = page.getByRole('button', { name: /go/i });

        await input.fill('broken.example.com');
        await button.click();

        // Wait a bit for error state
        await page.waitForTimeout(1000);

        const accessibilityScanResults = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa'])
            // Exclude govuk-react Tabs accessibility violations (known issue with library)
            .disableRules(['aria-required-children', 'aria-required-parent', 'listitem'])
            .analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('keyboard navigation should work properly', async ({ page }) => {
        await page.goto('/');

        // Get references to the elements
        const input = page.getByRole('textbox', { name: /server name/i });
        const button = page.getByRole('button', { name: /go/i });

        // Click on the input to focus it (alternative approach)
        await input.focus();
        await expect(input).toBeFocused();

        // Type in the input
        await page.keyboard.type('matrix.org');

        // Tab to button
        await page.keyboard.press('Tab');
        await expect(button).toBeFocused();

        // Check accessibility after keyboard navigation
        const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
        expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('color contrast and visual accessibility', async ({ page }) => {
        await page.goto('/');

        // Test with specific color contrast rules
        const accessibilityScanResults = await new AxeBuilder({ page })
            .withTags(['wcag2aa'])
            .include('body')
            .analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('screen reader compatibility', async ({ page }) => {
        await page.goto('/');

        // Check for proper ARIA labels and semantic HTML
        const accessibilityScanResults = await new AxeBuilder({ page })
            .withRules(['aria-valid-attr', 'aria-required-children', 'label', 'button-name'])
            .analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
    });
});
