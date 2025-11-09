/**
 * Error types and utilities for Matrix connectivity testing
 * Provides user-friendly error messages with technical details
 */

export enum ErrorType {
  CORS = "cors",
  CORS_PREFLIGHT = "cors_preflight",
  NETWORK = "network",
  TLS_ERROR = "tls_error",
  JSON_PARSE = "json_parse",
  CONTENT_TYPE = "content_type",
  NOT_FOUND = "not_found",
  SERVER_ERROR = "server_error",
  TIMEOUT = "timeout",
  INVALID_RESPONSE = "invalid_response",
  MISSING_FIELD = "missing_field",
  UNKNOWN = "unknown",
}

export interface MatrixError {
  type: ErrorType;
  message: string;
  technicalDetails?: string;
  endpoint?: string;
  httpStatus?: number;
  responseHeaders?: Record<string, string>;
  originalError?: Error;
}

/**
 * Detect CORS errors from fetch failures
 */
export function isCORSError(error: unknown): boolean {
  if (error instanceof TypeError) {
    const message = error.message.toLowerCase();
    return (
      message.includes("cors") ||
      message.includes("network") ||
      message.includes("failed to fetch")
    );
  }
  return false;
}

/**
 * Detect TLS/Certificate errors from fetch failures
 */
export function isTLSError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("tls error") ||
      message.includes("certificate") ||
      message.includes("unknownissuer") ||
      message.includes("unknown issuer") ||
      message.includes("self-signed") ||
      message.includes("cert") ||
      message.includes("ssl")
    );
  }
  return false;
}

/**
 * Check if response has correct Content-Type
 */
export function validateContentType(
  response: Response,
  expectedType: string = "application/json",
): MatrixError | null {
  const contentType = response.headers.get("content-type");

  if (!contentType) {
    return {
      type: ErrorType.CONTENT_TYPE,
      message: "errors.missing_content_type",
      technicalDetails: "Response missing Content-Type header",
      responseHeaders: Object.fromEntries(response.headers.entries()),
      httpStatus: response.status,
    };
  }

  if (!contentType.includes(expectedType)) {
    return {
      type: ErrorType.CONTENT_TYPE,
      message: "errors.wrong_content_type",
      technicalDetails: `Expected ${expectedType}, got ${contentType}`,
      responseHeaders: Object.fromEntries(response.headers.entries()),
      httpStatus: response.status,
    };
  }

  return null;
}

/**
 * Create a MatrixError from a fetch error
 */
export function createFetchError(
  error: unknown,
  endpoint: string,
): MatrixError {
  if (isTLSError(error)) {
    return {
      type: ErrorType.TLS_ERROR,
      message: "errors.tls_error",
      technicalDetails: error instanceof Error ? error.message : String(error),
      endpoint,
      originalError: error instanceof Error ? error : undefined,
    };
  }

  if (isCORSError(error)) {
    return {
      type: ErrorType.CORS,
      message: "errors.cors_error",
      technicalDetails: error instanceof Error ? error.message : String(error),
      endpoint,
      originalError: error instanceof Error ? error : undefined,
    };
  }

  if (error instanceof Error && error.name === "AbortError") {
    return {
      type: ErrorType.TIMEOUT,
      message: "errors.timeout_error",
      technicalDetails: "Request timed out",
      endpoint,
      originalError: error,
    };
  }

  return {
    type: ErrorType.NETWORK,
    message: "errors.network_error",
    technicalDetails: error instanceof Error ? error.message : String(error),
    endpoint,
    originalError: error instanceof Error ? error : undefined,
  };
}

/**
 * Create a MatrixError from an HTTP response
 */
export function createHTTPError(
  response: Response,
  endpoint: string,
  body?: string,
): MatrixError {
  const status = response.status;

  if (status === 404) {
    return {
      type: ErrorType.NOT_FOUND,
      message: "errors.not_found",
      technicalDetails: `Endpoint ${endpoint} returned 404`,
      endpoint,
      httpStatus: status,
      responseHeaders: Object.fromEntries(response.headers.entries()),
    };
  }

  if (status >= 500) {
    return {
      type: ErrorType.SERVER_ERROR,
      message: "errors.server_error",
      technicalDetails: body || `Server returned ${status}`,
      endpoint,
      httpStatus: status,
      responseHeaders: Object.fromEntries(response.headers.entries()),
    };
  }

  return {
    type: ErrorType.UNKNOWN,
    message: "errors.http_error",
    technicalDetails: body || `HTTP ${status}`,
    endpoint,
    httpStatus: status,
    responseHeaders: Object.fromEntries(response.headers.entries()),
  };
}

/**
 * Create a MatrixError from a JSON parse error
 */
export function createJSONParseError(
  error: unknown,
  endpoint: string,
  responseText?: string,
): MatrixError {
  return {
    type: ErrorType.JSON_PARSE,
    message: "errors.json_parse_error",
    technicalDetails: `Failed to parse JSON: ${
      error instanceof Error ? error.message : String(error)
    }${responseText ? `\nResponse: ${responseText.substring(0, 200)}` : ""}`,
    endpoint,
    originalError: error instanceof Error ? error : undefined,
  };
}

/**
 * Validate that a response contains required fields
 */
export function validateRequiredFields<T>(
  data: unknown,
  requiredFields: string[],
  endpoint: string,
): { data: T; error: null } | { data: null; error: MatrixError } {
  if (!data || typeof data !== "object") {
    return {
      data: null,
      error: {
        type: ErrorType.INVALID_RESPONSE,
        message: "errors.invalid_response",
        technicalDetails: "Response is not an object",
        endpoint,
      },
    };
  }

  const missingFields = requiredFields.filter(
    (field) => !(field in (data as Record<string, unknown>)),
  );

  if (missingFields.length > 0) {
    return {
      data: null,
      error: {
        type: ErrorType.MISSING_FIELD,
        message: "errors.missing_field",
        technicalDetails: `Missing required fields: ${
          missingFields.join(", ")
        }`,
        endpoint,
      },
    };
  }

  return { data: data as T, error: null };
}

/**
 * Fetch with timeout and error handling
 */
export async function fetchWithTimeout(
  url: string,
  timeout: number = 10000,
): Promise<
  { response: Response; error: null } | { response: null; error: MatrixError }
> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      // Don't send credentials to avoid CORS issues
      credentials: "omit",
    });
    clearTimeout(timeoutId);
    return { response, error: null };
  } catch (error) {
    clearTimeout(timeoutId);
    return { response: null, error: createFetchError(error, url) };
  }
}

/**
 * Get user-friendly error message key based on error type
 */
export function getErrorMessageKey(error: MatrixError): string {
  return error.message;
}

/**
 * Check CORS preflight (OPTIONS request) support
 * This is required for browser-based Matrix clients
 */
export async function checkCORSPreflight(
  url: string,
  timeout: number = 10000,
): Promise<
  { supported: boolean; error: null } | { supported: false; error: MatrixError }
> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: "OPTIONS",
      signal: controller.signal,
      credentials: "omit",
      headers: {
        "Origin": "https://example.com",
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "content-type",
      },
    });
    clearTimeout(timeoutId);

    // Check if the response status is acceptable (200, 204 are typical for OPTIONS)
    // Some servers return 404 or other errors for OPTIONS, which means CORS preflight is not configured
    if (response.status >= 400) {
      return {
        supported: false,
        error: {
          type: ErrorType.CORS_PREFLIGHT,
          message: "errors.cors_preflight_error",
          technicalDetails:
            `OPTIONS request returned HTTP ${response.status}. The server may not be configured to handle CORS preflight requests.`,
          endpoint: url,
          httpStatus: response.status,
          responseHeaders: Object.fromEntries(response.headers.entries()),
        },
      };
    }

    // Check if CORS headers are present
    const allowOrigin = response.headers.get("access-control-allow-origin");
    const allowMethods = response.headers.get("access-control-allow-methods");

    if (!allowOrigin || allowOrigin === "null") {
      const headers = Object.fromEntries(response.headers.entries());
      const headersList = Object.entries(headers)
        .map(([key, value]) => `  ${key}: ${value}`)
        .join("\n");
      return {
        supported: false,
        error: {
          type: ErrorType.CORS_PREFLIGHT,
          message: "errors.cors_preflight_error",
          technicalDetails:
            `The server does not respond with proper Access-Control-Allow-Origin header for OPTIONS requests. This will prevent browser-based Matrix clients from connecting.\n\nReceived headers:\n${
              headersList || "(no headers)"
            }`,
          endpoint: url,
          httpStatus: response.status,
          responseHeaders: headers,
        },
      };
    }

    if (!allowMethods || !allowMethods.toLowerCase().includes("get")) {
      const headers = Object.fromEntries(response.headers.entries());
      const headersList = Object.entries(headers)
        .map(([key, value]) => `  ${key}: ${value}`)
        .join("\n");
      return {
        supported: false,
        error: {
          type: ErrorType.CORS_PREFLIGHT,
          message: "errors.cors_preflight_error",
          technicalDetails:
            `The server does not allow GET method in Access-Control-Allow-Methods header. This will prevent browser-based Matrix clients from connecting.\n\nReceived headers:\n${
              headersList || "(no headers)"
            }\n\nAccess-Control-Allow-Methods: ${
              allowMethods || "(not present)"
            }`,
          endpoint: url,
          httpStatus: response.status,
          responseHeaders: headers,
        },
      };
    }

    return { supported: true, error: null };
  } catch (error) {
    clearTimeout(timeoutId);

    // Network errors during preflight indicate CORS is not configured
    return {
      supported: false,
      error: {
        type: ErrorType.CORS_PREFLIGHT,
        message: "errors.cors_preflight_error",
        technicalDetails: error instanceof Error
          ? `OPTIONS request failed: ${error.message}. The server may not be configured to handle CORS preflight requests.`
          : "OPTIONS request failed. The server may not be configured to handle CORS preflight requests.",
        endpoint: url,
        originalError: error instanceof Error ? error : undefined,
      },
    };
  }
}

/**
 * Get technical error details for display
 */
export function getTechnicalDetails(error: MatrixError): string {
  const parts: string[] = [];

  if (error.endpoint) {
    parts.push(`Endpoint: ${error.endpoint}`);
  }

  if (error.httpStatus) {
    parts.push(`HTTP Status: ${error.httpStatus}`);
  }

  if (error.technicalDetails) {
    parts.push(error.technicalDetails);
  }

  if (error.responseHeaders) {
    const headers = Object.entries(error.responseHeaders)
      .map(([key, value]) => `  ${key}: ${value}`)
      .join("\n");
    parts.push(`Response Headers:\n${headers}`);
  }

  return parts.join("\n\n");
}
