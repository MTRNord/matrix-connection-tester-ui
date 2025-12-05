import { define } from "../../utils.ts";
import DocsLayout from "../../components/docs/DocsLayout.tsx";

export default define.page(function DocsIndex(ctx) {
  const { i18n } = ctx.state;
  const currentPath = ctx.url.pathname;

  return (
    <DocsLayout
      currentPath={currentPath}
      i18n={i18n}
      title={i18n.tString("docs.index.title")}
      description={i18n.tString("docs.index.description")}
    >
      <div class="govuk-grid-row">
        <div class="govuk-grid-column-full">
          <h2 class="govuk-heading-l">{i18n.t("docs.index.sections_title")}</h2>

          <div class="govuk-grid-row">
            <div class="govuk-grid-column-one-half">
              <h3 class="govuk-heading-m">
                <a href="/docs/federation-setup" class="govuk-link">
                  {i18n.t("docs.nav.getting_started")}
                </a>
              </h3>
              <p class="govuk-body">
                {i18n.t("docs.index.getting_started_description")}
              </p>
            </div>

            <div class="govuk-grid-column-one-half">
              <h3 class="govuk-heading-m">
                <a href="/docs/cors-configuration" class="govuk-link">
                  {i18n.t("docs.nav.configuration")}
                </a>
              </h3>
              <p class="govuk-body">
                {i18n.t("docs.index.configuration_description")}
              </p>
            </div>
          </div>

          <div class="govuk-grid-row">
            <div class="govuk-grid-column-one-half">
              <h3 class="govuk-heading-m">
                <a href="/docs/support-endpoint" class="govuk-link">
                  {i18n.t("docs.nav.api_endpoints")}
                </a>
              </h3>
              <p class="govuk-body">
                {i18n.t("docs.index.api_endpoints_description")}
              </p>
            </div>

            <div class="govuk-grid-column-one-half">
              <h3 class="govuk-heading-m">
                <a href="/docs/troubleshooting" class="govuk-link">
                  {i18n.t("docs.nav.troubleshooting")}
                </a>
              </h3>
              <p class="govuk-body">
                {i18n.t("docs.index.troubleshooting_description")}
              </p>
            </div>
          </div>

          <div class="govuk-grid-row">
            <div class="govuk-grid-column-one-half">
              <h3 class="govuk-heading-m">
                <a href="/docs/compliance-suites" class="govuk-link">
                  {i18n.t("docs.nav.compliance")}
                </a>
              </h3>
              <p class="govuk-body">
                {i18n.t("docs.index.compliance_description")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <hr class="govuk-section-break govuk-section-break--xl govuk-section-break--visible" />

      <h2 class="govuk-heading-l">{i18n.t("docs.index.quick_links_title")}</h2>
      <ul class="govuk-list govuk-list--bullet">
        <li>
          <a href="/docs/federation-setup" class="govuk-link">
            {i18n.t("docs.nav.federation_setup")}
          </a>
        </li>
        <li>
          <a href="/docs/cors-configuration" class="govuk-link">
            {i18n.t("docs.nav.cors_configuration")}
          </a>
        </li>
        <li>
          <a href="/docs/tls-certificates" class="govuk-link">
            {i18n.t("docs.nav.tls_certificates")}
          </a>
        </li>
        <li>
          <a href="/docs/troubleshooting" class="govuk-link">
            {i18n.t("docs.nav.general_troubleshooting")}
          </a>
        </li>
      </ul>
    </DocsLayout>
  );
});
