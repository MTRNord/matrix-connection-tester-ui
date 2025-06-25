import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchData, fetchSupportInfo } from '../api';
import { ApiError } from '../apiTypes';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper to create a proper Response-like object
const createMockResponse = (data: unknown, options: { ok?: boolean; status?: number; headers?: Headers } = {}) => {
    const { ok = true, status = 200, headers = new Headers() } = options;
    return {
        ok,
        status,
        headers,
        json: () => Promise.resolve(data),
        text: () => Promise.resolve(JSON.stringify(data)),
        blob: () => Promise.resolve(new Blob()),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        formData: () => Promise.resolve(new FormData()),
        body: null,
        bodyUsed: false,
        redirected: false,
        type: 'basic' as ResponseType,
        url: '',
        clone: function () { return this; }
    } as Response;
};

describe('API functions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset fetch mock
        mockFetch.mockClear();
    });

    describe('fetchData', () => {
        it('throws error when server name is empty', async () => {
            await expect(fetchData('')).rejects.toThrow(ApiError);
            await expect(fetchData('')).rejects.toThrow('Server name cannot be empty');
        });

        it('throws error when API server URL is not configured', async () => {
            mockFetch.mockResolvedValueOnce(createMockResponse({ api_server_url: null }));

            // This will throw ZodError because null doesn't match z.url() schema
            await expect(fetchData('matrix.org')).rejects.toThrow();
        });

        it('successfully fetches data when all conditions are met', async () => {
            const mockConfigResponse = {
                api_server_url: 'https://api.example.com',
            };

            const mockApiResponse = {
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
                        Ed25519VerifyKeys: {},
                        Keys: {
                            server_name: "matrix.org",
                            signatures: {},
                            valid_until_ts: 1700000000000,
                            verify_keys: {}
                        },
                        Version: {
                            name: "Synapse",
                            version: "1.95.0"
                        }
                    }
                },
                DNSResult: {
                    Addrs: ["192.168.1.1"],
                    SrvTargets: {},
                    SRVSkipped: false
                },
                FederationOK: true,
                Version: { name: "Synapse", version: "1.95.0" },
                WellKnownResult: {
                    "m.server": {
                        CacheExpiresAt: 1700000000000,
                        "m.server": "matrix.org:443"
                    }
                }
            };

            // Mock config fetch
            mockFetch.mockResolvedValueOnce(createMockResponse(mockConfigResponse));

            // Mock API fetch
            mockFetch.mockResolvedValueOnce(createMockResponse(mockApiResponse));

            const result = await fetchData('matrix.org');

            expect(mockFetch).toHaveBeenCalledWith('/config.json');
            expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/api/report?server_name=matrix.org');
            expect(result).toEqual(mockApiResponse);
        });

        it('throws error when API request fails', async () => {
            // Mock config fetch (successful)
            mockFetch.mockResolvedValueOnce(createMockResponse({ api_server_url: 'https://api.example.com' }));

            // Mock API fetch (failed) - when ok is false, json() won't be called
            mockFetch.mockResolvedValueOnce(createMockResponse({}, { ok: false, status: 500 }));

            await expect(fetchData('matrix.org')).rejects.toThrow('HTTP error! status: 500');
        });
    });

    describe('fetchSupportInfo', () => {
        it('throws error when server name is empty', async () => {
            await expect(fetchSupportInfo('')).rejects.toThrow(ApiError);
            await expect(fetchSupportInfo('')).rejects.toThrow('Server name cannot be empty');
        });

        it('throws error when support endpoint returns non-200 status', async () => {
            mockFetch.mockResolvedValueOnce(createMockResponse({}, { ok: false, status: 404 }));

            await expect(fetchSupportInfo('matrix.org')).rejects.toThrow('HTTP error! status: 404');
        });

        it('throws error when content-type is not application/json', async () => {
            const headers = new Headers({ 'content-type': 'text/html' });
            mockFetch.mockResolvedValueOnce(createMockResponse({}, { headers }));

            await expect(fetchSupportInfo('matrix.org')).rejects.toThrow('Expected JSON response from support endpoint');
        });

        it('throws error when JSON parsing fails', async () => {
            const headers = new Headers({ 'content-type': 'application/json' });
            const mockResponse = createMockResponse({}, { headers });
            // Override json method to simulate parsing error
            mockResponse.json = () => Promise.reject(new Error('Invalid JSON'));
            mockFetch.mockResolvedValueOnce(mockResponse);

            await expect(fetchSupportInfo('matrix.org')).rejects.toThrow('The json replied is either missing or not complete');
        });

        it('successfully fetches support info when all conditions are met', async () => {
            const mockSupportResponse = {
                contacts: [
                    {
                        matrix_id: '@admin:matrix.org',
                        email_address: 'admin@matrix.org',
                        role: 'admin',
                    },
                ],
            };

            const headers = new Headers({ 'content-type': 'application/json' });
            mockFetch.mockResolvedValueOnce(createMockResponse(mockSupportResponse, { headers }));

            const result = await fetchSupportInfo('matrix.org');

            expect(mockFetch).toHaveBeenCalledWith('https://matrix.org/.well-known/matrix/support');
            expect(result).toEqual(mockSupportResponse);
        });

        it('calls the correct URL for server with port', async () => {
            const mockSupportResponse = { contacts: [] };

            const headers = new Headers({ 'content-type': 'application/json' });
            mockFetch.mockResolvedValueOnce(createMockResponse(mockSupportResponse, { headers }));

            await fetchSupportInfo('example.com:8008');

            expect(mockFetch).toHaveBeenCalledWith('https://example.com:8008/.well-known/matrix/support');
        });
    });
});
