// Import CSS files here for hot module reloading to work.
import "./assets/style.scss";
import "@/locales/de.json" with { type: "json" };
import "@/locales/en.json" with { type: "json" };

// Always initialize Sentry
import { initSentry } from "./lib/sentry.ts";

const SENTRY_DSN = Deno.env.get("FRESH_PUBLIC_SENTRY_DSN");
const APP_VERSION = Deno.env.get("FRESH_PUBLIC_APP_VERSION");

if (SENTRY_DSN) {
  initSentry({
    dsn: SENTRY_DSN,
    environment: Deno.env.get("FRESH_PUBLIC_ENVIRONMENT") || "production",
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 1.0,
    replaysOnErrorSampleRate: 1.0,
    appVersion: APP_VERSION,
  });
}
