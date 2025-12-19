import { I18n } from "../../lib/i18n.ts";

type StatusType = "success" | "warning" | "error";

export function ClientServerStatusPanel(props: {
  i18n: I18n;
  status: StatusType;
}) {
  const { i18n, status } = props;

  const getPanelClass = () => {
    switch (status) {
      case "success":
        return "govuk-panel--confirmation";
      case "warning":
        return "govuk-panel--warning";
      case "error":
        return "govuk-panel--error";
    }
  };

  const getTitleKey = () => {
    switch (status) {
      case "success":
        return "results.client_server_api_working";
      case "warning":
        return "results.client_server_api_working_with_warnings";
      case "error":
        return "results.client_server_api_not_working";
    }
  };

  const getMessageKey = () => {
    switch (status) {
      case "success":
        return "results.client_server_api_success_message";
      case "warning":
        return "results.client_server_api_warning_message";
      case "error":
        return "results.client_server_api_failure_message";
    }
  };

  return (
    <div
      class={`govuk-panel ${getPanelClass()}`}
      role={status === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      <h1 class="govuk-panel__title">
        {i18n.t(getTitleKey())}
      </h1>
      <div class="govuk-panel__body">
        {i18n.t(getMessageKey())}
      </div>
    </div>
  );
}
