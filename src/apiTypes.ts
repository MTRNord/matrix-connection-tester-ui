import { z } from "zod/v4"

// API Error types for structured error handling
export class ApiError extends Error {
    code: string;
    details?: Record<string, unknown>;
    isWarning?: boolean; // For warnings that should be displayed but not block functionality

    constructor(
        code: string,
        message: string,
        details?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
        this.details = details;
        this.isWarning = false; // Default to false
    }
}

export const ErrorSchema = z.object({
    Error: z.string(),
    ErrorCode: z.enum(["Unknown", "NoAddressFound", "SRVPointsToCNAME", "DNSLookupTimeout", "SRVLookupTimeout"])
});

export type ErrorType = z.infer<typeof ErrorSchema>;

export const ApiSchema = z.object({
    ConnectionReports: z.record(z.string(), z.object({
        Certificates: z.array(
            z.object({
                DNSNames: z.array(z.string()).optional(),
                IssuerCommonName: z.string(),
                SHA256Fingerprint: z.string(),
                SubjectCommonName: z.string()
            }),
        ),
        Checks: z.object({
            AllChecksOK: z.boolean(),
            AllEd25519ChecksOK: z.boolean(),
            Ed25519Checks: z.record(z.string(), z.object({
                MatchingSignature: z.boolean(),
                ValidEd25519: z.boolean()
            })),
            FutureValidUntilTS: z.boolean(),
            HasEd25519Key: z.boolean(),
            MatchingServerName: z.boolean(),
            ValidCertificates: z.boolean(),
            ServerVersionParses: z.boolean(),
        }),
        Cipher: z.object({ CipherSuite: z.string(), Version: z.string() }),
        Ed25519VerifyKeys: z.record(z.string(), z.string()),
        Keys: z.object({
            old_verify_keys: z.record(z.string(), z.object({
                expired_ts: z.number(),
                key: z.string()
            })).optional(),
            server_name: z.string(),
            signatures: z.record(z.string(), z.record(z.string(), z.string())),
            valid_until_ts: z.number(),
            verify_keys: z.record(z.string(), z.object({ key: z.string() }))
        }),
        Version: z.object({
            name: z.string(),
            version: z.string()
        }),
        Error: z.string().optional(),
    })).optional(),
    ConnectionErrors: z.record(z.string(), z.object({
        Error: z.string().optional(),
    })).optional(),
    DNSResult: z.object({
        Addrs: z.array(z.string()).optional(),
        SrvTargets: z.record(z.string(), z.array(z.object({
            Target: z.string(),
            Addrs: z.array(z.string()).optional(),
            Error: ErrorSchema.optional(),
            Port: z.number(),
            Priority: z.number().optional(),
            Weight: z.number().optional()
        }))).optional(),
        SRVSkipped: z.boolean()
    }),
    FederationOK: z.boolean(),
    Version: z.object({ name: z.string(), version: z.string() }),
    WellKnownResult: z.record(z.string(), z.object({
        CacheExpiresAt: z.number(),
        "m.server": z.string()
    })),
})

export type ApiSchemaType = z.infer<typeof ApiSchema>;

export const SupportWellKnownSchema = z.object({
    contacts: z.array(z.object({
        email_address: z.email().optional(),
        matrix_id: z.string().optional(),
        role: z.string(),
    })).optional(),
    support_page: z.string().optional(),
});

export type SupportWellKnownType = z.infer<typeof SupportWellKnownSchema>;

// Matrix Client Well-Known Discovery Schema according to Matrix Spec 1.15
// https://spec.matrix.org/v1.15/client-server-api/#getwell-knownmatrixclient
export const ClientWellKnownSchema = z.object({
    "m.homeserver": z.object({
        base_url: z.string().url("Must be a valid URL according to Matrix Spec 1.15")
    }),
    "m.identity_server": z.object({
        base_url: z.string().url("Must be a valid URL according to Matrix Spec 1.15")
    }).optional(),
    "m.tile_server": z.object({
        map_style_url: z.string().url("Must be a valid URL according to Matrix Spec 1.15")
    }).optional(),
    // Allow additional fields as per Matrix Spec - applications may add custom fields
}).catchall(z.unknown()); // catchall allows additional properties not defined in schema

// Matrix Client Versions Schema according to Matrix Spec 1.15
// https://spec.matrix.org/v1.15/client-server-api/#get_matrixclientversions
export const ClientServerVersionsSchema = z.object({
    versions: z.array(z.string()),
    unstable_features: z.record(z.string(), z.boolean()).optional(),
    server: z.object({
        name: z.string(),
        version: z.string()
    }).optional(),
    // Allow additional fields for server-specific information
}).catchall(z.unknown());

// Matrix Server Well-Known Discovery Schema according to Matrix Spec 1.15
// https://spec.matrix.org/v1.15/server-server-api/#getwell-knownmatrixserver
export const ServerWellKnownSchema = z.object({
    "m.server": z.string().regex(/^[a-zA-Z0-9.-]+:[0-9]+$/, "Must be in format 'hostname:port' according to Matrix Spec 1.15")
}).catchall(z.unknown());

export type ClientWellKnownType = z.infer<typeof ClientWellKnownSchema>;
export type ClientServerVersionsType = z.infer<typeof ClientServerVersionsSchema>;
export type ServerWellKnownType = z.infer<typeof ServerWellKnownSchema>;

export const ConfigSchema = z.object({
    api_server_url: z.url(),
});

export type ConfigType = z.infer<typeof ConfigSchema>;

// Wrapper type for API responses that can include warnings
export type ApiResponseWithWarnings<T> = {
    data: T;
    warnings?: ApiError[];
};