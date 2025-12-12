/**
 * Shared state for client-server API checks using Preact signals
 * This allows multiple islands to share the same data without duplicate fetches
 */

import { computed, signal } from "@preact/signals";
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

// Computed signals for common derived state
export const clientServerLoading = computed(() =>
  clientServerState.value.loading
);

export const clientServerErrors = computed(() =>
  clientServerState.value.errors
);

export const clientServerHasErrors = computed(() =>
  !!(clientServerState.value.errors.clientWellKnown ||
    clientServerState.value.errors.versions)
);

export const clientServerStatus = computed<"loading" | "success" | "error">(
  () => {
    const state = clientServerState.value;
    if (state.loading) return "loading";
    if (!state.errors.clientWellKnown && !state.errors.versions) {
      return "success";
    }
    return "error";
  },
);

export const clientServerSuccessful = computed(() =>
  clientServerStatus.value === "success"
);

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

    let clientWellKnown: ClientWellKnownResp | null = null;
    let wellKnownErrorToStore: MatrixError | undefined = undefined;
    let homeserverBaseUrl: string | null = null;

    // Handle well-known response
    if (wellKnownError) {
      wellKnownErrorToStore = wellKnownError;
    } else if (!wellKnownResp || !wellKnownResp.ok) {
      const text = wellKnownResp
        ? await wellKnownResp.text().catch(() => "")
        : "";
      wellKnownErrorToStore = wellKnownResp
        ? createHTTPError(wellKnownResp, wellKnownUrl, text)
        : {
          type: ErrorType.UNKNOWN,
          message: "errors.unknown_error",
          endpoint: wellKnownUrl,
        };
    } else {
      // Validate Content-Type for well-known
      const contentTypeError = validateContentType(wellKnownResp);
      if (contentTypeError) {
        contentTypeError.endpoint = wellKnownUrl;
        wellKnownErrorToStore = contentTypeError;
      } else {
        // Parse well-known JSON
        const wellKnownText = await wellKnownResp.text();
        try {
          const parsedWellKnown = JSON.parse(wellKnownText);
          clientWellKnown = parsedWellKnown;

          // Extract homeserver base URL and remove trailing slash
          homeserverBaseUrl = parsedWellKnown["m.homeserver"]?.base_url || null;
          if (!homeserverBaseUrl) {
            wellKnownErrorToStore = {
              type: ErrorType.MISSING_FIELD,
              message: "errors.missing_field",
              technicalDetails: 'Missing "m.homeserver.base_url" field',
              endpoint: wellKnownUrl,
            };
          } else {
            // Remove trailing slash from base URL to prevent double slashes
            homeserverBaseUrl = homeserverBaseUrl.replace(/\/$/, "");
          }
        } catch (e) {
          wellKnownErrorToStore = createJSONParseError(
            e,
            wellKnownUrl,
            wellKnownText,
          );
        }
      }
    }

    // Step 2: Fetch versions from the discovered endpoint or fallback to direct server
    // Try both the discovered endpoint (if available) and the direct server name
    let versions: VersionsResponse | null = null;
    let versionsErrorToStore: MatrixError | undefined = undefined;
    let discoveredEndpoint: string | null = homeserverBaseUrl;

    // First, try the discovered endpoint from well-known
    if (homeserverBaseUrl) {
      const versionsUrl = `${homeserverBaseUrl}/_matrix/client/versions`;
      const result = await tryFetchVersions(versionsUrl);

      if (result.versions) {
        versions = result.versions;
      } else {
        versionsErrorToStore = result.error;
      }
    }

    // If well-known failed or versions from discovered endpoint failed, try direct server name
    if (!versions) {
      const directVersionsUrl = `https://${serverName}/_matrix/client/versions`;
      const result = await tryFetchVersions(directVersionsUrl);

      if (result.versions) {
        versions = result.versions;
        // If we succeeded with direct endpoint but well-known failed, update discovered endpoint
        if (!homeserverBaseUrl) {
          discoveredEndpoint = `https://${serverName}`;
        }
        // Clear versions error if direct fetch succeeded
        versionsErrorToStore = undefined;
        // Clear well-known error too - if versions works, the client API is functional
        // even without well-known discovery
        wellKnownErrorToStore = undefined;
      } else if (!versionsErrorToStore) {
        // Only set error if we don't already have one from the discovered endpoint
        versionsErrorToStore = result.error;
      }
    }

    // Update state with all results
    clientServerState.value = {
      ...clientServerState.value,
      clientWellKnown,
      versions,
      discoveredEndpoint,
      errors: {
        ...(wellKnownErrorToStore &&
          { clientWellKnown: wellKnownErrorToStore }),
        ...(versionsErrorToStore && { versions: versionsErrorToStore }),
      },
      loading: false,
    };
  } finally {
    currentFetchPromise = null;
  }
}

/**
 * Helper function to try fetching and parsing the versions endpoint
 */
async function tryFetchVersions(
  versionsUrl: string,
): Promise<
  | { versions: VersionsResponse; error: undefined }
  | { versions: null; error: MatrixError }
> {
  const { response: versionsResp, error: versionsError } =
    await fetchWithTimeout(versionsUrl, 10000);

  if (versionsError) {
    return { versions: null, error: versionsError };
  }

  if (!versionsResp || !versionsResp.ok) {
    const text = versionsResp ? await versionsResp.text().catch(() => "") : "";
    const error = versionsResp
      ? createHTTPError(versionsResp, versionsUrl, text)
      : {
        type: ErrorType.UNKNOWN,
        message: "errors.unknown_error",
        endpoint: versionsUrl,
      };
    return { versions: null, error };
  }

  // Validate Content-Type for versions
  const versionsContentTypeError = validateContentType(versionsResp);
  if (versionsContentTypeError) {
    versionsContentTypeError.endpoint = versionsUrl;
    return { versions: null, error: versionsContentTypeError };
  }

  // Parse versions JSON
  const versionsText = await versionsResp.text();
  let versions: VersionsResponse;
  try {
    versions = JSON.parse(versionsText);
  } catch (e) {
    const error = createJSONParseError(e, versionsUrl, versionsText);
    return { versions: null, error };
  }

  if (!versions.versions || !Array.isArray(versions.versions)) {
    return {
      versions: null,
      error: {
        type: ErrorType.INVALID_RESPONSE,
        message: "errors.invalid_response",
        technicalDetails: 'Missing or invalid "versions" array',
        endpoint: versionsUrl,
      },
    };
  }

  return { versions, error: undefined };
}
