import { define } from "../utils.ts";
import { getConfig } from "../lib/api.ts";
import { page } from "fresh";
import { fetchWithTrace, getTracer } from "../lib/tracing.ts";
import { SpanStatusCode } from "@opentelemetry/api";
import { ResultsView } from "../components/ResultsView.tsx";

export interface ConnectionReport {
  Certificates: {
    DNSNames: string[];
    IssuerCommonName: string;
    SHA256Fingerprint: string;
    SubjectCommonName: string;
  }[];
  Checks: {
    AllChecksOK: boolean;
    AllEd25519ChecksOK: boolean;
    Ed25519Checks: Record<string, {
      MatchingSignature: boolean;
      ValidEd25519: boolean;
    }>;
    FutureValidUntilTS: boolean;
    HasEd25519Key: boolean;
    MatchingServerName: boolean;
    ServerVersionParses: boolean;
    ValidCertificates: boolean;
  };
  Cipher: {
    CipherSuite: string;
    Version: string;
  };
  Ed25519VerifyKeys: Record<string, string>;
  Keys: {
    old_verify_keys: Record<string, { key: string; expires_ts: number }>;
    server_name: string;
    signatures: Record<string, Record<string, string>>;
    valid_until_ts: number;
    verify_keys: Record<string, { key: string; expires_ts: number }>;
  };
  Version: {
    name: string;
    version: string;
  };
  RequiredRetry?: boolean;
}

export interface APIResponseType {
  ServerName?: string;
  ConnectionReports?: Record<string, ConnectionReport>;
  ConnectionErrors?: Record<string, {
    Error: string;
    ErrorCode: string;
  }>;
  DNSResult: {
    Addrs: string[];
    SRVSkipped: boolean;
    SrvTargets?: Record<string, {
      Addrs?: string[];
      Port: number;
      Target: string;
      Priority?: number;
      Weight?: number;
    }[]>;
  };
  Version: {
    name: string;
    version: string;
  };
  WellKnownResult?: Record<string, {
    CacheExpiresAt: string | number;
    "m.server": string;
    Error?: {
      Error: string;
      ErrorCode: {
        NotOk?: string;
      };
    };
    /** The connection addresses the backend actually used for this IP after the
     * well-known phase. If well-known succeeded these are the resolved IPs of
     * the delegated m.server; if it failed this is the single :8448 address for
     * this IP. Absent when the per-IP path was not taken. */
    ConnectionAddresses?: string[];
  }>;
  Error?: {
    Error: string;
    ErrorCode: string;
  };
  FederationOK: boolean;
  FederationWarning?: boolean;
}

export const handler = define.handlers({
  async GET(ctx) {
    const tracer = getTracer();
    return await tracer.startActiveSpan(
      "get data for results",
      async (parentSpan) => {
        parentSpan.setAttribute(
          "serverName",
          ctx.url.searchParams.get("serverName")!,
        );
        parentSpan.setAttribute(
          "statistics",
          ctx.url.searchParams.get("statistics")!,
        );
        parentSpan.setAttribute(
          "no_cache",
          ctx.url.searchParams.get("no_cache")!,
        );
        parentSpan.setAttribute(
          "user_agent",
          ctx.req.headers.get("user-agent")!,
        );

        const url = ctx.url;
        try {
          const apiConfig = await getConfig(
            `${url.protocol}//${url.host}`,
          );

          return await tracer.startActiveSpan(
            "access federation report api",
            async (parentSpan) => {
              const serverName = url.searchParams.get("serverName");
              if (!serverName) {
                // Redirect to home if no serverName is provided
                return Response.redirect(
                  `${url.protocol}//${url.host}/`,
                  302,
                );
              }

              const statisticsOptIn: boolean =
                url.searchParams.get("statistics") === "opt-in";
              const apiUrl = `${
                (apiConfig ?? {}).api_server_url ?? "localhost"
              }/api/federation/report?server_name=${
                encodeURIComponent(serverName)
              }&stats_opt_in=${statisticsOptIn.toString()}&no_cache=true`;

              try {
                const apiResp = await fetchWithTrace(apiUrl);
                try {
                  const apiData = await apiResp.json();
                  parentSpan.addEvent("received_api_response", {
                    status: apiResp.status,
                    timestamp: Date.now(),
                  });
                  return page({
                    data: apiData,
                    serverName,
                  });
                } catch (error) {
                  console.error("Error parsing API response JSON:", error);
                  if (error instanceof Error) {
                    parentSpan.recordException(error);
                  }
                  parentSpan.setStatus({
                    code: SpanStatusCode.ERROR,
                    message: error instanceof Error
                      ? error.message
                      : String(error),
                  });
                  return new Response(
                    ctx.state.i18n.tString("errors.missing_api_config"),
                    {
                      status: 500,
                    },
                  );
                }
              } catch (error) {
                console.error("Error fetching API data:", error);
                if (error instanceof Error) {
                  parentSpan.recordException(error);
                }
                parentSpan.setStatus({
                  code: SpanStatusCode.ERROR,
                  message: error instanceof Error
                    ? error.message
                    : String(error),
                });
                return new Response(
                  ctx.state.i18n.tString("errors.missing_api_config"),
                  {
                    status: 500,
                  },
                );
              } finally {
                parentSpan.end();
              }
            },
          );
        } catch (error) {
          console.error("Error fetching API config:", error);
          if (error instanceof Error) {
            parentSpan.recordException(error);
          }
          parentSpan.setStatus({
            code: SpanStatusCode.ERROR,
            message: error instanceof Error ? error.message : String(error),
          });
          return new Response(
            ctx.state.i18n.tString("errors.missing_api_config"),
            {
              status: 500,
            },
          );
        } finally {
          parentSpan.end();
        }
      },
    );
  },
});

export default define.page<typeof handler>(function Results(ctx) {
  const data: APIResponseType = ctx.data?.data;
  const serverName: string = data?.ServerName ?? ctx.data?.serverName;
  return (
    <ResultsView
      data={data}
      serverName={serverName}
      i18n={ctx.state.i18n}
      baseUrl={ctx.url.origin}
    />
  );
});
