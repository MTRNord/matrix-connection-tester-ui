/**
 * Shared state for client-server API checks using Preact signals
 * This allows multiple islands to share the same data without duplicate fetches
 */

import { computed, signal } from "@preact/signals";
import type { MatrixError } from "./errors.ts";

// ---------------------------------------------------------------------------
// Lazy config cache
// ---------------------------------------------------------------------------

/** Timeout for well-known and versions fetches (spec-required endpoints). */
const CLIENT_FETCH_TIMEOUT_MS = 10_000;
/** Timeout for optional capability probes (RTC transports, MSC3266). */
const PROBE_TIMEOUT_MS = 5_000;

let _configCache: { allowHttp: boolean } | null = null;

async function _getScheme(): Promise<string> {
  if (_configCache) {
    return _configCache.allowHttp ? "http" : "https";
  }
  try {
    const resp = await fetch("/config.json");
    const cfg = await resp.json();
    _configCache = { allowHttp: !!(cfg.allow_http) };
  } catch {
    _configCache = { allowHttp: false };
  }
  return _configCache.allowHttp ? "http" : "https";
}
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

interface RtcTransport {
  type: string;
  [key: string]: unknown;
}

interface RtcTransportsResponse {
  rtc_transports: RtcTransport[];
}

interface ClientServerState {
  clientWellKnown: ClientWellKnownResp | null;
  versions: VersionsResponse | null;
  discoveredEndpoint: string | null;
  rtcTransports: RtcTransportsResponse | null;
  rtcTransportsEndpoint: string | null;
  /** null = probe not yet done or inconclusive, true/false = definitive result */
  msc3266Supported: boolean | null;
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
  rtcTransports: null,
  rtcTransportsEndpoint: null,
  msc3266Supported: null,
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

// Check if all errors are just warnings (not hard errors)
export const clientServerHasOnlyWarnings = computed(() => {
  const errors = clientServerState.value.errors;
  const hasClientWellKnownError = !!errors.clientWellKnown;
  const hasVersionsError = !!errors.versions;

  // If no errors at all, return false
  if (!hasClientWellKnownError && !hasVersionsError) return false;

  // Check if all present errors are warnings
  const clientWellKnownIsWarning = !hasClientWellKnownError ||
    errors.clientWellKnown?.isWarning === true;
  const versionsIsWarning = !hasVersionsError ||
    errors.versions?.isWarning === true;

  return clientWellKnownIsWarning && versionsIsWarning;
});

export const clientServerStatus = computed<
  "loading" | "success" | "warning" | "error"
>(
  () => {
    const state = clientServerState.value;
    if (state.loading) return "loading";
    if (!state.errors.clientWellKnown && !state.errors.versions) {
      return "success";
    }
    if (clientServerHasOnlyWarnings.value) {
      return "warning";
    }
    return "error";
  },
);

export const clientServerSuccessful = computed(() =>
  clientServerStatus.value === "success"
);

export const rtcTransportsResult = computed(() =>
  clientServerState.value.rtcTransports
);

export const rtcTransportsEndpointUrl = computed(() =>
  clientServerState.value.rtcTransportsEndpoint
);

export const msc3266SupportedResult = computed(() =>
  clientServerState.value.msc3266Supported
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
    // Determine scheme once upfront; https is the spec default, http only when allow_http
    // is set in config.json (intranet / lab deployments).
    const scheme = await _getScheme();

    // Step 1: Fetch /.well-known/matrix/client
    const wellKnownUrl = `${scheme}://${serverName}/.well-known/matrix/client`;
    const { response: wellKnownResp, error: wellKnownError } =
      await fetchWithTimeout(wellKnownUrl, CLIENT_FETCH_TIMEOUT_MS);

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
      // Note: Content-Type errors are treated as warnings for client well-known
      // because MSC2499 proposes relaxing this requirement and many servers
      // already work fine without strict application/json content type.
      const contentTypeError = validateContentType(wellKnownResp);
      let contentTypeWarning: MatrixError | undefined = undefined;
      if (contentTypeError) {
        // Store as a warning, not a hard error - continue parsing
        contentTypeError.endpoint = wellKnownUrl;
        contentTypeError.type = ErrorType.CONTENT_TYPE_WARNING;
        contentTypeError.isWarning = true;
        contentTypeError.message = "errors.wrong_content_type_warning";
        contentTypeWarning = contentTypeError;
      }

      // Parse well-known JSON regardless of content type (per MSC2499)
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
          // If parsing succeeded but we had a content type issue, store it as a warning
          if (contentTypeWarning) {
            wellKnownErrorToStore = contentTypeWarning;
          }
        }
      } catch (e) {
        wellKnownErrorToStore = createJSONParseError(
          e,
          wellKnownUrl,
          wellKnownText,
        );
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
      const directVersionsUrl =
        `${scheme}://${serverName}/_matrix/client/versions`;
      const result = await tryFetchVersions(directVersionsUrl);

      if (result.versions) {
        versions = result.versions;
        // If we succeeded with direct endpoint but well-known failed, update discovered endpoint
        if (!homeserverBaseUrl) {
          discoveredEndpoint = `${scheme}://${serverName}`;
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

    // Step 3: Fetch /rtc/transports — stable v1 endpoint first, then unstable prefix
    let rtcTransports: RtcTransportsResponse | null = null;
    let rtcTransportsEndpoint: string | null = null;
    const rtcBaseUrl = discoveredEndpoint || `https://${serverName}`;
    const stableRtcUrl = `${rtcBaseUrl}/_matrix/client/v1/rtc/transports`;
    const { response: stableRtcResp } = await fetchWithTimeout(
      stableRtcUrl,
      PROBE_TIMEOUT_MS,
    );
    if (stableRtcResp?.ok) {
      try {
        const json = await stableRtcResp.json();
        if (json && Array.isArray(json.rtc_transports)) {
          rtcTransports = json as RtcTransportsResponse;
          rtcTransportsEndpoint = stableRtcUrl;
        }
      } catch { /* ignore parse errors */ }
    } else {
      const unstableRtcUrl =
        `${rtcBaseUrl}/_matrix/client/unstable/org.matrix.msc4143/rtc/transports`;
      const { response: unstableRtcResp } = await fetchWithTimeout(
        unstableRtcUrl,
        PROBE_TIMEOUT_MS,
      );
      if (unstableRtcResp?.ok) {
        try {
          const json = await unstableRtcResp.json();
          if (json && Array.isArray(json.rtc_transports)) {
            rtcTransports = json as RtcTransportsResponse;
            rtcTransportsEndpoint = unstableRtcUrl;
          }
        } catch { /* ignore parse errors */ }
      }
    }

    // Step 4: Probe /_matrix/client/v1/room_summary/ to check MSC3266 support.
    // Use a dummy room ID — the goal is to distinguish M_UNRECOGNIZED (endpoint absent)
    // from M_NOT_FOUND / 401 / 403 (endpoint exists, room just not found or access denied).
    let msc3266Supported: boolean | null = null;
    const probeBase = discoveredEndpoint || `https://${serverName}`;
    const probeRoomId = encodeURIComponent(`!probe:${serverName}`);
    const msc3266Url =
      `${probeBase}/_matrix/client/v1/room_summary/${probeRoomId}`;
    const { response: msc3266Resp } = await fetchWithTimeout(
      msc3266Url,
      PROBE_TIMEOUT_MS,
    );
    if (msc3266Resp) {
      if (
        msc3266Resp.status === 200 || msc3266Resp.status === 401 ||
        msc3266Resp.status === 403
      ) {
        msc3266Supported = true;
      } else if (msc3266Resp.status === 404) {
        try {
          const json = await msc3266Resp.json();
          // M_UNRECOGNIZED means the endpoint doesn't exist at all
          msc3266Supported = json?.errcode !== "M_UNRECOGNIZED";
        } catch {
          msc3266Supported = null;
        }
      }
    }

    // Update state with all results
    clientServerState.value = {
      ...clientServerState.value,
      clientWellKnown,
      versions,
      discoveredEndpoint,
      rtcTransports,
      rtcTransportsEndpoint,
      msc3266Supported,
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
    await fetchWithTimeout(versionsUrl, CLIENT_FETCH_TIMEOUT_MS);

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
