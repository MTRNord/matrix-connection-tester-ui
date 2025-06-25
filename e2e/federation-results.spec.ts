import { test, expect } from '@playwright/test';

test.describe('Federation Results', () => {
    test.beforeEach(async ({ page }) => {
        // Mock config response
        await page.route('**/config.json', async (route) => {
            await route.fulfill({
                json: { api_server_url: 'https://api.example.com' },
                headers: { 'Content-Type': 'application/json' }
            });
        });
    });

    test('displays federation overview with working status', async ({ page }) => {
        // Mock successful API response with working federation
        await page.route('**/api/report**', async (route) => {
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
                                ServerVersionParses: true
                            },
                            Cipher: {
                                CipherSuite: "TLS_AES_256_GCM_SHA384",
                                Version: "TLSv1.3"
                            },
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
                                    "ed25519:auto": {
                                        key: "Noi6WqcDj0QmPxCNQqgezwTlBKrfqehY1u2FyWP9uYw"
                                    }
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
                },
                headers: { 'Content-Type': 'application/json' }
            });
        });

        await page.goto('/');

        const serverInput = page.getByRole('textbox', { name: /server name/i });
        const submitButton = page.getByRole('button', { name: /go/i });

        await serverInput.fill('matrix.org');
        await submitButton.click();

        // Wait for results and check overview tab content
        await expect(page.getByText(/federation is working\./i)).toBeVisible();

        // Check for server software info
        await expect(page.getByRole('link', { name: 'Synapse' })).toBeVisible();

        // Check for DNS addresses in the overview tab
        await expect(page.getByLabel('Overview').getByText('192.168.1.1')).toBeVisible();
    });

    test('displays federation overview with failed status', async ({ page }) => {
        // Mock API response with failed federation
        await page.route('**/api/report**', async (route) => {
            await route.fulfill({
                json: {
                    ConnectionReports: {},
                    DNSResult: {
                        Addrs: [],
                        SRVSkipped: false
                    },
                    FederationOK: false,
                    Version: {
                        name: "Unknown",
                        version: "0.0.0"
                    },
                    WellKnownResult: {}
                },
                headers: { 'Content-Type': 'application/json' }
            });
        });

        await page.goto('/');

        const serverInput = page.getByRole('textbox', { name: /server name/i });
        const submitButton = page.getByRole('button', { name: /go/i });

        await serverInput.fill('broken.example.com');
        await submitButton.click();

        // Wait for results and check for failure status
        await expect(page.getByText(/federation failed\./i)).toBeVisible();
    });

    test('displays DNS resolution tab with SRV records', async ({ page }) => {
        // Mock API response with SRV records
        await page.route('**/api/report**', async (route) => {
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
                                ServerVersionParses: true
                            },
                            Cipher: { CipherSuite: "TLS_AES_256_GCM_SHA384", Version: "TLSv1.3" },
                            Ed25519VerifyKeys: { "ed25519:auto": "Noi6WqcDj0QmPxCNQqgezwTlBKrfqehY1u2FyWP9uYw" },
                            Keys: {
                                server_name: "matrix.org",
                                signatures: { "matrix.org": { "ed25519:auto": "signature_here" } },
                                valid_until_ts: 1640995200000,
                                verify_keys: { "ed25519:auto": { key: "Noi6WqcDj0QmPxCNQqgezwTlBKrfqehY1u2FyWP9uYw" } }
                            },
                            Version: { name: "Synapse", version: "1.70.0" }
                        }
                    },
                    DNSResult: {
                        Addrs: ["192.168.1.1"],
                        SrvTargets: {
                            "matrix.org:8448": [{
                                Target: "matrix.org",
                                Port: 8448,
                                Priority: 10,
                                Weight: 5,
                                Addrs: ["192.168.1.1"]
                            }]
                        },
                        SRVSkipped: false
                    },
                    FederationOK: true,
                    Version: { name: "Synapse", version: "1.70.0" },
                    WellKnownResult: {
                        "matrix.org": {
                            CacheExpiresAt: 1640995200000,
                            "m.server": "matrix.org:443"
                        }
                    }
                },
                headers: { 'Content-Type': 'application/json' }
            });
        });

        await page.goto('/');

        const serverInput = page.getByRole('textbox', { name: /server name/i });
        const submitButton = page.getByRole('button', { name: /go/i });

        await serverInput.fill('matrix.org');
        await submitButton.click();

        // Click on DNS tab
        const dnsTab = page.locator('a').filter({ hasText: /^DNS Resolution$/ });
        await dnsTab.click();

        // Check for DNS information in the DNS Resolution tab
        await expect(page.getByRole('row', { name: '192.168.1.1', exact: true })).toBeVisible();

        // Check for SRV record information
        await expect(page.getByLabel('DNS Resolution').getByText('matrix.org')).toBeVisible();
        await expect(page.getByLabel('DNS Resolution').getByText('8448')).toBeVisible();
        await expect(page.getByLabel('DNS Resolution').getByText('10')).toBeVisible(); // priority
        await expect(page.getByLabel('DNS Resolution').getByText('5')).toBeVisible();  // weight
    });

    test('displays well-known tab with server information', async ({ page }) => {
        // Mock API response with well-known data
        await page.route('**/api/report**', async (route) => {
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
                                ServerVersionParses: true
                            },
                            Cipher: { CipherSuite: "TLS_AES_256_GCM_SHA384", Version: "TLSv1.3" },
                            Ed25519VerifyKeys: { "ed25519:auto": "Noi6WqcDj0QmPxCNQqgezwTlBKrfqehY1u2FyWP9uYw" },
                            Keys: {
                                server_name: "matrix.org",
                                signatures: { "matrix.org": { "ed25519:auto": "signature_here" } },
                                valid_until_ts: 1640995200000,
                                verify_keys: { "ed25519:auto": { key: "Noi6WqcDj0QmPxCNQqgezwTlBKrfqehY1u2FyWP9uYw" } }
                            },
                            Version: { name: "Synapse", version: "1.70.0" }
                        }
                    },
                    DNSResult: {
                        Addrs: ["192.168.1.1"],
                        SRVSkipped: false
                    },
                    FederationOK: true,
                    Version: { name: "Synapse", version: "1.70.0" },
                    WellKnownResult: {
                        "matrix.org": {
                            CacheExpiresAt: 1640995200000,
                            "m.server": "matrix.org:443"
                        }
                    }
                },
                headers: { 'Content-Type': 'application/json' }
            });
        });

        await page.goto('/');

        const serverInput = page.getByRole('textbox', { name: /server name/i });
        const submitButton = page.getByRole('button', { name: /go/i });

        await serverInput.fill('matrix.org');
        await submitButton.click();

        // Click on Well-Known tab
        const wellKnownTab = page.locator('a').filter({ hasText: /^Well-Known$/ });
        await wellKnownTab.click();

        // Check for well-known information
        await expect(page.getByLabel('Well-Known').getByText('matrix.org:443')).toBeVisible();
    });

    test('displays connection reports with certificate information', async ({ page }) => {
        // Mock API response with detailed reports
        await page.route('**/api/report**', async (route) => {
            await route.fulfill({
                json: {
                    ConnectionReports: {
                        "matrix.org:443": {
                            Certificates: [{
                                DNSNames: ["matrix.org", "*.matrix.org"],
                                IssuerCommonName: "Let's Encrypt Authority X3",
                                SHA256Fingerprint: "ab:cd:ef:12:34:56:78:90:ab:cd:ef:12:34:56:78:90:ab:cd:ef:12:34:56:78:90:ab:cd:ef:12:34:56:78:90",
                                SubjectCommonName: "matrix.org"
                            }],
                            Checks: {
                                AllChecksOK: true,
                                AllEd25519ChecksOK: true,
                                Ed25519Checks: {},
                                FutureValidUntilTS: true,
                                HasEd25519Key: true,
                                MatchingServerName: true,
                                ValidCertificates: true,
                                ServerVersionParses: true
                            },
                            Cipher: { CipherSuite: "TLS_AES_256_GCM_SHA384", Version: "TLSv1.3" },
                            Ed25519VerifyKeys: { "ed25519:auto": "Noi6WqcDj0QmPxCNQqgezwTlBKrfqehY1u2FyWP9uYw" },
                            Keys: {
                                server_name: "matrix.org",
                                signatures: { "matrix.org": { "ed25519:auto": "signature_here" } },
                                valid_until_ts: 1640995200000,
                                verify_keys: { "ed25519:auto": { key: "Noi6WqcDj0QmPxCNQqgezwTlBKrfqehY1u2FyWP9uYw" } }
                            },
                            Version: { name: "Synapse", version: "1.70.0" }
                        }
                    },
                    DNSResult: {
                        Addrs: ["192.168.1.1"],
                        SRVSkipped: false
                    },
                    FederationOK: true,
                    Version: { name: "Synapse", version: "1.70.0" },
                    WellKnownResult: {
                        "matrix.org": {
                            CacheExpiresAt: 1640995200000,
                            "m.server": "matrix.org:443"
                        }
                    }
                },
                headers: { 'Content-Type': 'application/json' }
            });
        });

        await page.goto('/');

        const serverInput = page.getByRole('textbox', { name: /server name/i });
        const submitButton = page.getByRole('button', { name: /go/i });

        await serverInput.fill('matrix.org');
        await submitButton.click();        // Click on Reports tab
        const reportsTab = page.locator('a').filter({ hasText: /^Connection Reports$/ });
        await reportsTab.click();

        // Wait for tab to be active
        await page.waitForTimeout(500);

        const reportsPanel = page.locator('section#reports[role="tabpanel"]');

        // Check for report information
        await expect(page.getByText(/all checks ok/i)).toBeVisible();

        // Click to expand the raw report details to see the version info
        await reportsPanel.getByText(/show raw report/i).click();

        // Now verify the version information is present in the raw JSON section
        await expect(reportsPanel.getByText('"name": "Synapse"')).toBeVisible();
        await expect(reportsPanel.getByText('"version": "1.70.0"')).toBeVisible();

        // Check for certificate information in the table (not the raw JSON)
        await expect(reportsPanel.getByRole('cell', { name: 'Let\'s Encrypt Authority X3' })).toBeVisible();
        await expect(reportsPanel.getByRole('cell', { name: 'matrix.org', exact: true })).toBeVisible();

        // Check for key information in the table
        await expect(reportsPanel.getByRole('cell', { name: 'ed25519:auto' })).toBeVisible();
    });

    test('displays connection errors when they exist', async ({ page }) => {
        // Mock API response with connection errors
        await page.route('**/api/report**', async (route) => {
            await route.fulfill({
                json: {
                    ConnectionReports: {},
                    ConnectionErrors: {
                        "broken.example.com:443": {
                            Error: "Connection refused"
                        },
                        "192.168.1.1:8448": {
                            Error: "SSL handshake failed"
                        }
                    },
                    DNSResult: {
                        Addrs: [],
                        SRVSkipped: false
                    },
                    FederationOK: false,
                    Version: { name: "Unknown", version: "0.0.0" },
                    WellKnownResult: {}
                },
                headers: { 'Content-Type': 'application/json' }
            });
        });

        await page.goto('/');

        const serverInput = page.getByRole('textbox', { name: /server name/i });
        const submitButton = page.getByRole('button', { name: /go/i });

        await serverInput.fill('broken.example.com');
        await submitButton.click();

        // Click on Connection Errors tab
        const errorsTab = page.locator('a').filter({ hasText: /^Connection Errors$/ });
        await errorsTab.click();

        // Check for error information
        await expect(page.getByLabel('Connection Errors').getByText('Connection refused')).toBeVisible();
        await expect(page.getByLabel('Connection Errors').getByText('SSL handshake failed')).toBeVisible();
        await expect(page.getByLabel('Connection Errors').getByText('broken.example.com')).toBeVisible();
        await expect(page.getByLabel('Connection Errors').getByText('192.168.1.1')).toBeVisible();
    });

    test('displays raw API response tab', async ({ page }) => {
        const apiResponse = {
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
                        ServerVersionParses: true
                    },
                    Cipher: { CipherSuite: "TLS_AES_256_GCM_SHA384", Version: "TLSv1.3" },
                    Ed25519VerifyKeys: { "ed25519:auto": "Noi6WqcDj0QmPxCNQqgezwTlBKrfqehY1u2FyWP9uYw" },
                    Keys: {
                        server_name: "matrix.org",
                        signatures: { "matrix.org": { "ed25519:auto": "signature_here" } },
                        valid_until_ts: 1640995200000,
                        verify_keys: { "ed25519:auto": { key: "Noi6WqcDj0QmPxCNQqgezwTlBKrfqehY1u2FyWP9uYw" } }
                    },
                    Version: { name: "Synapse", version: "1.70.0" }
                }
            },
            DNSResult: {
                Addrs: ["192.168.1.1"],
                SRVSkipped: false
            },
            FederationOK: true,
            Version: { name: "Synapse", version: "1.70.0" },
            WellKnownResult: {
                "matrix.org": {
                    CacheExpiresAt: 1640995200000,
                    "m.server": "matrix.org:443"
                }
            }
        };

        await page.route('**/api/report**', async (route) => {
            await route.fulfill({
                json: apiResponse,
                headers: { 'Content-Type': 'application/json' }
            });
        });

        await page.goto('/');

        const serverInput = page.getByRole('textbox', { name: /server name/i });
        const submitButton = page.getByRole('button', { name: /go/i });

        await serverInput.fill('matrix.org');
        await submitButton.click();

        // Click on Raw API tab
        const rawTab = page.locator('a').filter({ hasText: /^Raw API$/ });
        await rawTab.click();

        // Check for raw JSON display
        await expect(page.getByLabel('Raw API').getByText(/"FederationOK": true/)).toBeVisible();
    });
});
