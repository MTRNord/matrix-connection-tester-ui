import { ConfigSchema, SupportWellKnownSchema, ClientWellKnownSchema, ClientServerVersionsSchema, ApiError } from "./apiTypes";
import type { ConfigType, SupportWellKnownType, ClientWellKnownType, ClientServerVersionsType, ApiResponseWithWarnings } from "./apiTypes";

import createClient from "openapi-fetch";
import type { paths, components } from "./api/api";

export async function getConfig(): Promise<ConfigType> {
    const response = await fetch(`/config.json`);
    const config = await response.json();
    return ConfigSchema.parse(config);
}

export const fetchData = async (serverName: string): Promise<components["schemas"]["Root"]> => {
    if (!serverName) {
        throw new ApiError("EMPTY_SERVER_NAME", "Server name cannot be empty");
    }
    const API_SERVER_URL = (await getConfig()).api_server_url;
    if (!API_SERVER_URL) {
        throw new ApiError("API_SERVER_NOT_CONFIGURED", "API server URL is not configured");
    }

    const client = createClient<paths>({
        baseUrl: API_SERVER_URL,
    });

    const { data, error } = await client.GET("/api/federation/report", {
        params: {
            query: {
                server_name: serverName,
                no_cache: true
            }
        }
    });

    if (error) {
        if (error instanceof Error) {
            throw new ApiError("API_FETCH_ERROR", `Failed to fetch data from API: ${error.message}`);
        }
        throw new ApiError("API_FETCH_ERROR", `Failed to fetch data from API ${error.toString()}`);
    }

    return data as components["schemas"]["Root"];
};

export const fetchSupportInfo = async (serverName: string): Promise<SupportWellKnownType> => {
    if (!serverName) {
        throw new ApiError("EMPTY_SERVER_NAME", "Server name cannot be empty");
    }
    const response = await fetch(`https://${serverName}/.well-known/matrix/support`);
    if (!response.ok) {
        throw new ApiError("SUPPORT_HTTP_ERROR", `HTTP error! status: ${response.status}`, { status: response.status });
    }
    if (response.headers.get("content-type") !== "application/json") {
        throw new ApiError("SUPPORT_INVALID_CONTENT_TYPE", "Expected JSON response from support endpoint as per Matrix Specification: https://spec.matrix.org/v1.14/client-server-api/#api-standards. Note that MSC2499 proposes to lift this requirement in the future, but it has not been merged yet: https://github.com/matrix-org/matrix-spec-proposals/pull/2499");
    }

    try {
        const data = await response.json();
        return SupportWellKnownSchema.parse(data);
    } catch (e: unknown) {
        throw new ApiError("SUPPORT_INVALID_JSON", `The json replied is either missing or not complete. Make sure to check https://spec.matrix.org/v1.14/client-server-api/#getwell-knownmatrixsupport as an admin of this Homeserver.\nAdditionally the error was: "${e}"`)
    }
}

/**
 * Fetches Matrix client well-known discovery information according to Matrix Specification 1.15
 * https://spec.matrix.org/v1.15/client-server-api/#getwell-knownmatrixclient
 * 
 * This endpoint is used by Matrix clients to discover the homeserver and identity server
 * URLs for a given domain. It's a critical part of Matrix federation and client discovery.
 */
export const fetchClientWellKnown = async (serverName: string): Promise<ApiResponseWithWarnings<ClientWellKnownType>> => {
    if (!serverName) {
        throw new ApiError("EMPTY_SERVER_NAME", "Server name cannot be empty for client well-known discovery");
    }

    // Validate server name format - should not contain protocol or path
    if (serverName.includes('://') || serverName.includes('/')) {
        throw new ApiError("INVALID_SERVER_NAME_FORMAT", "Server name should be a domain name only, without protocol or path (e.g. 'matrix.org', not 'https://matrix.org' or 'matrix.org/path')");
    }

    const wellKnownUrl = `https://${serverName}/.well-known/matrix/client`;

    let response: Response;
    try {
        response = await fetch(wellKnownUrl);
    } catch {
        throw new ApiError("CLIENT_WELLKNOWN_NETWORK_ERROR", "Failed to fetch client well-known endpoint");
    }

    // Check HTTP status according to Matrix Spec 1.15
    if (!response.ok) {
        const errorDetails = {
            status: response.status,
            statusText: response.statusText,
            url: wellKnownUrl
        };

        if (response.status === 404) {
            throw new ApiError("CLIENT_WELLKNOWN_NOT_FOUND", "Client well-known endpoint not found (404)", errorDetails);
        } else if (response.status >= 500) {
            throw new ApiError("CLIENT_WELLKNOWN_SERVER_ERROR", "Server error when fetching client well-known", errorDetails);
        } else if (response.status === 429) {
            throw new ApiError("CLIENT_WELLKNOWN_RATE_LIMITED", "Rate limited when fetching client well-known", errorDetails);
        } else {
            throw new ApiError("CLIENT_WELLKNOWN_HTTP_ERROR", "HTTP error when fetching client well-known", errorDetails);
        }
    }

    // Validate Content-Type header according to Matrix Spec 1.15
    // Note: This will be a warning as MSC2499 proposes to lift this requirement
    const warnings: ApiError[] = [];
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        // Log warning for developers (plain text for console)
        console.warn(`[CLIENT_WELLKNOWN_CONTENT_TYPE_WARNING] Expected 'application/json' Content-Type header for client well-known endpoint as per Matrix Specification 1.15 (https://spec.matrix.org/v1.15/client-server-api/#getwell-knownmatrixclient), but received: '${contentType || 'none'}'. MSC2499 (https://github.com/matrix-org/matrix-spec-proposals/pull/2499) proposes to lift this requirement, but it has not been merged yet. This may cause client compatibility issues with some implementations.`);

        // Create a warning that can be displayed to users (HTML formatted for UI)
        const contentTypeWarning = new ApiError("CLIENT_WELLKNOWN_CONTENT_TYPE_WARNING", "Content-Type header validation warning for client well-known endpoint");
        contentTypeWarning.isWarning = true;
        warnings.push(contentTypeWarning);
    }

    // Parse JSON response
    let jsonData: unknown;
    try {
        jsonData = await response.json();
    } catch {
        throw new ApiError("CLIENT_WELLKNOWN_INVALID_JSON", "Failed to parse JSON from client well-known endpoint");
    }

    // Validate against schema with detailed error reporting
    try {
        const parsedData = ClientWellKnownSchema.parse(jsonData);

        // Additional validation for required homeserver field
        if (!parsedData["m.homeserver"]?.base_url) {
            throw new ApiError("CLIENT_WELLKNOWN_MISSING_HOMESERVER", "The m.homeserver.base_url field is required but was not found");
        }

        // Validate homeserver URL format more strictly
        try {
            const homeserverUrl = new URL(parsedData["m.homeserver"].base_url);
            if (homeserverUrl.protocol !== 'https:' && homeserverUrl.protocol !== 'http:') {
                throw new ApiError("CLIENT_WELLKNOWN_INVALID_HOMESERVER_PROTOCOL", "Homeserver base_url must use HTTP or HTTPS protocol");
            }
        } catch (urlError) {
            if (urlError instanceof ApiError) throw urlError;
            throw new ApiError("CLIENT_WELLKNOWN_MALFORMED_HOMESERVER_URL", "The m.homeserver.base_url field contains an invalid URL");
        }

        // Validate identity server URL if present
        if (parsedData["m.identity_server"]?.base_url) {
            try {
                const identityServerUrl = new URL(parsedData["m.identity_server"].base_url);
                if (identityServerUrl.protocol !== 'https:' && identityServerUrl.protocol !== 'http:') {
                    throw new ApiError("CLIENT_WELLKNOWN_INVALID_IDENTITY_SERVER_PROTOCOL", "Identity server base_url must use HTTP or HTTPS protocol");
                }
            } catch (urlError) {
                if (urlError instanceof ApiError) throw urlError;
                throw new ApiError("CLIENT_WELLKNOWN_MALFORMED_IDENTITY_SERVER_URL", "The m.identity_server.base_url field contains an invalid URL");
            }
        }

        // Validate tile server URL if present
        if (parsedData["m.tile_server"]?.map_style_url) {
            try {
                const tileServerUrl = new URL(parsedData["m.tile_server"].map_style_url);
                if (tileServerUrl.protocol !== 'https:' && tileServerUrl.protocol !== 'http:') {
                    throw new ApiError("CLIENT_WELLKNOWN_INVALID_TILE_SERVER_PROTOCOL", `Tile server map_style_url must use HTTP or HTTPS protocol according to Matrix Spec 1.15, but found: ${tileServerUrl.protocol}`);
                }
            } catch (urlError) {
                if (urlError instanceof ApiError) throw urlError;
                throw new ApiError("CLIENT_WELLKNOWN_MALFORMED_TILE_SERVER_URL", `The 'm.tile_server.map_style_url' field contains an invalid URL: '${parsedData["m.tile_server"].map_style_url}'. Must be a valid URL according to Matrix Spec 1.15.\nURL parsing error: ${urlError instanceof Error ? urlError.message : String(urlError)}`);
            }
        }

        return {
            data: parsedData,
            warnings: warnings.length > 0 ? warnings : undefined
        };
    } catch (zodError: unknown) {
        // Enhanced error reporting for Zod validation errors
        if (zodError instanceof Error && 'issues' in zodError) {
            const zodIssues = zodError as Error & { issues: Array<{ path: (string | number)[]; code: string; message: string }> };
            const issueDetails = zodIssues.issues.map((issue) => `- Path: ${issue.path.join('.')} | Code: ${issue.code} | Message: ${issue.message}`).join('\n');
            throw new ApiError("CLIENT_WELLKNOWN_SCHEMA_VALIDATION_ERROR", `Client well-known response does not comply with Matrix Specification 1.15 schema. Please ensure the response follows the format specified at https://spec.matrix.org/v1.15/client-server-api/#getwell-knownmatrixclient\n\nValidation errors:\n${issueDetails}\n\nReceived data: ${JSON.stringify(jsonData, null, 2)}`);
        }
        throw new ApiError("CLIENT_WELLKNOWN_UNKNOWN_VALIDATION_ERROR", `Unexpected error during client well-known validation: ${zodError instanceof Error ? zodError.message : String(zodError)}\n\nReceived data: ${JSON.stringify(jsonData, null, 2)}`);
    }
}

/**
 * Fetches Matrix client-server API versions according to Matrix Specification 1.15
 * https://spec.matrix.org/v1.15/client-server-api/#get_matrixclientversions
 * 
 * This endpoint provides information about the supported Matrix client-server API versions
 * and optionally includes information about the server implementation.
 * 
 * For debugging purposes, this function will fall back to using the server name directly
 * if no homeserver URL is found in well-known discovery, but will indicate this as a warning.
 * 
 * @param serverName - The original server name (domain)
 * @param homeserverUrl - Optional homeserver URL discovered from .well-known/matrix/client
 * @param hasClientWellKnown - Whether a client well-known response exists (to determine if we should warn about missing base_url)
 */
export const fetchClientServerVersions = async (
    serverName: string,
    homeserverUrl?: string,
    hasClientWellKnown?: boolean
): Promise<ApiResponseWithWarnings<ClientServerVersionsType>> => {
    if (!serverName) {
        throw new ApiError("EMPTY_SERVER_NAME", "Server name cannot be empty for server version discovery");
    }

    // Validate server name format
    if (serverName.includes('://') || serverName.includes('/')) {
        throw new ApiError("INVALID_SERVER_NAME_FORMAT", "Server name should be a domain name only, without protocol or path (e.g. 'matrix.org', not 'https://matrix.org' or 'matrix.org/path')");
    }

    const warnings: ApiError[] = [];
    let actualHomeserverUrl = homeserverUrl;

    // Handle case where no homeserver URL is found in well-known (FAIL_PROMPT scenario)
    if (!homeserverUrl) {
        // Only show warning if we have a client well-known response but no base_url
        // Don't warn if there's no client well-known at all (404 case)
        if (hasClientWellKnown) {
            const fallbackWarning = new ApiError("CLIENT_DISCOVERY_FALLBACK", "No homeserver URL found in .well-known/matrix/client discovery");
            fallbackWarning.isWarning = true;
            warnings.push(fallbackWarning);
        }

        // Always fall back to server name for debugging purposes
        actualHomeserverUrl = `https://${serverName}`;
    }

    // At this point, actualHomeserverUrl is guaranteed to be defined
    if (!actualHomeserverUrl) {
        throw new ApiError("INTERNAL_ERROR", "Internal error: homeserver URL is undefined after fallback logic");
    }

    // Remove trailing slash if present
    const baseUrl = actualHomeserverUrl.replace(/\/$/, '');

    // Validate that the homeserver URL is properly formatted
    try {
        new URL(actualHomeserverUrl);
    } catch (e) {
        throw new ApiError("INVALID_HOMESERVER_URL", `Invalid homeserver URL: ${actualHomeserverUrl}. URL parsing error: ${e instanceof Error ? e.message : String(e)}`);
    }

    const versionUrl = `${baseUrl}/_matrix/client/versions`;

    let response: Response;
    try {
        response = await fetch(versionUrl);
    } catch {
        throw new ApiError("SERVER_VERSION_NETWORK_ERROR", "Failed to fetch server version endpoint");
    }

    // Check HTTP status according to Matrix Spec 1.15
    if (!response.ok) {
        const errorDetails = {
            status: response.status,
            statusText: response.statusText,
            url: versionUrl
        };

        if (response.status === 404) {
            throw new ApiError("SERVER_VERSION_NOT_FOUND", "Client versions endpoint not found (404)", errorDetails);
        } else if (response.status >= 500) {
            throw new ApiError("SERVER_VERSION_SERVER_ERROR", "Server error when fetching client versions", errorDetails);
        } else if (response.status === 429) {
            throw new ApiError("SERVER_VERSION_RATE_LIMITED", "Rate limited when fetching client versions", errorDetails);
        } else {
            throw new ApiError("SERVER_VERSION_HTTP_ERROR", "HTTP error when fetching client versions", errorDetails);
        }
    }

    // Validate Content-Type header according to Matrix Spec 1.15
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        throw new ApiError("SERVER_VERSION_INVALID_CONTENT_TYPE", "Expected application/json Content-Type header for client versions endpoint");
    }

    // Parse JSON response
    let jsonData: unknown;
    try {
        jsonData = await response.json();
    } catch {
        throw new ApiError("SERVER_VERSION_INVALID_JSON", "Failed to parse JSON from client versions endpoint");
    }

    // Validate against schema with detailed error reporting
    try {
        const parsedData = ClientServerVersionsSchema.parse(jsonData);
        return {
            data: parsedData,
            warnings: warnings.length > 0 ? warnings : undefined
        };
    } catch (zodError: unknown) {
        // Enhanced error reporting for Zod validation errors
        if (zodError instanceof Error && 'issues' in zodError) {
            const zodIssues = zodError as Error & { issues: Array<{ path: (string | number)[]; code: string; message: string }> };
            const issueDetails = zodIssues.issues.map((issue) => `- Path: ${issue.path.join('.')} | Code: ${issue.code} | Message: ${issue.message}`).join('\n');
            throw new ApiError("SERVER_VERSION_SCHEMA_VALIDATION_ERROR", `Client versions response does not comply with Matrix Specification 1.15 schema. Please ensure the response follows the format specified at https://spec.matrix.org/v1.15/client-server-api/#get_matrixclientversions\n\nValidation errors:\n${issueDetails}\n\nReceived data: ${JSON.stringify(jsonData, null, 2)}`);
        }
        throw new ApiError("SERVER_VERSION_UNKNOWN_VALIDATION_ERROR", `Unexpected error during client versions validation: ${zodError instanceof Error ? zodError.message : String(zodError)}\n\nReceived data: ${JSON.stringify(jsonData, null, 2)}`);
    }
}