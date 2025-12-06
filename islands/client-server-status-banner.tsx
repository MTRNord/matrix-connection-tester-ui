import { useEffect, useMemo } from "preact/hooks";
import { useComputed } from "@preact/signals";
import { I18n, type Locale } from "../lib/i18n.ts";
import {
  clientServerStatus,
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

  useEffect(() => {
    fetchClientServerInfo(serverName);
  }, [serverName]);

  // Computed signals for UI state
  const isSuccess = useComputed(() => clientServerStatus.value === "success");
  const titleKey = useComputed(() =>
    isSuccess.value
      ? "results.client_server_api_working"
      : "results.client_server_api_not_working"
  );
  const messageKey = useComputed(() =>
    isSuccess.value
      ? "results.client_server_api_success_message"
      : "results.client_server_api_failure_message"
  );

  // Don't render anything while loading
  if (clientServerStatus.value === "loading") {
    return null;
  }

  return (
    <div
      class={`govuk-panel panel-with-margin ${
        isSuccess.value ? "govuk-panel--confirmation" : "govuk-panel--error"
      }`}
      role={isSuccess.value ? "status" : "alert"}
      aria-live="polite"
    >
      <h1 class="govuk-panel__title">
        {i18n.t(titleKey.value)}
      </h1>
      <div class="govuk-panel__body">
        {i18n.t(messageKey.value)}
      </div>
    </div>
  );
}
