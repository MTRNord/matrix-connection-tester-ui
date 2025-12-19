/**
 * Shared state for support info checks using Preact signals
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

interface SupportContact {
  matrix_id?: string;
  email_address?: string;
  role: string;
}

interface SupportInfo {
  contacts?: SupportContact[];
  support_page?: string;
}

interface SupportState {
  supportInfo: SupportInfo | null;
  error: MatrixError | null;
  loading: boolean;
  serverName: string | null;
}

const initialState: SupportState = {
  supportInfo: null,
  error: null,
  loading: false,
  serverName: null,
};

export const supportState = signal<SupportState>(initialState);

// Computed signals for common derived state
export const supportLoading = computed(() => supportState.value.loading);

export const supportError = computed(() => supportState.value.error);

export const supportInfo = computed(() => supportState.value.supportInfo);

export const supportHasError = computed(() => !!supportState.value.error);

export const supportHasContacts = computed(() => {
  const info = supportState.value.supportInfo;
  return !!(info?.contacts && info.contacts.length > 0);
});

export const supportHasSupportPage = computed(() => {
  const info = supportState.value.supportInfo;
  return !!(info?.support_page && info.support_page.length > 0);
});

export const supportHasAnyInfo = computed(() =>
  supportHasContacts.value || supportHasSupportPage.value
);

// Track in-flight requests to prevent duplicate fetches
let currentFetchPromise: Promise<void> | null = null;

/**
 * Fetch support information
 * Uses a singleton pattern to prevent duplicate fetches
 */
export async function fetchSupportInfo(serverName: string): Promise<void> {
  // If already fetching for this server, wait for that request
  if (currentFetchPromise && supportState.value.serverName === serverName) {
    return await currentFetchPromise;
  }

  // If we already have data for this server and it's not loading, return
  if (
    supportState.value.serverName === serverName &&
    !supportState.value.loading &&
    (supportState.value.supportInfo || supportState.value.error)
  ) {
    return;
  }

  // Start new fetch
  currentFetchPromise = performFetch(serverName);
  return await currentFetchPromise;
}

async function performFetch(serverName: string): Promise<void> {
  supportState.value = {
    ...initialState,
    loading: true,
    serverName,
  };

  const url = `https://${serverName}/.well-known/matrix/support`;

  try {
    // Fetch with timeout
    const { response, error: fetchError } = await fetchWithTimeout(
      url,
      10000,
    );

    if (fetchError) {
      supportState.value = {
        ...supportState.value,
        error: fetchError,
        loading: false,
      };
      return;
    }

    if (!response) {
      supportState.value = {
        ...supportState.value,
        error: {
          type: ErrorType.UNKNOWN,
          message: "errors.unknown_error",
          endpoint: url,
        },
        loading: false,
      };
      return;
    }

    // Check HTTP status
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      supportState.value = {
        ...supportState.value,
        error: createHTTPError(response, url, text),
        loading: false,
      };
      return;
    }

    // Validate Content-Type
    // Note: Content-Type errors are treated as warnings for support endpoint
    // because MSC2499 proposes relaxing this requirement and many servers
    // already work fine without strict application/json content type.
    const contentTypeError = validateContentType(response);
    let contentTypeWarning: MatrixError | undefined = undefined;
    if (contentTypeError) {
      // Store as a warning, not a hard error - continue parsing
      contentTypeError.endpoint = url;
      contentTypeError.type = ErrorType.CONTENT_TYPE_WARNING;
      contentTypeError.isWarning = true;
      contentTypeError.message = "errors.wrong_content_type_warning";
      contentTypeWarning = contentTypeError;
    }

    // Parse JSON
    let data: unknown;
    const responseText = await response.text();
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      supportState.value = {
        ...supportState.value,
        error: createJSONParseError(e, url, responseText),
        loading: false,
      };
      return;
    }

    // Validate structure (support info can be empty, but should be an object)
    if (!data || typeof data !== "object") {
      supportState.value = {
        ...supportState.value,
        error: {
          type: ErrorType.INVALID_RESPONSE,
          message: "errors.invalid_response",
          technicalDetails: "Response is not a valid JSON object",
          endpoint: url,
        },
        loading: false,
      };
      return;
    }

    // Success - but store content type warning if present
    supportState.value = {
      ...supportState.value,
      supportInfo: data as SupportInfo,
      error: contentTypeWarning || null,
      loading: false,
    };
  } catch (e) {
    // Catch any unexpected errors
    supportState.value = {
      ...supportState.value,
      error: {
        type: ErrorType.UNKNOWN,
        message: "errors.unknown_error",
        technicalDetails: e instanceof Error ? e.message : String(e),
        endpoint: url,
      },
      loading: false,
    };
  } finally {
    currentFetchPromise = null;
  }
}
