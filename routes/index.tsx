import { define } from "../utils.ts";

export default define.page(function Home(ctx) {
  const { i18n } = ctx.state;

  return (
    <>
      <h1 class="govuk-heading-xl">{i18n.t("home.title")}</h1>
      <div class="govuk-body">
        <p>
          {i18n.t("home.welcome")}
        </p>

        <p>
          {i18n.t("home.getting_started")}
        </p>
        <details class="govuk-details">
          <summary class="govuk-details__summary">
            <span class="govuk-details__summary-text">
              {i18n.t("home.find_server_title")}
            </span>
          </summary>
          <div class="govuk-details__text">
            {i18n.t("home.find_server_description")}
            <div class="govuk-!-margin-top-2">
              {i18n.t("home.find_server_help")}
            </div>
          </div>
        </details>

        <form method="get" action="/results">
          <fieldset class="govuk-fieldset">
            <legend class="govuk-fieldset__legend govuk-fieldset__legend--l">
              <h2 class="govuk-fieldset__heading">
                {i18n.t("home.test_server_legend")}
              </h2>
            </legend>
            <div class="govuk-form-group">
              <label class="govuk-label" for="homeserver">
                {i18n.t("home.homeserver_label")}
              </label>
              <div id="homeserver-hint" class="govuk-hint">
                {i18n.t("home.homeserver_hint")}
              </div>
              <input
                class="govuk-input"
                id="homeserver"
                name="serverName"
                type="text"
                required
                aria-describedby="homeserver-hint"
                pattern="^(?:\[([0-9A-Fa-f:.]{2,45})]|(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})|([0-9A-Za-z.-]{1,255}))(?::(\d{1,5}))?$"
              />
            </div>
            <div id="statistics-hint" class="govuk-hint">
              {i18n.t("home.statistics_hint")}
            </div>
            <div class="govuk-checkboxes" data-module="govuk-checkboxes">
              <div class="govuk-checkboxes__item">
                <input
                  class="govuk-checkboxes__input"
                  id="statistics"
                  name="statistics"
                  type="checkbox"
                  value="opt-in"
                />
                <label
                  class="govuk-label govuk-checkboxes__label"
                  for="statistics"
                >
                  {i18n.t("home.statistics_label")}
                </label>
              </div>
            </div>
          </fieldset>
          <button
            type="submit"
            class="govuk-button run-tests-button"
            data-module="govuk-button"
          >
            {i18n.t("home.run_tests")}
          </button>
        </form>
      </div>
    </>
  );
});
