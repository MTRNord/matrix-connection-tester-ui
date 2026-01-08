import { define } from "../utils.ts";
import knownServers from "../data/knownServers.json" with { type: "json" };
import unstableFeatures from "../data/unstableFeatures.json" with {
  type: "json",
};
import { ConnectivityReportsSection } from "../components/connectivity-reports/section.tsx";
import { ServerResolutionResultsSection } from "../components/server-resolution/section.tsx";
import { FederationProblems } from "../components/federation-problems.tsx";
import SupportInfo from "../islands/support-info.tsx";
import SupportProblems from "../islands/support-problems.tsx";
import ClientServerAPITasks from "../islands/client-server-api-tasks.tsx";
import ClientServerProblems from "../islands/client-server-problems.tsx";
import CombinedStatusBanner from "../islands/combined-status-banner.tsx";
import RawDataSection from "../islands/raw-data-section.tsx";
import { getConfig } from "../lib/api.ts";
import { page } from "fresh";
import { fetchWithTrace, getTracer } from "../lib/tracing.ts";
import { SpanStatusCode } from "@opentelemetry/api";

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
}

export interface APIResponseType {
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
  }>;
  FederationOK: boolean;
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
  const { i18n } = ctx.state;

  const data: APIResponseType = ctx.data?.data;
  const serverName: string = ctx.data?.serverName;

  // TODO: Handle failures. (TypeError: Cannot read properties of undefined (reading 'name'))
  const successful_federation = data.FederationOK;
  const server_type = data.Version.name;
  const server_version = data.Version.version;
  // @ts-ignore JSON import
  const server_info = knownServers[server_type.toLowerCase()] ?? null;
  const discovered_ips = data.DNSResult?.Addrs ?? [];

  // Check if there are well-known errors
  const hasWellKnownErrors = data.WellKnownResult &&
    Object.values(data.WellKnownResult).some((result) => result.Error);

  return (
    <>
      <h1 class="govuk-heading-xl">{i18n.t("results.title")}</h1>
      <p class="govuk-body">
        {i18n.t("results.intro_results")}
      </p>
      <p class="govuk-body">
        {i18n.t("results.intro_no_action")}
      </p>
      <p class="govuk-body">
        {i18n.t("results.intro_technical")}
      </p>
      <p class="govuk-body">
        {i18n.t("results.intro_check_problems")}
      </p>
      <div class="govuk-body">
        {/* Combined banner handles both federation and client-server status */}
        <CombinedStatusBanner
          serverName={serverName}
          locale={i18n.getLocale()}
          federationSuccess={successful_federation}
        />

        <dl class="govuk-summary-list">
          <div class="govuk-summary-list__row">
            <dt class="govuk-summary-list__key">
              {i18n.t("results.server_type")}
            </dt>
            <dd class="govuk-summary-list__value">
              {/* If we have more info about the server, link to its website and show the maturity as a Tag */}
              {server_info
                ? (
                  <>
                    <a
                      class="govuk-link"
                      href={server_info.url}
                      rel="noopener noreferrer"
                    >
                      {server_type}
                    </a>
                    {server_version ? "@" + server_version : ""}{" "}
                    <strong
                      class={"govuk-tag govuk-tag--" +
                        (server_info.maturity.toLowerCase() === "stable"
                          ? "green"
                          : (server_info.maturity.toLowerCase() === "beta"
                            ? "blue"
                            : (server_info.maturity.toLowerCase() === "alpha"
                              ? "yellow"
                              : (server_info.maturity.toLowerCase() ===
                                  "experimental"
                                ? "red"
                                : "grey"))))}
                    >
                      {server_info.maturity}
                    </strong>
                  </>
                )
                : (server_type && server_version
                  ? server_type + "@" + server_version
                  : server_type || server_version || i18n.t("results.unknown"))}
            </dd>
          </div>
          <div class="govuk-summary-list__row">
            <dt class="govuk-summary-list__key">
              {i18n.t("results.discovered_ips")}
            </dt>
            <dd class="govuk-summary-list__value">
              {discovered_ips.length > 0
                ? (
                  discovered_ips.map((ip) => (
                    <ul class="govuk-list govuk-list--bullet">
                      <li>
                        <code aria-label="IP address">{ip}</code>
                      </li>
                    </ul>
                  ))
                )
                : <span class="govuk-hint">{i18n.t("results.unknown")}</span>}
            </dd>
          </div>
        </dl>

        <SupportInfo
          serverName={serverName}
          locale={i18n.getLocale()}
        />

        <hr class="govuk-section-break govuk-section-break--xl govuk-section-break--visible govuk-section-break--visible--blue" />

        <div
          class="govuk-accordion"
          data-module="govuk-accordion"
          id="accordion-with-summary-sections"
        >
          <div
            class="govuk-accordion__section"
            id="problems-section"
            style={{
              display: (!successful_federation || hasWellKnownErrors)
                ? "block"
                : "none",
            }}
          >
            <div class="govuk-accordion__section-header">
              <h2 class="govuk-accordion__section-heading">
                <span
                  class="govuk-accordion__section-button"
                  id="accordion-with-summary-sections-heading-problems"
                >
                  {i18n.t("results.problems_title")}
                </span>
              </h2>
              <div
                class="govuk-accordion__section-summary govuk-body"
                id="accordion-with-summary-sections-summary-problems"
              >
                {i18n.t("results.problems_summary")}
              </div>
            </div>
            <div
              id="accordion-with-summary-sections-content-problems"
              class="govuk-accordion__section-content"
            >
              {/* Federation problems from connection reports and well-known errors */}
              {(!successful_federation || hasWellKnownErrors) && (
                <FederationProblems
                  i18n={i18n}
                  apiData={data}
                  baseUrl={ctx.url.origin}
                />
              )}

              {/* Client-Server API problems are checked client-side */}
              <ClientServerProblems
                serverName={serverName}
                locale={i18n.getLocale()}
                baseUrl={ctx.url.origin}
              />

              {/* Support information problems are checked client-side */}
              <SupportProblems
                serverName={serverName}
                locale={i18n.getLocale()}
                baseUrl={ctx.url.origin}
              />
            </div>
          </div>
          <div class="govuk-accordion__section">
            <div class="govuk-accordion__section-header">
              <h2 class="govuk-accordion__section-heading">
                <span
                  class="govuk-accordion__section-button"
                  id="accordion-with-summary-sections-heading-client-api"
                >
                  {i18n.t("results.client_server_api_title")}
                </span>
              </h2>
              <div
                class="govuk-accordion__section-summary govuk-body"
                id="accordion-with-summary-sections-summary-client-api"
              >
                {i18n.t("results.client_server_api_summary")}
              </div>
            </div>
            <div
              id="accordion-with-summary-sections-content-client-api"
              class="govuk-accordion__section-content"
            >
              <ClientServerAPITasks
                serverName={serverName}
                locale={i18n.getLocale()}
                unstableFeatures={unstableFeatures}
                baseUrl={ctx.url.origin}
              />
            </div>
          </div>
          <div class="govuk-accordion__section">
            <div class="govuk-accordion__section-header">
              <h2 class="govuk-accordion__section-heading">
                <span
                  class="govuk-accordion__section-button"
                  id="accordion-with-summary-sections-heading-2"
                >
                  {i18n.t("results.server_resolution_title")}
                </span>
              </h2>
              <div
                class="govuk-accordion__section-summary govuk-body"
                id="accordion-with-summary-sections-summary-2"
              >
                {i18n.t("results.server_resolution_summary")}{" "}
                <code>/.well-known/matrix/server</code>{" "}
                {i18n.t("results.server_resolution_summary_suffix")}
              </div>
            </div>
            <div
              id="accordion-with-summary-sections-content-2"
              class="govuk-accordion__section-content"
            >
              <ServerResolutionResultsSection i18n={i18n} apiData={data} />
            </div>
          </div>
          <div class="govuk-accordion__section">
            <div class="govuk-accordion__section-header">
              <h2 class="govuk-accordion__section-heading">
                <span
                  class="govuk-accordion__section-button"
                  id="accordion-with-summary-sections-heading-3"
                >
                  {i18n.t("results.connectivity_reports_title")}
                </span>
              </h2>
              <div
                class="govuk-accordion__section-summary govuk-body"
                id="accordion-with-summary-sections-summary-3"
              >
                {i18n.t("results.connectivity_reports_summary")}
              </div>
            </div>
            <div
              id="accordion-with-summary-sections-content-3"
              class="govuk-accordion__section-content"
            >
              {data.ConnectionReports &&
                  Object.keys(data.ConnectionReports).length > 0
                ? (
                  <ConnectivityReportsSection
                    i18n={i18n}
                    apiData={data}
                  />
                )
                : (
                  <p class="govuk-body">
                    {i18n.t("results.no_connectivity_reports")}
                  </p>
                )}
            </div>
          </div>
          <div class="govuk-accordion__section">
            <div class="govuk-accordion__section-header">
              <h2 class="govuk-accordion__section-heading">
                <span
                  class="govuk-accordion__section-button"
                  id="accordion-with-summary-sections-heading-4"
                >
                  {i18n.t("results.raw_data_title")}
                </span>
              </h2>
              <div
                class="govuk-accordion__section-summary govuk-body"
                id="accordion-with-summary-sections-summary-4"
              >
                {i18n.t("results.raw_data_summary")}
              </div>
            </div>
            <div
              id="accordion-with-summary-sections-content-4"
              class="govuk-accordion__section-content"
            >
              <RawDataSection
                serverName={serverName}
                locale={i18n.getLocale()}
                federationData={data}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
});
