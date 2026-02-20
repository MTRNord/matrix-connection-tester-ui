import { trace, Tracer } from "@opentelemetry/api";
function getPackageName() {
  // Read from deno.json
  const pkg = JSON.parse(Deno.readTextFileSync("deno.json"));
  return pkg.name;
}

function getPackageVersion() {
  // Read from deno.json
  const pkg = JSON.parse(Deno.readTextFileSync("deno.json"));
  return pkg.version;
}

export function getTracer(): Tracer {
  const tracer = trace.getTracer(getPackageName(), getPackageVersion());
  return tracer;
}

export function fetchWithTrace(
  req: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const span = trace.getActiveSpan();
  if (!span) {
    console.warn("No active span found");
    return fetch(req, { ...init });
  }
  const spanContext = span.spanContext();

  let tracestateVal: string | undefined = undefined;
  const rawTraceState = spanContext.traceState;
  if (rawTraceState) {
    console.log(rawTraceState);
    tracestateVal = rawTraceState.serialize();
  }

  if (req instanceof Request) {
    if (tracestateVal) {
      req.headers.set("tracestate", tracestateVal);
    }
    return fetch(req, { ...init });
  } else {
    const headers = new Headers(init?.headers);
    if (tracestateVal) headers.set("tracestate", tracestateVal);
    return fetch(req, { ...init, headers });
  }
}
