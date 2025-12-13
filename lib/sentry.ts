import * as Sentry from "@sentry/react";
import { IS_BROWSER } from "fresh/runtime";

export interface SentryConfig {
  dsn: string;
  environment?: string;
  tracesSampleRate?: number;
  replaysSessionSampleRate?: number;
  replaysOnErrorSampleRate?: number;
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
      tracesSampleRate: config.tracesSampleRate || 0.5,
      replaysSessionSampleRate: config.replaysSessionSampleRate || 0.5,
      replaysOnErrorSampleRate: config.replaysOnErrorSampleRate || 1.0,
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
