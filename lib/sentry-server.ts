import * as Sentry from "@sentry/deno";

let sentryInitialized = false;

export interface SentryServerConfig {
  dsn: string;
  environment?: string;
  tracesSampleRate?: number;
  serverName?: string;
}

/**
 * Initialize Sentry for server-side error tracking
 * This should be called once during server startup
 */
export function initSentryServer(config: SentryServerConfig): void {
  if (sentryInitialized) {
    console.log("Sentry server already initialized");
    return;
  }

  try {
    Sentry.init({
      dsn: config.dsn,
      debug: true,
      environment: config.environment || "production",
      tracesSampleRate: config.tracesSampleRate || 0.5,
      serverName: config.serverName,
      integrations: [
        // Add Deno-specific integrations
        Sentry.denoContextIntegration(),
      ],
      release: `matrix-connection-tester-ui@${
        Deno.env.get("FRESH_PUBLIC_APP_VERSION") ||
        "local"
      }`,
      beforeSend(event, _hint) {
        // Filter out sensitive information
        if (event.request) {
          // Remove sensitive headers
          if (event.request.headers) {
            delete event.request.headers["Authorization"];
            delete event.request.headers["Cookie"];
          }
          // Remove client side requests to well-known and version endpoints
          if (event.request.url) {
            if (
              event.request.url.includes("/.well-known/") ||
              event.request.url.endsWith("/_matrix/client/versions")
            ) {
              return null;
            }
          }
          // Remove the value of the serverName query parameter
          if (event.request.url) {
            try {
              const url = new URL(event.request.url);
              if (url.searchParams.has("serverName")) {
                url.searchParams.set("serverName", "[redacted]");
                event.request.url = url.toString();
              }
            } catch (_e) {
              // Ignore URL parsing errors
            }
          }
        }
        return event;
      },
    });

    sentryInitialized = true;
    console.log("Sentry server initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Sentry server:", error);
  }
}

/**
 * Capture an exception in Sentry
 */
export function captureException(
  error: Error,
  context?: Record<string, unknown>,
): void {
  if (!sentryInitialized) {
    console.error("Sentry not initialized, error not captured:", error);
    return;
  }

  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value as Record<string, unknown>);
      });
    }
    Sentry.captureException(error);
  });
}

/**
 * Capture a message in Sentry
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = "info",
): void {
  if (!sentryInitialized) {
    console.log("Sentry not initialized, message not captured:", message);
    return;
  }

  Sentry.captureMessage(message, level);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
  if (!sentryInitialized) {
    return;
  }

  Sentry.addBreadcrumb(breadcrumb);
}

/**
 * Check if Sentry is initialized
 */
export function isSentryInitialized(): boolean {
  return sentryInitialized;
}
