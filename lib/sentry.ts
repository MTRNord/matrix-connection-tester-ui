import * as Sentry from "@sentry/react";
import { IS_BROWSER } from "fresh/runtime";

export interface SentryConfig {
  dsn: string;
  environment?: string;
  tracesSampleRate?: number;
  replaysSessionSampleRate?: number;
  replaysOnErrorSampleRate?: number;
  appVersion?: string;
}

// Initialize Sentry without consent checks
export function initSentry(config: SentryConfig): void {
  if (!IS_BROWSER) return;

  try {
    Sentry.init({
      dsn: config.dsn,
      debug: true,
      environment: config.environment || "production",
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
        Sentry.feedbackIntegration({
          colorScheme: "system",
          showBranding: false,
        }),
      ],
      release: `matrix-connection-tester-ui@${
        config.appVersion ||
        "local"
      }`,
      tracesSampleRate: config.tracesSampleRate || 0.5,
      replaysSessionSampleRate: config.replaysSessionSampleRate || 0.5,
      replaysOnErrorSampleRate: config.replaysOnErrorSampleRate || 1.0,
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
            // This catches patterns like https://matrix.example.com/_matrix/...
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

        // Filter spans (includes browser operations and http.client)
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
            // Redact data.url for all browser operations
            if (span.data) {
              // Redact URL in data
              if (span.data.url) {
                span.data.url = redactUrl(span.data.url as string);
              }
              // Redact server_address for connect operations
              if (span.data.server_address) {
                span.data.server_address = "[redacted]";
              }
              // Redact host for DNS operations
              if (span.data.host) {
                span.data.host = "[redacted]";
              }
              // Redact network.peer.address
              if (span.data["network.peer.address"]) {
                span.data["network.peer.address"] = "[redacted]";
              }
              // Redact http.url
              if (span.data["http.url"]) {
                span.data["http.url"] = redactUrl(
                  span.data["http.url"] as string,
                );
              }
              // Redact http.target
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
              // Redact server.address
              if (span.data["server.address"]) {
                span.data["server.address"] = "[redacted]";
              }
            }

            // Redact description (contains URLs for http.client and other operations)
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
    console.log("Sentry initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Sentry:", error);
  }
}

/**
 * Add a breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  data?: Record<string, unknown>,
  category?: string,
  level?: Sentry.SeverityLevel,
): void {
  if (!IS_BROWSER) return;

  try {
    Sentry.addBreadcrumb({
      message,
      category: category || "custom",
      level: level || "info",
      data,
    });
  } catch (error) {
    console.error("Failed to add breadcrumb:", error);
  }
}

/**
 * Capture an exception in Sentry
 */
export function captureException(
  error: Error,
  context?: Record<string, unknown>,
): void {
  if (!IS_BROWSER) return;

  try {
    Sentry.withScope((scope: Sentry.Scope) => {
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setContext(key, value as Record<string, unknown>);
        });
      }
      Sentry.captureException(error);
    });
  } catch (err) {
    console.error("Failed to capture exception:", err);
  }
}

/**
 * Capture a message in Sentry
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = "info",
): void {
  if (!IS_BROWSER) return;

  try {
    Sentry.captureMessage(message, level);
  } catch (error) {
    console.error("Failed to capture message:", error);
  }
}
