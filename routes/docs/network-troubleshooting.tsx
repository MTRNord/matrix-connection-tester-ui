import { define } from "../../utils.ts";
import DocsLayout from "../../components/docs/DocsLayout.tsx";

export default define.page(function NetworkTroubleshooting(ctx) {
  const { i18n } = ctx.state;
  const currentPath = ctx.url.pathname;

  return (
    <DocsLayout
      currentPath={currentPath}
      i18n={i18n}
      title={i18n.tString("docs.network_troubleshooting.title")}
      description={i18n.tString("docs.network_troubleshooting.description")}
    >
      <div
        class="govuk-notification-banner govuk-notification-banner--warning"
        role="region"
        aria-labelledby="govuk-notification-banner-title"
      >
        <div class="govuk-notification-banner__header">
          <h2
            class="govuk-notification-banner__title"
            id="govuk-notification-banner-title"
          >
            {i18n.t("docs.common.coming_soon")}
          </h2>
        </div>
        <div class="govuk-notification-banner__content">
          <p class="govuk-notification-banner__heading">
            {i18n.t("docs.common.placeholder_message")}
          </p>
        </div>
      </div>

      <h2 class="govuk-heading-l">{i18n.t("docs.common.overview")}</h2>
      <p class="govuk-body">{i18n.t("docs.network_troubleshooting.overview")}</p>
    </DocsLayout>
  );
});
