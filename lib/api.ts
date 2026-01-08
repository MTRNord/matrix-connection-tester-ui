import { SpanStatusCode } from "@opentelemetry/api";
import { fetchWithTrace, getTracer } from "./tracing.ts";

interface ConfigType {
  api_server_url: string;
}

export async function getConfig(currentHost: string): Promise<ConfigType> {
  const tracer = getTracer();
  return await tracer.startActiveSpan("getConfig", async (parentSpan) => {
    if (!currentHost) {
      parentSpan.setStatus({
        code: SpanStatusCode.ERROR,
        message: "currentHost is required to fetch config",
      });
      parentSpan.end();
      throw new Error("currentHost is required to fetch config");
    }
    if (
      !currentHost.startsWith("http://") && !currentHost.startsWith("https://")
    ) {
      parentSpan.setStatus({
        code: SpanStatusCode.ERROR,
        message: "currentHost must start with http:// or https://",
      });
      parentSpan.end();
      throw new Error("currentHost must start with http:// or https://");
    }

    try {
      const response = await fetchWithTrace(`${currentHost}/config.json`);
      const config = await response.json();
      parentSpan.addEvent("received_config", {
        status: response.status,
        timestamp: Date.now(),
      });
      return config;
    } catch (error) {
      if (error instanceof Error) {
        parentSpan.recordException(error);
      }
      parentSpan.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      parentSpan.end();
    }
  });
}
