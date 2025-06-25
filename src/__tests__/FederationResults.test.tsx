import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FederationResults from '../FederationResults';
import useSWR from 'swr';

// Mock SWR
vi.mock('swr');
const mockUseSWR = vi.mocked(useSWR);

// Mock the fetchData function
vi.mock('../api', () => ({
    fetchData: vi.fn(),
}));

describe('FederationResults', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows loading state when data is being fetched', () => {
        mockUseSWR.mockReturnValue({
            data: undefined,
            error: undefined,
            isLoading: true,
            isValidating: false,
            mutate: vi.fn(),
        });

        render(<FederationResults serverName="matrix.org" />);

        expect(screen.getByText('federation.loading')).toBeInTheDocument();
    });

    it('shows error state when API call fails', () => {
        const mockError = new Error('API Error');
        mockUseSWR.mockReturnValue({
            data: undefined,
            error: mockError,
            isLoading: false,
            isValidating: false,
            mutate: vi.fn(),
        });

        render(<FederationResults serverName="matrix.org" />);

        expect(screen.getByText('federation.apiError')).toBeInTheDocument();
        expect(screen.getByText('API Error')).toBeInTheDocument();
    });

    it('renders overview tab with successful federation data', async () => {
        const mockData = {
            FederationOK: true,
            DNSResult: {
                Addrs: ['192.168.1.1'],
                SrvTargets: {},
                SRVSkipped: false,
            },
            ConnectionReports: {
                'matrix.org:443': {
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
                    Cipher: { CipherSuite: 'TLS_AES_256_GCM_SHA384', Version: 'TLSv1.3' },
                    Ed25519VerifyKeys: {},
                    Keys: {
                        server_name: 'matrix.org',
                        signatures: {},
                        valid_until_ts: 1700000000000,
                        verify_keys: {}
                    },
                    Version: {
                        name: 'Synapse',
                        version: '1.95.0'
                    }
                }
            },
            Version: { name: 'Synapse', version: '1.95.0' },
            WellKnownResult: {
                'm.server': {
                    CacheExpiresAt: 1700000000000,
                    'm.server': 'matrix.org:443'
                }
            }
        };

        mockUseSWR.mockReturnValue({
            data: mockData,
            error: undefined,
            isLoading: false,
            isValidating: false,
            mutate: vi.fn(),
        });

        render(<FederationResults serverName="matrix.org" />);

        // Should show the federation title
        expect(screen.getByText('Federation Results')).toBeInTheDocument();

        // Should show working status
        await waitFor(() => {
            expect(screen.getByText('Working')).toBeInTheDocument();
        });

        // Should show server software - now appears in 5 places due to server version display in Connection Reports
        expect(screen.getAllByText(/synapse/i)).toHaveLength(5);

        // Should show DNS addresses
        expect(screen.getAllByText('192.168.1.1')).toHaveLength(2); // appears in overview and DNS tab
    });

    it('renders overview tab with failed federation data', async () => {
        const mockData = {
            FederationOK: false,
            DNSResult: {
                Addrs: [],
                SrvTargets: {},
                SRVSkipped: false,
            },
            ConnectionReports: {},
            ConnectionErrors: {
                'broken.example.com:443': {
                    Error: 'Connection timeout'
                }
            },
            Version: { name: 'Unknown', version: '0.0.0' },
            WellKnownResult: {}
        };

        mockUseSWR.mockReturnValue({
            data: mockData,
            error: undefined,
            isLoading: false,
            isValidating: false,
            mutate: vi.fn(),
        });

        render(<FederationResults serverName="broken.example.com" />);

        // Should show failed status
        await waitFor(() => {
            expect(screen.getByText('Failed')).toBeInTheDocument();
        });

        // Should show no addresses found
        expect(screen.getByText('federation.overview.noAddressesFound')).toBeInTheDocument();
    });

    it('renders DNS tab content correctly', async () => {
        const mockData = {
            FederationOK: true,
            DNSResult: {
                Addrs: ['192.168.1.1', '2001:db8::1'],
                SrvTargets: {
                    '_matrix._tcp.matrix.org': [
                        {
                            Target: 'matrix.org',
                            Port: 8448,
                            Priority: 10,
                            Weight: 5,
                            Addrs: ['192.168.1.1']
                        }
                    ]
                },
                SRVSkipped: false,
            },
            ConnectionReports: {},
            Version: { name: 'Synapse', version: '1.95.0' },
            WellKnownResult: {}
        };

        mockUseSWR.mockReturnValue({
            data: mockData,
            error: undefined,
            isLoading: false,
            isValidating: false,
            mutate: vi.fn(),
        });

        render(<FederationResults serverName="matrix.org" />);

        // Should render DNS addresses and SRV records
        expect(screen.getAllByText('192.168.1.1')).toHaveLength(3); // appears in multiple places
        expect(screen.getAllByText('2001:db8::1')).toHaveLength(2); // appears in multiple places
    });

    it('handles empty server name gracefully', () => {
        mockUseSWR.mockReturnValue({
            data: undefined,
            error: undefined,
            isLoading: false,
            isValidating: false,
            mutate: vi.fn(),
        });

        render(<FederationResults serverName="" />);

        // Should not crash and should not show any data
        expect(screen.queryByText('federation.title')).not.toBeInTheDocument();
    });

    it('correctly identifies server software maturity levels', async () => {
        const mockData = {
            FederationOK: true,
            DNSResult: {
                Addrs: [],
                SrvTargets: {},
                SRVSkipped: false,
            },
            ConnectionReports: {
                'matrix.org:443': {
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
                    Cipher: { CipherSuite: 'TLS_AES_256_GCM_SHA384', Version: 'TLSv1.3' },
                    Ed25519VerifyKeys: {},
                    Keys: {
                        server_name: 'matrix.org',
                        signatures: {},
                        valid_until_ts: 1700000000000,
                        verify_keys: {}
                    },
                    Version: {
                        name: 'Synapse',
                        version: '1.95.0'
                    }
                }
            },
            Version: { name: 'Synapse', version: '1.95.0' },
            WellKnownResult: {}
        };

        mockUseSWR.mockReturnValue({
            data: mockData,
            error: undefined,
            isLoading: false,
            isValidating: false,
            mutate: vi.fn(),
        });

        render(<FederationResults serverName="matrix.org" />);

        // Should show stable maturity for Synapse
        await waitFor(() => {
            expect(screen.getByText('Stable')).toBeInTheDocument();
        });
    });

    it('shows connection errors tab when errors exist', async () => {
        const mockData = {
            FederationOK: false,
            DNSResult: {
                Addrs: [],
                SrvTargets: {},
                SRVSkipped: false,
            },
            ConnectionReports: {},
            ConnectionErrors: {
                'broken.example.com:443': {
                    Error: 'Connection refused'
                }
            },
            Version: { name: 'Unknown', version: '0.0.0' },
            WellKnownResult: {}
        };

        mockUseSWR.mockReturnValue({
            data: mockData,
            error: undefined,
            isLoading: false,
            isValidating: false,
            mutate: vi.fn(),
        });

        render(<FederationResults serverName="broken.example.com" />);

        // Should show connection errors in the content
        await waitFor(() => {
            expect(screen.getByText('Connection refused')).toBeInTheDocument();
        });
    });

    it('displays well-known information correctly', async () => {
        const mockData = {
            FederationOK: true,
            DNSResult: {
                Addrs: [],
                SrvTargets: {},
                SRVSkipped: false,
            },
            ConnectionReports: {},
            Version: { name: 'Synapse', version: '1.95.0' },
            WellKnownResult: {
                'm.server': {
                    CacheExpiresAt: 1703548800,
                    'm.server': 'matrix.org:443'
                }
            }
        };

        mockUseSWR.mockReturnValue({
            data: mockData,
            error: undefined,
            isLoading: false,
            isValidating: false,
            mutate: vi.fn(),
        });

        render(<FederationResults serverName="matrix.org" />);

        // Should display well-known server information
        await waitFor(() => {
            expect(screen.getByText('matrix.org:443')).toBeInTheDocument();
        });
    });
});
