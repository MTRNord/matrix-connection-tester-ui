import { define } from "../utils.ts";
import { getConfig } from "../lib/api.ts";
import { page } from "fresh";

export const handler = define.handlers({
  async POST(ctx) {
    const url = ctx.url;
    const { i18n } = ctx.state;

    try {
      const apiConfig = await getConfig(`${url.protocol}//${url.host}`);
      const formData = await ctx.req.formData();
      const action = formData.get("action");

      if (action === "register") {
        const email = formData.get("email") as string;
        const serverName = formData.get("serverName") as string;

        if (!email || !serverName) {
          return page({
            error: i18n.t("alerts.missing_fields"),
            success: null,
          });
        }

        const apiUrl = `${
          (apiConfig ?? {}).api_server_url ?? "localhost"
        }/api/alerts/register`;

        try {
          const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email,
              server_name: serverName,
            }),
          });

          if (response.ok) {
            return page({
              success: i18n.t("alerts.register_success"),
              error: null,
            });
          } else {
            const errorText = await response.text();
            return page({
              error: i18n.t("alerts.register_failed") + ": " + errorText,
              success: null,
            });
          }
        } catch (e) {
          console.error("Error registering alert:", e);
          return page({
            error: i18n.t("alerts.register_failed"),
            success: null,
          });
        }
      } else if (action === "list") {
        const email = formData.get("email") as string;

        if (!email) {
          return page({
            error: i18n.t("alerts.missing_email"),
            success: null,
          });
        }

        const apiUrl = `${
          (apiConfig ?? {}).api_server_url ?? "localhost"
        }/api/alerts/list`;

        try {
          const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email,
            }),
          });

          if (response.ok) {
            return page({
              success: i18n.t("alerts.list_request_success"),
              error: null,
            });
          } else {
            const errorText = await response.text();
            return page({
              error: i18n.t("alerts.list_request_failed") + ": " + errorText,
              success: null,
            });
          }
        } catch (e) {
          console.error("Error requesting alert list:", e);
          return page({
            error: i18n.t("alerts.list_request_failed"),
            success: null,
          });
        }
      }

      return page({ error: null, success: null });
    } catch (e) {
      console.error("Error in alerts handler:", e);
      return new Response(ctx.state.i18n.tString("errors.missing_api_config"), {
        status: 500,
      });
    }
  },
});

export default define.page<typeof handler>(function Alerts(ctx) {
  const { i18n } = ctx.state;
  const error = ctx.data?.error;
  const success = ctx.data?.success;

  return (
    <>
      <h1 class="govuk-heading-xl">{i18n.t("alerts.title")}</h1>

      <p class="govuk-body">
        {i18n.t("alerts.intro")}
      </p>

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
          aria-labelledby="success-banner-title"
          data-module="govuk-notification-banner"
        >
          <div class="govuk-notification-banner__header">
            <h2
              class="govuk-notification-banner__title"
              id="success-banner-title"
            >
              {i18n.t("common.success")}
            </h2>
          </div>
          <div class="govuk-notification-banner__content">
            <p class="govuk-notification-banner__heading">
              {success}
            </p>
          </div>
        </div>
      )}

      <div class="govuk-tabs" data-module="govuk-tabs">
        <h2 class="govuk-tabs__title">
          {i18n.t("alerts.tabs_title")}
        </h2>
        <ul class="govuk-tabs__list">
          <li class="govuk-tabs__list-item govuk-tabs__list-item--selected">
            <a class="govuk-tabs__tab" href="#register">
              {i18n.t("alerts.register_tab")}
            </a>
          </li>
          <li class="govuk-tabs__list-item">
            <a class="govuk-tabs__tab" href="#list">
              {i18n.t("alerts.list_tab")}
            </a>
          </li>
        </ul>

        <div class="govuk-tabs__panel" id="register">
          <form method="post" action="/alerts">
            <input type="hidden" name="action" value="register" />

            <fieldset class="govuk-fieldset">
              <legend class="govuk-fieldset__legend govuk-fieldset__legend--l">
                <h2 class="govuk-fieldset__heading">
                  {i18n.t("alerts.register_title")}
                </h2>
              </legend>
              <p class="govuk-body">
                {i18n.t("alerts.register_description")}
              </p>

              <div class="govuk-form-group">
                <label class="govuk-label" for="register-email">
                  {i18n.t("alerts.email_label")}
                </label>
                <div id="register-email-hint" class="govuk-hint">
                  {i18n.t("alerts.email_hint")}
                </div>
                <input
                  class="govuk-input"
                  id="register-email"
                  name="email"
                  type="email"
                  required
                  aria-describedby="register-email-hint"
                />
              </div>

              <div class="govuk-form-group">
                <label class="govuk-label" for="register-server">
                  {i18n.t("alerts.server_name_label")}
                </label>
                <div id="register-server-hint" class="govuk-hint">
                  {i18n.t("alerts.server_name_hint")}
                </div>
                <input
                  class="govuk-input"
                  id="register-server"
                  name="serverName"
                  type="text"
                  required
                  aria-describedby="register-server-hint"
                  pattern="^(?:\[([0-9A-Fa-f:.]{2,45})]|(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})|([0-9A-Za-z.-]{1,255}))(?::(\d{1,5}))?$"
                />
              </div>
            </fieldset>

            <button
              type="submit"
              class="govuk-button"
              data-module="govuk-button"
            >
              {i18n.t("alerts.register_button")}
            </button>
          </form>
        </div>

        <div class="govuk-tabs__panel govuk-tabs__panel--hidden" id="list">
          <form method="post" action="/alerts">
            <input type="hidden" name="action" value="list" />

            <fieldset class="govuk-fieldset">
              <legend class="govuk-fieldset__legend govuk-fieldset__legend--l">
                <h2 class="govuk-fieldset__heading">
                  {i18n.t("alerts.list_title")}
                </h2>
              </legend>
              <p class="govuk-body">
                {i18n.t("alerts.list_description")}
              </p>

              <div class="govuk-form-group">
                <label class="govuk-label" for="list-email">
                  {i18n.t("alerts.email_label")}
                </label>
                <div id="list-email-hint" class="govuk-hint">
                  {i18n.t("alerts.list_email_hint")}
                </div>
                <input
                  class="govuk-input"
                  id="list-email"
                  name="email"
                  type="email"
                  required
                  aria-describedby="list-email-hint"
                />
              </div>
            </fieldset>

            <button
              type="submit"
              class="govuk-button"
              data-module="govuk-button"
            >
              {i18n.t("alerts.list_button")}
            </button>
          </form>
        </div>
      </div>

      <div class="govuk-warning-text">
        <span class="govuk-warning-text__icon" aria-hidden="true">!</span>
        <strong class="govuk-warning-text__text">
          <span class="govuk-visually-hidden">{i18n.t("common.warning")}</span>
          {i18n.t("alerts.email_verification_notice")}
        </strong>
      </div>
    </>
  );
});
