import knownServers from "../data/knownServers.json" with { type: "json" };
import unstableFeatures from "../data/unstableFeatures.json" with {
  type: "json",
};
import { ConnectivityReportsSection } from "./connectivity-reports/section.tsx";
import { ServerResolutionResultsSection } from "./server-resolution/section.tsx";
import { FederationProblems } from "./federation-problems.tsx";
import SupportInfo from "../islands/support-info.tsx";
import SupportProblems from "../islands/support-problems.tsx";
import ClientServerAPITasks from "../islands/client-server-api-tasks.tsx";
import ClientServerProblems from "../islands/client-server-problems.tsx";
import MatrixRtcTasks from "../islands/matrixrtc-tasks.tsx";
import CombinedStatusBanner from "../islands/combined-status-banner.tsx";
import RawDataSection from "../islands/raw-data-section.tsx";
import type { I18n } from "../lib/i18n.ts";
import type { APIResponseType } from "../routes/results.tsx";

interface ResultsViewProps {
  data: APIResponseType;
  serverName: string;
  i18n: I18n;
  baseUrl: string;
}

/** Map a server maturity label to its GOV.UK tag colour modifier. */
function getTagClass(maturity: string): string {
  switch (maturity.toLowerCase()) {
    case "stable":
      return "green";
    case "beta":
      return "blue";
    case "alpha":
      return "yellow";
    case "experimental":
      return "red";
    default:
      return "grey";
  }
}

export function ResultsView(
  { data, serverName, i18n, baseUrl }: ResultsViewProps,
) {
  const successful_federation = data?.FederationOK ?? false;
  const server_type = data?.Version?.name ?? "";
  const server_version = data?.Version?.version ?? "";
  const server_info =
    (knownServers as unknown as Record<string, { url?: string; maturity: string }>)[
      server_type.toLowerCase()
    ] ?? null;
  const discovered_ips = data?.DNSResult?.Addrs ?? [];

  const hasWellKnownErrors = data?.WellKnownResult &&
    Object.values(data.WellKnownResult).some((result) => result.Error);

  const hasConnectionErrors = !!(
    data?.ConnectionErrors && Object.keys(data.ConnectionErrors).length > 0
  );

  const hasFederationWarning = !!data?.FederationWarning;

  // True if any connection report required a retry to succeed, which signals
  // transient instability that federation peers may also encounter.
  const hasRequiredRetry = data?.ConnectionReports &&
    Object.values(data.ConnectionReports).some((r) => r.RequiredRetry);

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
        <CombinedStatusBanner
          serverName={serverName}
          locale={i18n.getLocale()}
          federationSuccess={successful_federation}
          hasConnectionErrors={hasConnectionErrors}
          hasFederationWarning={hasFederationWarning}
        />

        <dl class="govuk-summary-list">
          <div class="govuk-summary-list__row">
            <dt class="govuk-summary-list__key">
              {i18n.t("results.server_type")}
            </dt>
            <dd class="govuk-summary-list__value">
              {server_info
                ? (
                  <>
                    {server_info.url
                      ? (
                        <a
                          class="govuk-link"
                          href={server_info.url}
                          rel="noopener noreferrer"
                        >
                          {server_type}
                        </a>
                      )
                      : server_type}
                    {server_version ? "@" + server_version : ""}{" "}
                    <strong
                      class={`govuk-tag govuk-tag--${
                        getTagClass(server_info.maturity)
                      }`}
                    >
                      {server_info.maturity}
                    </strong>
                  </>
                )
                : (server_type && server_version
                  ? server_type + "@" + server_version
                  : server_type || server_version ||
                    i18n.t("results.unknown"))}
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

        {/* Warn if any connection required a retry — the endpoint is unstable */}
        {hasRequiredRetry && (
          <div
            class="govuk-notification-banner govuk-notification-banner--warning"
            role="region"
            aria-labelledby="retry-warning-title"
            data-module="govuk-notification-banner"
          >
            <div class="govuk-notification-banner__header">
              <h2
                class="govuk-notification-banner__title"
                id="retry-warning-title"
              >
                {i18n.t("results.retry_warning_title")}
              </h2>
            </div>
            <div class="govuk-notification-banner__content">
              <p class="govuk-body">
                {i18n.t("results.retry_warning_body")}
              </p>
            </div>
          </div>
        )}

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
              display: (
                  !successful_federation || hasWellKnownErrors ||
                  hasConnectionErrors || hasFederationWarning ||
                  hasRequiredRetry
                )
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
              {(!successful_federation || hasWellKnownErrors ||
                hasConnectionErrors || hasFederationWarning) && (
                <FederationProblems
                  i18n={i18n}
                  apiData={data}
                  baseUrl={baseUrl}
                />
              )}

              <ClientServerProblems
                serverName={serverName}
                locale={i18n.getLocale()}
                baseUrl={baseUrl}
              />

              <SupportProblems
                serverName={serverName}
                locale={i18n.getLocale()}
                baseUrl={baseUrl}
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
                baseUrl={baseUrl}
              />
            </div>
          </div>
          <div class="govuk-accordion__section">
            <div class="govuk-accordion__section-header">
              <h2 class="govuk-accordion__section-heading">
                <span
                  class="govuk-accordion__section-button"
                  id="accordion-with-summary-sections-heading-matrixrtc"
                >
                  {i18n.t("results.matrixrtc_title")}{" "}
                  <strong class="govuk-tag govuk-tag--blue govuk-!-font-size-16">
                    {i18n.t("banner.alpha")}
                  </strong>
                </span>
              </h2>
              <div
                class="govuk-accordion__section-summary govuk-body"
                id="accordion-with-summary-sections-summary-matrixrtc"
              >
                {i18n.t("results.matrixrtc_summary")}
              </div>
            </div>
            <div
              id="accordion-with-summary-sections-content-matrixrtc"
              class="govuk-accordion__section-content"
            >
              <MatrixRtcTasks
                serverName={serverName}
                locale={i18n.getLocale()}
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
              {data?.ConnectionReports &&
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
}
