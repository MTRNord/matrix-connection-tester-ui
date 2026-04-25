export interface AlertDto {
  id: number;
  server_name: string;
  verified: boolean;
  created_at: string;
  last_check_at?: string | null;
  is_currently_failing: boolean;
  notify_emails: string[];
}

export interface UserMeDto {
  sub: string;
  email: string;
  email_verified: boolean;
  additional_emails?: { email: string; verified: boolean }[];
}

export interface OidcConfigDto {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  revocation_endpoint: string;
}

export const DEFAULT_ALERTS: AlertDto[] = [
  {
    id: 1,
    server_name: "matrix.example.com",
    verified: true,
    created_at: "2026-01-01T00:00:00Z",
    last_check_at: "2026-04-25T12:00:00Z",
    is_currently_failing: false,
    notify_emails: ["user@example.com"],
  },
  {
    id: 2,
    server_name: "failing.example.com",
    verified: false,
    created_at: "2026-03-15T10:00:00Z",
    last_check_at: null,
    is_currently_failing: true,
    notify_emails: ["admin@example.com"],
  },
];

export const DEFAULT_USER_ME: UserMeDto = {
  sub: "user-123",
  email: "user@example.com",
  email_verified: true,
  additional_emails: [
    { email: "user2@example.com", verified: true },
    { email: "unverified@example.com", verified: false },
  ],
};

export const OIDC_CONFIG: OidcConfigDto = {
  issuer: "http://localhost:8080",
  authorization_endpoint: "http://localhost:8080/oauth2/authorize",
  token_endpoint: "http://localhost:8080/oauth2/token",
  revocation_endpoint: "http://localhost:8080/oauth2/revoke",
};

export const FEDERATION_REPORT_SUCCESS = {
  ServerName: "matrix.example.com",
  FederationOK: true,
  FederationWarning: false,
  DNSResult: { Addrs: ["93.184.216.34"], SRVSkipped: true },
  Version: { name: "Synapse", version: "1.105.0" },
  ConnectionReports: {
    "93.184.216.34:8448": {
      Certificates: [],
      Checks: {
        AllChecksOK: true,
        AllEd25519ChecksOK: true,
        Ed25519Checks: {},
        FutureValidUntilTS: true,
        HasEd25519Key: true,
        MatchingServerName: true,
        ServerVersionParses: true,
        ValidCertificates: true,
      },
      Cipher: { CipherSuite: "TLS_AES_128_GCM_SHA256", Version: "TLSv1.3" },
      Ed25519VerifyKeys: {},
      Keys: {
        old_verify_keys: {},
        server_name: "matrix.example.com",
        signatures: {},
        valid_until_ts: 9999999999999,
        verify_keys: {},
      },
      Version: { name: "Synapse", version: "1.105.0" },
    },
  },
  ConnectionErrors: {},
};

export const FEDERATION_REPORT_FAILURE = {
  ServerName: "broken.example.com",
  FederationOK: false,
  FederationWarning: false,
  DNSResult: { Addrs: [], SRVSkipped: true },
  Version: { name: "Unknown", version: "Unknown" },
  ConnectionReports: {},
  ConnectionErrors: {
    "broken.example.com:8448": {
      Error: "connection refused",
      ErrorCode: "network_error",
    },
  },
  Error: { Error: "No reachable endpoints", ErrorCode: "all_failed" },
};
