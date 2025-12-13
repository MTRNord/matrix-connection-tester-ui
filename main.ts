import { App, csrf, staticFiles } from "fresh";
import { State } from "./utils.ts";
import { initSentryServer } from "./lib/sentry-server.ts";

// Initialize Sentry for server-side error tracking
const SENTRY_DSN = Deno.env.get("FRESH_PUBLIC_SENTRY_DSN");
const ENVIRONMENT = Deno.env.get("FRESH_PUBLIC_ENVIRONMENT") || "production";

if (SENTRY_DSN) {
  initSentryServer({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    tracesSampleRate: 1.0,
    serverName: "matrix-connection-tester-ui",
  });
}

export const app = new App<State>();

app.use(csrf());

// Include file-system based routes here
app.fsRoutes();
app.use(staticFiles());

// Allow indexing by every search engine
app.get("/robots.txt", () =>
  new Response("User-agent: *\nAllow: /\n", {
    headers: { "Content-Type": "text/plain" },
  }));
