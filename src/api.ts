import { ApiSchema, SupportWellKnownSchema } from "./apiTypes";
import type { ApiSchemaType, SupportWellKnownType } from "./apiTypes";

const API_SERVER_URL = import.meta.env.VITE_API_SERVER_URL || "http://127.0.0.1:8080";

export const fetchData = async (serverName: string): Promise<ApiSchemaType> => {
    if (!serverName) {
        throw new Error("Server name cannot be empty");
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
        throw new Error("Expected JSON response from support endpoint");
    }

    const data = await response.json();
    return SupportWellKnownSchema.parse(data);
}