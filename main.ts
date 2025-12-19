import { App, csrf, staticFiles } from "fresh";
import { State } from "./utils.ts";

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
