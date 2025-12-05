import { define } from "../utils.ts";
import { getConfig } from "../lib/api.ts";
import { page } from "fresh";
import AlertDeleteButton from "../islands/alert-delete-button.tsx";

interface Alert {
  id: string;
  server_name: string;
  email: string;
  verified: boolean;
}

interface VerifyResponse {
  alerts?: Alert[];
  message?: string;
  status?: string;
}

export const handler = define.handlers({
  async GET(ctx) {
    const url = ctx.url;
    const { i18n } = ctx.state;
    const token = url.searchParams.get("token");

    if (!token) {
      return page({
        error: i18n.t("alerts.missing_token"),
        alerts: null,
        verified: false,
        success: null,
        isDeleted: false,
        showAlertsList: false,
        apiBaseUrl: "",
      });
    }

    try {
      const apiConfig = await getConfig(`${url.protocol}//${url.host}`);
      const apiUrl = `${
        (apiConfig ?? {}).api_server_url ?? "localhost"
      }/api/alerts/verify?token=${encodeURIComponent(token)}`;

      try {
        const response = await fetch(apiUrl, {
          method: "GET",
        });

        if (response.ok) {
          const data: VerifyResponse = await response.json();

          // Check the status from API
          let successMessage = null;
          const isDeleted = data.status === "deleted";
          const isAlertVerified = data.status === "alert verified";
          const showAlertsList = !isDeleted && !isAlertVerified;

          if (isDeleted) {
            // API returned deleted status - show deletion confirmation
            successMessage = i18n.t("alerts.deletion_confirmed");
          } else if (isAlertVerified) {
            // API returned alert verified status - show alert verification confirmation
            successMessage = i18n.t("alerts.alert_verified");
          }

          return page({
            alerts: data.alerts || [],
            verified: true,
            error: null,
            success: successMessage,
            isDeleted: isDeleted,
            showAlertsList: showAlertsList,
            apiBaseUrl: (apiConfig ?? {}).api_server_url ?? "localhost",
          });
        } else {
          const errorText = await response.text();
          return page({
            error: i18n.t("alerts.verify_failed") + ": " + errorText,
            alerts: null,
            verified: false,
            success: null,
            isDeleted: false,
            showAlertsList: false,
            apiBaseUrl: "",
          });
        }
      } catch (e) {
        console.error("Error verifying token:", e);
        return page({
          error: i18n.t("alerts.verify_failed"),
          alerts: null,
          verified: false,
          success: null,
          isDeleted: false,
          showAlertsList: false,
          apiBaseUrl: "",
        });
      }
    } catch (e) {
      console.error("Error fetching API config:", e);
      return new Response(ctx.state.i18n.tString("errors.missing_api_config"), {
        status: 500,
      });
    }
  },
});

export default define.page<typeof handler>(function Verify(ctx) {
  const { i18n } = ctx.state;
  const error = ctx.data?.error;
  const success = ctx.data?.success;
  const alerts = ctx.data?.alerts;
  const verified = ctx.data?.verified;
  const showAlertsList = ctx.data?.showAlertsList;
  const apiBaseUrl = ctx.data?.apiBaseUrl;

  return (
    <>
      <h1 class="govuk-heading-xl">{i18n.t("alerts.verify_title")}</h1>

      {error && (
        <div
          class="govuk-notification-banner govuk-notification-banner--error"
          role="alert"
          aria-labelledby="error-banner-title"
          data-module="govuk-notification-banner"
        >
          <div class="govuk-notification-banner__header">
            <h2
              class="govuk-notification-banner__title"
              id="error-banner-title"
            >
              {i18n.t("common.error")}
            </h2>
          </div>
          <div class="govuk-notification-banner__content">
            <p class="govuk-notification-banner__heading">
              {error}
            </p>
          </div>
        </div>
      )}

      {success && (
        <div
          class="govuk-notification-banner govuk-notification-banner--success"
          role="alert"
          aria-labelledby="success-action-banner-title"
          data-module="govuk-notification-banner"
        >
          <div class="govuk-notification-banner__header">
            <h2
              class="govuk-notification-banner__title"
              id="success-action-banner-title"
            >
              {i18n.t("alerts.success")}
            </h2>
          </div>
          <div class="govuk-notification-banner__content">
            <p class="govuk-notification-banner__heading">
              {success}
            </p>
          </div>
        </div>
      )}

      {verified && !error && !success && (
        <div
          class="govuk-notification-banner govuk-notification-banner--success"
          role="alert"
          aria-labelledby="success-banner-title"
          data-module="govuk-notification-banner"
        >
          <div class="govuk-notification-banner__header">
            <h2
              class="govuk-notification-banner__title"
              id="success-banner-title"
            >
              {i18n.t("alerts.success")}
            </h2>
          </div>
          <div class="govuk-notification-banner__content">
            <p class="govuk-notification-banner__heading">
              {i18n.t("alerts.verify_success")}
            </p>
          </div>
        </div>
      )}

      {verified && showAlertsList && alerts && alerts.length > 0 && (
        <>
          <h2 class="govuk-heading-l">{i18n.t("alerts.your_alerts")}</h2>
          <p class="govuk-body">
            {i18n.t("alerts.alerts_list_description")}
          </p>

          <table class="govuk-table">
            <caption class="govuk-table__caption govuk-table__caption--m">
              {i18n.t("alerts.alerts_table_caption")}
            </caption>
            <thead class="govuk-table__head">
              <tr class="govuk-table__row">
                <th scope="col" class="govuk-table__header">
                  {i18n.t("alerts.server_name")}
                </th>
                <th scope="col" class="govuk-table__header">
                  {i18n.t("alerts.email")}
                </th>
                <th scope="col" class="govuk-table__header">
                  {i18n.t("alerts.status")}
                </th>
                <th scope="col" class="govuk-table__header">
                  {i18n.t("alerts.actions")}
                </th>
              </tr>
            </thead>
            <tbody class="govuk-table__body">
              {alerts.map((alert) => (
                <tr class="govuk-table__row" key={alert.id}>
                  <td class="govuk-table__cell">
                    <code>{alert.server_name}</code>
                  </td>
                  <td class="govuk-table__cell">{alert.email}</td>
                  <td class="govuk-table__cell">
                    {alert.verified
                      ? (
                        <strong class="govuk-tag govuk-tag--green">
                          {i18n.t("alerts.verified")}
                        </strong>
                      )
                      : (
                        <strong class="govuk-tag govuk-tag--yellow">
                          {i18n.t("alerts.unverified")}
                        </strong>
                      )}
                  </td>
                  <td class="govuk-table__cell">
                    <AlertDeleteButton
                      alertId={alert.id}
                      serverName={alert.server_name}
                      locale={i18n.getLocale()}
                      apiBaseUrl={apiBaseUrl || ""}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {verified && showAlertsList && alerts && alerts.length === 0 && (
        <div class="govuk-inset-text">
          {i18n.t("alerts.no_alerts")}
        </div>
      )}
    </>
  );
});
