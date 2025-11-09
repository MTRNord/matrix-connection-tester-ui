/**
 * Shared state for client-server API checks using Preact signals
 * This allows multiple islands to share the same data without duplicate fetches
 */

import { signal } from "@preact/signals";
import type { MatrixError } from "./errors.ts";
import {
  createHTTPError,
  createJSONParseError,
  ErrorType,
  fetchWithTimeout,
  validateContentType,
} from "./errors.ts";

interface ClientWellKnownResp {
  "m.homeserver"?: {
    base_url: string;
  };
  "m.identity_server"?: {
    base_url: string;
  };
  [key: string]: unknown;
}

interface VersionsResponse {
  versions: string[];
  unstable_features?: Record<string, boolean>;
}

interface ClientServerState {
  clientWellKnown: ClientWellKnownResp | null;
  versions: VersionsResponse | null;
  discoveredEndpoint: string | null;
  errors: {
    clientWellKnown?: MatrixError;
    versions?: MatrixError;
  };
  loading: boolean;
  serverName: string | null;
}

const initialState: ClientServerState = {
  clientWellKnown: null,
  versions: null,
  discoveredEndpoint: null,
  errors: {},
  loading: false,
  serverName: null,
};

export const clientServerState = signal<ClientServerState>(initialState);

// Track in-flight requests to prevent duplicate fetches
let currentFetchPromise: Promise<void> | null = null;

/**
 * Fetch client-server API information
 * Uses a singleton pattern to prevent duplicate fetches
 */
export async function fetchClientServerInfo(serverName: string): Promise<void> {
  // If already fetching for this server, wait for that request
  if (
    currentFetchPromise &&
    clientServerState.value.serverName === serverName
  ) {
    return await currentFetchPromise;
  }

  // If we already have data for this server and it's not loading, return
  if (
    clientServerState.value.serverName === serverName &&
    !clientServerState.value.loading &&
    (clientServerState.value.clientWellKnown ||
      clientServerState.value.errors.clientWellKnown)
  ) {
    return;
  }

  // Start new fetch
  currentFetchPromise = performFetch(serverName);
  return await currentFetchPromise;
}

async function performFetch(serverName: string): Promise<void> {
  clientServerState.value = {
    ...initialState,
    loading: true,
    serverName,
  };

  try {
    // Step 1: Fetch /.well-known/matrix/client
    const wellKnownUrl = `https://${serverName}/.well-known/matrix/client`;
    const { response: wellKnownResp, error: wellKnownError } =
      await fetchWithTimeout(wellKnownUrl, 10000);

    if (wellKnownError) {
      clientServerState.value = {
        ...clientServerState.value,
        errors: { clientWellKnown: wellKnownError },
        loading: false,
      };
      return;
    }

    if (!wellKnownResp || !wellKnownResp.ok) {
      const text = wellKnownResp
        ? await wellKnownResp.text().catch(() => "")
        : "";
      const error = wellKnownResp
        ? createHTTPError(wellKnownResp, wellKnownUrl, text)
        : {
          type: ErrorType.UNKNOWN,
          message: "errors.unknown_error",
          endpoint: wellKnownUrl,
        };
      clientServerState.value = {
        ...clientServerState.value,
        errors: { clientWellKnown: error },
        loading: false,
      };
      return;
    }

    // Validate Content-Type for well-known
    const contentTypeError = validateContentType(wellKnownResp);
    if (contentTypeError) {
      contentTypeError.endpoint = wellKnownUrl;
      clientServerState.value = {
        ...clientServerState.value,
        errors: { clientWellKnown: contentTypeError },
        loading: false,
      };
      return;
    }

    // Parse well-known JSON
    let clientWellKnown: ClientWellKnownResp;
    const wellKnownText = await wellKnownResp.text();
    try {
      clientWellKnown = JSON.parse(wellKnownText);
    } catch (e) {
      const error = createJSONParseError(e, wellKnownUrl, wellKnownText);
      clientServerState.value = {
        ...clientServerState.value,
        errors: { clientWellKnown: error },
        loading: false,
      };
      return;
    }

    // Extract homeserver base URL and remove trailing slash
    let homeserverBaseUrl = clientWellKnown["m.homeserver"]?.base_url;
    if (!homeserverBaseUrl) {
      clientServerState.value = {
        ...clientServerState.value,
        clientWellKnown,
        errors: {
          clientWellKnown: {
            type: ErrorType.MISSING_FIELD,
            message: "errors.missing_field",
            technicalDetails: 'Missing "m.homeserver.base_url" field',
            endpoint: wellKnownUrl,
          },
        },
        loading: false,
      };
      return;
    }

    // Remove trailing slash from base URL to prevent double slashes
    homeserverBaseUrl = homeserverBaseUrl.replace(/\/$/, "");

    clientServerState.value = {
      ...clientServerState.value,
      clientWellKnown,
      discoveredEndpoint: homeserverBaseUrl,
    };

    // Step 2: Fetch versions from the discovered endpoint
    const versionsUrl = `${homeserverBaseUrl}/_matrix/client/versions`;
    const { response: versionsResp, error: versionsError } =
      await fetchWithTimeout(versionsUrl, 10000);

    if (versionsError) {
      clientServerState.value = {
        ...clientServerState.value,
        errors: { ...clientServerState.value.errors, versions: versionsError },
        loading: false,
      };
      return;
    }

    if (!versionsResp || !versionsResp.ok) {
      const text = versionsResp
        ? await versionsResp.text().catch(() => "")
        : "";
      const error = versionsResp
        ? createHTTPError(versionsResp, versionsUrl, text)
        : {
          type: ErrorType.UNKNOWN,
          message: "errors.unknown_error",
          endpoint: versionsUrl,
        };
      clientServerState.value = {
        ...clientServerState.value,
        errors: { ...clientServerState.value.errors, versions: error },
        loading: false,
      };
      return;
    }

    // Validate Content-Type for versions
    const versionsContentTypeError = validateContentType(versionsResp);
    if (versionsContentTypeError) {
      versionsContentTypeError.endpoint = versionsUrl;
      clientServerState.value = {
        ...clientServerState.value,
        errors: {
          ...clientServerState.value.errors,
          versions: versionsContentTypeError,
        },
        loading: false,
      };
      return;
    }

    // Parse versions JSON
    let versions: VersionsResponse;
    const versionsText = await versionsResp.text();
    try {
      versions = JSON.parse(versionsText);
    } catch (e) {
      const error = createJSONParseError(e, versionsUrl, versionsText);
      clientServerState.value = {
        ...clientServerState.value,
        errors: { ...clientServerState.value.errors, versions: error },
        loading: false,
      };
      return;
    }

    if (!versions.versions || !Array.isArray(versions.versions)) {
      clientServerState.value = {
        ...clientServerState.value,
        versions,
        errors: {
          ...clientServerState.value.errors,
          versions: {
            type: ErrorType.INVALID_RESPONSE,
            message: "errors.invalid_response",
            technicalDetails: 'Missing or invalid "versions" array',
            endpoint: versionsUrl,
          },
        },
        loading: false,
      };
      return;
    }

    clientServerState.value = {
      ...clientServerState.value,
      versions,
      loading: false,
    };
  } finally {
    currentFetchPromise = null;
  }
}
