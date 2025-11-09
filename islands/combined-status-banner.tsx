import { useEffect, useMemo } from "preact/hooks";
import { I18n, type Locale } from "../lib/i18n.ts";
import {
  clientServerState,
  fetchClientServerInfo,
} from "../lib/client-server-state.ts";

interface CombinedStatusBannerProps {
  serverName: string;
  locale: Locale;
  federationSuccess: boolean;
}

export default function CombinedStatusBanner(
  { serverName, locale, federationSuccess }: CombinedStatusBannerProps,
) {
  const i18n = useMemo(() => new I18n(locale), [locale]);
  const state = clientServerState.value;

  useEffect(() => {
    fetchClientServerInfo(serverName);
  }, [serverName]);

  const clientServerStatus: "loading" | "success" | "error" = state.loading
    ? "loading"
    : (!state.errors.clientWellKnown && !state.errors.versions)
    ? "success"
    : "error";

  // While loading client-server API, show only federation banner
  if (clientServerStatus === "loading") {
    return (
      <div
        class={`govuk-panel ${
          federationSuccess ? "govuk-panel--confirmation" : "govuk-panel--error"
        }`}
        role={federationSuccess ? "status" : "alert"}
        aria-live="polite"
      >
        <h1 class="govuk-panel__title">
          {i18n.t(
            federationSuccess
              ? "results.federation_working"
              : "results.federation_not_working",
          )}
        </h1>
        <div class="govuk-panel__body">
          {i18n.t(
            federationSuccess
              ? "results.success_message"
              : "results.failure_message",
          )}
        </div>
      </div>
    );
  }

  // If both succeed, show combined banner
  const bothSuccess = federationSuccess && clientServerStatus === "success";
  if (bothSuccess) {
    return (
      <div
        class="govuk-panel govuk-panel--confirmation"
        role="status"
        aria-live="polite"
      >
        <h1 class="govuk-panel__title">
          {i18n.t("results.all_working")}
        </h1>
        <div class="govuk-panel__body">
          {i18n.t("results.all_working_message")}
        </div>
      </div>
    );
  }

  // Otherwise, show both individual banners
  const clientServerSuccess = clientServerStatus === "success";

  return (
    <>
      {/* Federation status banner */}
      <div
        class={`govuk-panel ${
          federationSuccess ? "govuk-panel--confirmation" : "govuk-panel--error"
        }`}
        role={federationSuccess ? "status" : "alert"}
        aria-live="polite"
      >
        <h1 class="govuk-panel__title">
          {i18n.t(
            federationSuccess
              ? "results.federation_working"
              : "results.federation_not_working",
          )}
        </h1>
        <div class="govuk-panel__body">
          {i18n.t(
            federationSuccess
              ? "results.success_message"
              : "results.failure_message",
          )}
        </div>
      </div>

      {/* Client-Server API status banner */}
      <div
        class={`govuk-panel panel-with-margin ${
          clientServerSuccess
            ? "govuk-panel--confirmation"
            : "govuk-panel--error"
        }`}
        role={clientServerSuccess ? "status" : "alert"}
        aria-live="polite"
      >
        <h1 class="govuk-panel__title">
          {i18n.t(
            clientServerSuccess
              ? "results.client_server_api_working"
              : "results.client_server_api_not_working",
          )}
        </h1>
        <div class="govuk-panel__body">
          {i18n.t(
            clientServerSuccess
              ? "results.client_server_api_success_message"
              : "results.client_server_api_failure_message",
          )}
        </div>
      </div>
    </>
  );
}
