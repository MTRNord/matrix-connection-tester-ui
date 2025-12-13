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
      environment: config.environment || "production",
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
        Sentry.feedbackIntegration({
          colorScheme: "system",
        }),
      ],
      tracesSampleRate: config.tracesSampleRate || 0.1,
      replaysSessionSampleRate: config.replaysSessionSampleRate || 0.1,
      replaysOnErrorSampleRate: config.replaysOnErrorSampleRate || 1.0,
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
  if (typeof window === "undefined") return;

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
  if (typeof window === "undefined") return;

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
  if (typeof window === "undefined") return;

  try {
    Sentry.captureMessage(message, level);
  } catch (error) {
    console.error("Failed to capture message:", error);
  }
}
