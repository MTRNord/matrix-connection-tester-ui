import { ApiSchema, ConfigSchema, SupportWellKnownSchema } from "./apiTypes";
import type { ApiSchemaType, ConfigType, SupportWellKnownType } from "./apiTypes";

async function getConfig(): Promise<ConfigType> {
    const response = await fetch(`/config.json`);
    const config = await response.json();
    return ConfigSchema.parse(config);
}

export const fetchData = async (serverName: string): Promise<ApiSchemaType> => {
    if (!serverName) {
        throw new Error("Server name cannot be empty");
    }
    const API_SERVER_URL = (await getConfig()).api_server_url;
    if (!API_SERVER_URL) {
        throw new Error("API server URL is not configured");
    }
    const response = await fetch(`${API_SERVER_URL}/api/report?server_name=${serverName}`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return ApiSchema.parse(data);
};

export const fetchSupportInfo = async (serverName: string): Promise<SupportWellKnownType> => {
    if (!serverName) {
        throw new Error("Server name cannot be empty");
    }
    const response = await fetch(`https://${serverName}/.well-known/matrix/support`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    if (response.headers.get("content-type") !== "application/json") {
        throw new Error("Expected JSON response from support endpoint as per Matrix Specification: https://spec.matrix.org/v1.14/client-server-api/#api-standards but be aware that MSC2499 will lift this requirement in the future: https://github.com/matrix-org/matrix-spec-proposals/pull/2499");
    }

    const data = await response.json();
    return SupportWellKnownSchema.parse(data);
}