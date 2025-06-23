import { z } from "zod/v4"

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
            ValidCertificates: z.boolean()
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
        })
    })).optional(),
    ConnectionErrors: z.record(z.string(), z.object({
        Error: z.string().optional(),
    })).optional(),
    DNSResult: z.object({
        Addrs: z.array(z.string()).optional(),
        Hosts: z.record(z.string(), z.object({
            Addrs: z.array(z.string()).optional(),
            CName: z.string(),
            Error: z.string().optional(),
        })),
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


export const ConfigSchema = z.object({
    api_server_url: z.url(),
});

export type ConfigType = z.infer<typeof ConfigSchema>;