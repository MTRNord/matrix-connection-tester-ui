import { I18n } from "../../lib/i18n.ts";

export function ClientServerStatusPanel(props: {
  i18n: I18n;
  successful: boolean;
}) {
  const { i18n, successful } = props;

  return (
    <div
      class={"govuk-panel" +
        (successful ? " govuk-panel--confirmation" : " govuk-panel--error")}
      role={successful ? "status" : "alert"}
      aria-live="polite"
    >
      <h1 class="govuk-panel__title">
        {successful
          ? i18n.t("results.client_server_api_working")
          : i18n.t("results.client_server_api_not_working")}
      </h1>
      <div class="govuk-panel__body">
        {successful
          ? i18n.t("results.client_server_api_success_message")
          : i18n.t("results.client_server_api_failure_message")}
      </div>
    </div>
  );
}
