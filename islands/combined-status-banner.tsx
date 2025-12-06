import { useEffect, useMemo } from "preact/hooks";
import { useComputed } from "@preact/signals";
import { I18n, type Locale } from "../lib/i18n.ts";
import {
  clientServerStatus,
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

  useEffect(() => {
    fetchClientServerInfo(serverName);
  }, [serverName]);

  // Computed signals for UI state
  const clientServerSuccess = useComputed(() =>
    clientServerStatus.value === "success"
  );
  const bothSuccess = useComputed(() =>
    federationSuccess && clientServerSuccess.value
  );

  // While loading client-server API, show only federation banner
  if (clientServerStatus.value === "loading") {
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
  if (bothSuccess.value) {
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
          clientServerSuccess.value
            ? "govuk-panel--confirmation"
            : "govuk-panel--error"
        }`}
        role={clientServerSuccess.value ? "status" : "alert"}
        aria-live="polite"
      >
        <h1 class="govuk-panel__title">
          {i18n.t(
            clientServerSuccess.value
              ? "results.client_server_api_working"
              : "results.client_server_api_not_working",
          )}
        </h1>
        <div class="govuk-panel__body">
          {i18n.t(
            clientServerSuccess.value
              ? "results.client_server_api_success_message"
              : "results.client_server_api_failure_message",
          )}
        </div>
      </div>
    </>
  );
}
