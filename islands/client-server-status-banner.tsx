import { useEffect, useMemo } from "preact/hooks";
import { I18n, type Locale } from "../lib/i18n.ts";
import {
  clientServerState,
  fetchClientServerInfo,
} from "../lib/client-server-state.ts";

interface ClientServerStatusBannerProps {
  serverName: string;
  locale: Locale;
}

export default function ClientServerStatusBanner(
  { serverName, locale }: ClientServerStatusBannerProps,
) {
  const i18n = useMemo(() => new I18n(locale), [locale]);
  const state = clientServerState.value;

  useEffect(() => {
    fetchClientServerInfo(serverName);
  }, [serverName]);

  const status: "loading" | "success" | "error" = state.loading
    ? "loading"
    : (!state.errors.clientWellKnown && !state.errors.versions)
    ? "success"
    : "error";

  // Don't render anything while loading
  if (status === "loading") {
    return null;
  }

  // Show appropriate banner based on status
  const isSuccess = status === "success";

  return (
    <div
      class={`govuk-panel panel-with-margin ${
        isSuccess ? "govuk-panel--confirmation" : "govuk-panel--error"
      }`}
      role={isSuccess ? "status" : "alert"}
      aria-live="polite"
    >
      <h1 class="govuk-panel__title">
        {i18n.t(
          isSuccess
            ? "results.client_server_api_working"
            : "results.client_server_api_not_working",
        )}
      </h1>
      <div class="govuk-panel__body">
        {i18n.t(
          isSuccess
            ? "results.client_server_api_success_message"
            : "results.client_server_api_failure_message",
        )}
      </div>
    </div>
  );
}
