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