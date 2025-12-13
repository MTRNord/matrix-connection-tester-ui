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
        // Helper function to redact URLs
        const redactUrl = (urlString: string): string => {
          try {
            const url = new URL(urlString);
            // Redact serverName query parameter
            if (url.searchParams.has("serverName")) {
              url.searchParams.set("serverName", "[redacted]");
            }
            // Redact Matrix server domains from the URL path
            if (
              url.pathname.includes("/_matrix/") ||
              url.pathname.includes("/.well-known/")
            ) {
              url.hostname = "[redacted]";
            }
            return url.toString();
          } catch (_e) {
            // If URL parsing fails, try to redact common patterns in the string
            return urlString
              .replace(
                /https?:\/\/[^\/\s]+\/_matrix/g,
                "https://[redacted]/_matrix",
              )
              .replace(
                /https?:\/\/[^\/\s]+\/\.well-known/g,
                "https://[redacted]/.well-known",
              )
              .replace(/serverName=[^&\s]+/g, "serverName=[redacted]");
          }
        };

        // Filter out sensitive information from request
        if (event.request) {
          // Remove sensitive headers
          if (event.request.headers) {
            delete event.request.headers["Authorization"];
            delete event.request.headers["Cookie"];
          }

          // Filter requests to Matrix endpoints
          if (event.request.url) {
            if (
              event.request.url.includes("/.well-known/") ||
              event.request.url.includes("/_matrix/client/versions")
            ) {
              return null;
            }
            event.request.url = redactUrl(event.request.url);
          }
        }

        // Filter spans
        if (event.spans) {
          event.spans = event.spans.filter((span) => {
            // Drop spans for Matrix API endpoints we're testing
            if (span.description) {
              if (
                span.description.includes("/_matrix/client/versions") ||
                span.description.includes("/.well-known/matrix/")
              ) {
                return false;
              }
            }
            return true;
          }).map((span) => {
            // Redact data fields
            if (span.data) {
              if (span.data.url) {
                span.data.url = redactUrl(span.data.url as string);
              }
              if (span.data.server_address) {
                span.data.server_address = "[redacted]";
              }
              if (span.data.host) {
                span.data.host = "[redacted]";
              }
              if (span.data["network.peer.address"]) {
                span.data["network.peer.address"] = "[redacted]";
              }
              if (span.data["http.url"]) {
                span.data["http.url"] = redactUrl(
                  span.data["http.url"] as string,
                );
              }
              if (
                span.data["http.target"] &&
                typeof span.data["http.target"] === "string"
              ) {
                const target = span.data["http.target"] as string;
                if (target.includes("serverName=")) {
                  span.data["http.target"] = target.replace(
                    /serverName=[^&\s]+/g,
                    "serverName=[redacted]",
                  );
                }
              }
              if (span.data["server.address"]) {
                span.data["server.address"] = "[redacted]";
              }
            }

            // Redact description
            if (span.description) {
              span.description = redactUrl(span.description);
            }

            return span;
          });
        }

        // Filter breadcrumbs
        if (event.breadcrumbs) {
          event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
            if (breadcrumb.data) {
              if (breadcrumb.data.url) {
                breadcrumb.data.url = redactUrl(breadcrumb.data.url as string);
              }
              if (
                breadcrumb.data.to && typeof breadcrumb.data.to === "string"
              ) {
                breadcrumb.data.to = redactUrl(breadcrumb.data.to);
              }
              if (
                breadcrumb.data.from && typeof breadcrumb.data.from === "string"
              ) {
                breadcrumb.data.from = redactUrl(breadcrumb.data.from);
              }
            }
            if (breadcrumb.message) {
              breadcrumb.message = redactUrl(breadcrumb.message);
            }
            return breadcrumb;
          });
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
