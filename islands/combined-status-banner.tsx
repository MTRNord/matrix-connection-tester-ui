import { useEffect, useMemo } from "preact/hooks";
import { useComputed } from "@preact/signals";
import { I18n, type Locale } from "../lib/i18n.ts";
import {
  clientServerStatus,
  fetchClientServerInfo,
} from "../lib/client-server-state.ts";

type StatusType = "success" | "warning" | "error";

interface CombinedStatusBannerProps {
  serverName: string;
  locale: Locale;
  federationSuccess: boolean;
  hasConnectionErrors?: boolean;
  hasFederationWarning?: boolean;
}

export default function CombinedStatusBanner(
  {
    serverName,
    locale,
    federationSuccess,
    hasConnectionErrors = false,
    hasFederationWarning = false,
  }: CombinedStatusBannerProps,
) {
  const i18n = useMemo(() => new I18n(locale), [locale]);

  useEffect(() => {
    fetchClientServerInfo(serverName);
  }, [serverName]);

  // Computed signals for UI state
  const clientServerState = useComputed<StatusType>(() => {
    const s = clientServerStatus.value;
    if (s === "loading") return "success"; // fallback, won't render anyway
    return s;
  });
  const bothSuccessNoWarnings = useComputed(() =>
    federationSuccess && !hasConnectionErrors && !hasFederationWarning &&
    clientServerState.value === "success"
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

  // If both succeed with no warnings, show combined success banner
  if (bothSuccessNoWarnings.value) {
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

  // Helper to get panel class based on status
  const getClientServerPanelClass = () => {
    switch (clientServerState.value) {
      case "success":
        return "govuk-panel--confirmation";
      case "warning":
        return "govuk-panel--warning";
      case "error":
        return "govuk-panel--error";
    }
  };

  const getClientServerTitleKey = () => {
    switch (clientServerState.value) {
      case "success":
        return "results.client_server_api_working";
      case "warning":
        return "results.client_server_api_working_with_warnings";
      case "error":
        return "results.client_server_api_not_working";
    }
  };

  const getClientServerMessageKey = () => {
    switch (clientServerState.value) {
      case "success":
        return "results.client_server_api_success_message";
      case "warning":
        return "results.client_server_api_warning_message";
      case "error":
        return "results.client_server_api_failure_message";
    }
  };

  // Otherwise, show both individual banners
  return (
    <>
      {/* Federation status banner */}
      <div
        class={`govuk-panel ${
          !federationSuccess
            ? "govuk-panel--error"
            : (hasConnectionErrors || hasFederationWarning)
            ? "govuk-panel--warning"
            : "govuk-panel--confirmation"
        }`}
        role={federationSuccess ? "status" : "alert"}
        aria-live="polite"
      >
        <h1 class="govuk-panel__title">
          {i18n.t(
            !federationSuccess
              ? "results.federation_not_working"
              : (hasConnectionErrors || hasFederationWarning)
              ? "results.federation_working_with_errors"
              : "results.federation_working",
          )}
        </h1>
        <div class="govuk-panel__body">
          {i18n.t(
            !federationSuccess
              ? "results.failure_message"
              : (hasConnectionErrors || hasFederationWarning)
              ? "results.partial_success_message"
              : "results.success_message",
          )}
        </div>
      </div>

      {/* Client-Server API status banner */}
      <div
        class={`govuk-panel panel-with-margin ${getClientServerPanelClass()}`}
        role={clientServerState.value === "error" ? "alert" : "status"}
        aria-live="polite"
      >
        <h1 class="govuk-panel__title">
          {i18n.t(getClientServerTitleKey())}
        </h1>
        <div class="govuk-panel__body">
          {i18n.t(getClientServerMessageKey())}
        </div>
      </div>
    </>
  );
}
