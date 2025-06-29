import { ApiSchema, ConfigSchema, SupportWellKnownSchema, ClientWellKnownSchema, ClientServerVersionsSchema, ApiError } from "./apiTypes";
import type { ApiSchemaType, ConfigType, SupportWellKnownType, ClientWellKnownType, ClientServerVersionsType } from "./apiTypes";

async function getConfig(): Promise<ConfigType> {
    const response = await fetch(`/config.json`);
    const config = await response.json();
    return ConfigSchema.parse(config);
}

export const fetchData = async (serverName: string): Promise<ApiSchemaType> => {
    if (!serverName) {
        throw new ApiError("EMPTY_SERVER_NAME", "Server name cannot be empty");
    }
    const API_SERVER_URL = (await getConfig()).api_server_url;
    if (!API_SERVER_URL) {
        throw new ApiError("API_SERVER_NOT_CONFIGURED", "API server URL is not configured");
    }
    const response = await fetch(`${API_SERVER_URL}/api/report?server_name=${serverName}&no_cache=true`);
    if (!response.ok) {
        throw new ApiError("API_HTTP_ERROR", `HTTP error! status: ${response.status}`, { status: response.status });
    }
    const data = await response.json();
    return ApiSchema.parse(data);
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
        throw new ApiError("SUPPORT_INVALID_CONTENT_TYPE", "Expected JSON response from support endpoint as per Matrix Specification: https://spec.matrix.org/v1.14/client-server-api/#api-standards but be aware that MSC2499 will lift this requirement in the future: https://github.com/matrix-org/matrix-spec-proposals/pull/2499");
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
export const fetchClientWellKnown = async (serverName: string): Promise<ClientWellKnownType> => {
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
    } catch (e: unknown) {
        throw new ApiError("CLIENT_WELLKNOWN_NETWORK_ERROR", `Failed to fetch client well-known from ${wellKnownUrl}. This could indicate network issues or that the server is unreachable.\nNetwork error: ${e instanceof Error ? e.message : String(e)}`);
    }

    // Check HTTP status according to Matrix Spec 1.15
    if (!response.ok) {
        const errorDetails = {
            status: response.status,
            statusText: response.statusText,
            url: wellKnownUrl
        };

        if (response.status === 404) {
            throw new ApiError("CLIENT_WELLKNOWN_NOT_FOUND", `Client well-known endpoint not found (404) at ${wellKnownUrl}. This means the server does not provide Matrix client discovery information. According to Matrix Spec 1.15, this is valid but clients will need to use the server name directly as the homeserver URL.`, errorDetails);
        } else if (response.status >= 500) {
            throw new ApiError("CLIENT_WELLKNOWN_SERVER_ERROR", `Server error (${response.status}) when fetching client well-known from ${wellKnownUrl}. The server may be experiencing issues. Try again later.`, errorDetails);
        } else if (response.status === 429) {
            throw new ApiError("CLIENT_WELLKNOWN_RATE_LIMITED", `Rate limited (429) when fetching client well-known from ${wellKnownUrl}. Too many requests have been made. Wait before trying again.`, errorDetails);
        } else {
            throw new ApiError("CLIENT_WELLKNOWN_HTTP_ERROR", `HTTP error ${response.status} (${response.statusText}) when fetching client well-known from ${wellKnownUrl}. Check server configuration and Matrix Spec 1.15 compliance.`, errorDetails);
        }
    }

    // Validate Content-Type header according to Matrix Spec 1.15
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        throw new ApiError("CLIENT_WELLKNOWN_INVALID_CONTENT_TYPE", `Expected 'application/json' Content-Type header for client well-known endpoint as per Matrix Specification 1.15 (https://spec.matrix.org/v1.15/client-server-api/#getwell-knownmatrixclient), but received: '${contentType || 'none'}'. This violates the Matrix specification and may cause client compatibility issues.`);
    }

    // Parse JSON response
    let jsonData: unknown;
    try {
        jsonData = await response.json();
    } catch (e: unknown) {
        throw new ApiError("CLIENT_WELLKNOWN_INVALID_JSON", `Failed to parse JSON from client well-known endpoint ${wellKnownUrl}. The response body is not valid JSON as required by Matrix Spec 1.15.\nJSON parse error: ${e instanceof Error ? e.message : String(e)}\nResponse status: ${response.status}`);
    }

    // Validate against schema with detailed error reporting
    try {
        const parsedData = ClientWellKnownSchema.parse(jsonData);

        // Additional validation for required homeserver field
        if (!parsedData["m.homeserver"]?.base_url) {
            throw new ApiError("CLIENT_WELLKNOWN_MISSING_HOMESERVER", "The 'm.homeserver.base_url' field is required according to Matrix Spec 1.15 but was not found or is empty in the client well-known response. This field must contain a valid URL pointing to the Matrix homeserver.");
        }

        // Validate homeserver URL format more strictly
        try {
            const homeserverUrl = new URL(parsedData["m.homeserver"].base_url);
            if (homeserverUrl.protocol !== 'https:' && homeserverUrl.protocol !== 'http:') {
                throw new ApiError("CLIENT_WELLKNOWN_INVALID_HOMESERVER_PROTOCOL", `Homeserver base_url must use HTTP or HTTPS protocol according to Matrix Spec 1.15, but found: ${homeserverUrl.protocol}`);
            }
        } catch (urlError) {
            if (urlError instanceof ApiError) throw urlError;
            throw new ApiError("CLIENT_WELLKNOWN_MALFORMED_HOMESERVER_URL", `The 'm.homeserver.base_url' field contains an invalid URL: '${parsedData["m.homeserver"].base_url}'. Must be a valid URL according to Matrix Spec 1.15.\nURL parsing error: ${urlError instanceof Error ? urlError.message : String(urlError)}`);
        }

        // Validate identity server URL if present
        if (parsedData["m.identity_server"]?.base_url) {
            try {
                const identityServerUrl = new URL(parsedData["m.identity_server"].base_url);
                if (identityServerUrl.protocol !== 'https:' && identityServerUrl.protocol !== 'http:') {
                    throw new ApiError("CLIENT_WELLKNOWN_INVALID_IDENTITY_SERVER_PROTOCOL", `Identity server base_url must use HTTP or HTTPS protocol according to Matrix Spec 1.15, but found: ${identityServerUrl.protocol}`);
                }
            } catch (urlError) {
                if (urlError instanceof ApiError) throw urlError;
                throw new ApiError("CLIENT_WELLKNOWN_MALFORMED_IDENTITY_SERVER_URL", `The 'm.identity_server.base_url' field contains an invalid URL: '${parsedData["m.identity_server"].base_url}'. Must be a valid URL according to Matrix Spec 1.15.\nURL parsing error: ${urlError instanceof Error ? urlError.message : String(urlError)}`);
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

        return parsedData;
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
 * @param serverName - The original server name (domain)
 * @param homeserverUrl - Optional homeserver URL discovered from .well-known/matrix/client
 */
export const fetchClientServerVersions = async (serverName: string, homeserverUrl?: string): Promise<ClientServerVersionsType> => {
    if (!serverName) {
        throw new ApiError("EMPTY_SERVER_NAME", "Server name cannot be empty for server version discovery");
    }

    // Validate server name format
    if (serverName.includes('://') || serverName.includes('/')) {
        throw new ApiError("INVALID_SERVER_NAME_FORMAT", "Server name should be a domain name only, without protocol or path (e.g. 'matrix.org', not 'https://matrix.org' or 'matrix.org/path')");
    }

    // Use homeserver URL from well-known if available, otherwise fall back to server name
    let baseUrl: string;
    if (homeserverUrl) {
        // Remove trailing slash if present
        baseUrl = homeserverUrl.replace(/\/$/, '');
        // Validate that the homeserver URL is properly formatted
        try {
            new URL(homeserverUrl);
        } catch (e) {
            throw new ApiError("INVALID_HOMESERVER_URL", `Invalid homeserver URL from well-known discovery: ${homeserverUrl}. URL parsing error: ${e instanceof Error ? e.message : String(e)}`);
        }
    } else {
        baseUrl = `https://${serverName}`;
    }

    const versionUrl = `${baseUrl}/_matrix/client/versions`;

    let response: Response;
    try {
        response = await fetch(versionUrl);
    } catch (e: unknown) {
        const discoveryInfo = homeserverUrl ? ` (using homeserver URL from well-known: ${homeserverUrl})` : ` (using fallback to server name: ${serverName})`;
        throw new ApiError("SERVER_VERSION_NETWORK_ERROR", `Failed to fetch server version from ${versionUrl}${discoveryInfo}. This could indicate network issues or that the server is unreachable.\nNetwork error: ${e instanceof Error ? e.message : String(e)}`);
    }

    // Check HTTP status according to Matrix Spec 1.15
    if (!response.ok) {
        const errorDetails = {
            status: response.status,
            statusText: response.statusText,
            url: versionUrl
        };

        const discoveryInfo = homeserverUrl ? ` The homeserver URL (${homeserverUrl}) was discovered from .well-known/matrix/client.` : ` Using fallback to server name (${serverName}).`;

        if (response.status === 404) {
            throw new ApiError("SERVER_VERSION_NOT_FOUND", `Client versions endpoint not found (404) at ${versionUrl}.${discoveryInfo} This may indicate that the server is not a Matrix homeserver or does not support the client-server API.`, errorDetails);
        } else if (response.status >= 500) {
            throw new ApiError("SERVER_VERSION_SERVER_ERROR", `Server error (${response.status}) when fetching client versions from ${versionUrl}.${discoveryInfo} The server may be experiencing issues. Try again later.`, errorDetails);
        } else if (response.status === 429) {
            throw new ApiError("SERVER_VERSION_RATE_LIMITED", `Rate limited (429) when fetching client versions from ${versionUrl}.${discoveryInfo} Too many requests have been made. Wait before trying again.`, errorDetails);
        } else {
            throw new ApiError("SERVER_VERSION_HTTP_ERROR", `HTTP error ${response.status} (${response.statusText}) when fetching client versions from ${versionUrl}.${discoveryInfo} Check server configuration and Matrix Spec 1.15 compliance.`, errorDetails);
        }
    }

    // Validate Content-Type header according to Matrix Spec 1.15
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        throw new ApiError("SERVER_VERSION_INVALID_CONTENT_TYPE", `Expected 'application/json' Content-Type header for client versions endpoint as per Matrix Specification 1.15 (https://spec.matrix.org/v1.15/client-server-api/#get_matrixclientversions), but received: '${contentType || 'none'}'. This violates the Matrix specification.`);
    }

    // Parse JSON response
    let jsonData: unknown;
    try {
        jsonData = await response.json();
    } catch (e: unknown) {
        throw new ApiError("SERVER_VERSION_INVALID_JSON", `Failed to parse JSON from client versions endpoint ${versionUrl}. The response body is not valid JSON as required by Matrix Spec 1.15.\nJSON parse error: ${e instanceof Error ? e.message : String(e)}\nResponse status: ${response.status}`);
    }

    // Validate against schema with detailed error reporting
    try {
        const parsedData = ClientServerVersionsSchema.parse(jsonData);
        return parsedData;
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