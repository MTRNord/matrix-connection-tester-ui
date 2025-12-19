import { useEffect, useMemo } from "preact/hooks";
import { useComputed } from "@preact/signals";
import { I18n, type Locale } from "../lib/i18n.ts";
import {
  clientServerStatus,
  fetchClientServerInfo,
} from "../lib/client-server-state.ts";

type StatusType = "success" | "warning" | "error";

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
  const status = useComputed<StatusType>(() => {
    const s = clientServerStatus.value;
    if (s === "loading") return "success"; // fallback, won't render anyway
    return s;
  });

  const titleKey = useComputed(() => {
    switch (status.value) {
      case "success":
        return "results.client_server_api_working";
      case "warning":
        return "results.client_server_api_working_with_warnings";
      case "error":
        return "results.client_server_api_not_working";
    }
  });

  const messageKey = useComputed(() => {
    switch (status.value) {
      case "success":
        return "results.client_server_api_success_message";
      case "warning":
        return "results.client_server_api_warning_message";
      case "error":
        return "results.client_server_api_failure_message";
    }
  });

  const panelClass = useComputed(() => {
    switch (status.value) {
      case "success":
        return "govuk-panel--confirmation";
      case "warning":
        return "govuk-panel--warning";
      case "error":
        return "govuk-panel--error";
    }
  });

  // Don't render anything while loading
  if (clientServerStatus.value === "loading") {
    return null;
  }

  return (
    <div
      class={`govuk-panel panel-with-margin ${panelClass.value}`}
      role={status.value === "error" ? "alert" : "status"}
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
