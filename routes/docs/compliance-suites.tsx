import { define } from "../../utils.ts";
import DocsLayout from "../../components/docs/DocsLayout.tsx";

export default define.page(function ComplianceSuites(ctx) {
  const { i18n } = ctx.state;
  const currentPath = ctx.url.pathname;

  return (
    <DocsLayout
      currentPath={currentPath}
      i18n={i18n}
      title={i18n.tString("docs.compliance_suites.title")}
      description={i18n.tString("docs.compliance_suites.description")}
    >
      {/* Introduction */}
      <p class="govuk-body">
        {i18n.t("docs.compliance_suites.intro_text")}
      </p>

      {/* Version Info */}
      <div
        class="govuk-notification-banner"
        role="region"
        aria-labelledby="govuk-notification-banner-title"
      >
        <div class="govuk-notification-banner__header">
          <h2
            class="govuk-notification-banner__title"
            id="govuk-notification-banner-title"
          >
            {i18n.t("docs.common.important")}
          </h2>
        </div>
        <div class="govuk-notification-banner__content">
          <p class="govuk-notification-banner__heading">
            {i18n.t("docs.compliance_suites.version_info")}
          </p>
        </div>
      </div>

      {/* Matrix Homeserver Compliance Suite 2024 */}
      <h2 class="govuk-heading-l" id="suite-2024">
        {i18n.t("docs.compliance_suites.suite_2024_title")}
      </h2>
      <div class="table-wrapper">
        <div class="table-scroll">
          <table class="govuk-table">
            <caption class="govuk-visually-hidden">
              {i18n.t("docs.compliance_suites.suite_2024_caption")}
            </caption>
            <tbody class="govuk-table__body">
              <tr class="govuk-table__row">
                <th scope="row" class="govuk-table__header" style="width: 30%">
                  {i18n.t("docs.compliance_suites.field_suite")}
                </th>
                <td class="govuk-table__cell">
                  <strong>
                    {i18n.t("docs.compliance_suites.suite_2024_name")}
                  </strong>
                </td>
              </tr>
              <tr class="govuk-table__row">
                <th scope="row" class="govuk-table__header">
                  {i18n.t("docs.compliance_suites.field_status")}
                </th>
                <td class="govuk-table__cell">
                  <strong class="govuk-tag govuk-tag--green">
                    {i18n.t("docs.compliance_suites.status_active")}
                  </strong>
                </td>
              </tr>
              <tr class="govuk-table__row">
                <th scope="row" class="govuk-table__header">
                  {i18n.t("docs.compliance_suites.field_version")}
                </th>
                <td class="govuk-table__cell">1.0</td>
              </tr>
              <tr class="govuk-table__row">
                <th scope="row" class="govuk-table__header">
                  {i18n.t("docs.compliance_suites.field_last_updated")}
                </th>
                <td class="govuk-table__cell">2024-01-15</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Core Features */}
      <h3 class="govuk-heading-m">
        {i18n.t("docs.compliance_suites.core_features_title")}
      </h3>
      <p class="govuk-body">
        {i18n.t("docs.compliance_suites.core_features_description")}
      </p>

      <div class="table-wrapper">
        <div class="table-scroll">
          <table class="govuk-table">
            <thead class="govuk-table__head">
              <tr class="govuk-table__row">
                <th scope="col" class="govuk-table__header">
                  {i18n.t("docs.compliance_suites.table.feature")}
                </th>
                <th scope="col" class="govuk-table__header">
                  {i18n.t("docs.compliance_suites.table.requirement")}
                </th>
                <th scope="col" class="govuk-table__header">
                  {i18n.t("docs.compliance_suites.table.spec_version")}
                </th>
              </tr>
            </thead>
            <tbody class="govuk-table__body">
              <tr class="govuk-table__row">
                <td class="govuk-table__cell">
                  <strong>
                    {i18n.t("docs.compliance_suites.core.server_discovery")}
                  </strong>
                </td>
                <td class="govuk-table__cell">
                  <strong class="govuk-tag govuk-tag--red">
                    {i18n.t("docs.common.required")}
                  </strong>
                </td>
                <td class="govuk-table__cell">v1.11</td>
              </tr>
              <tr class="govuk-table__row">
                <td class="govuk-table__cell">
                  <strong>
                    {i18n.t("docs.compliance_suites.core.federation_api")}
                  </strong>
                </td>
                <td class="govuk-table__cell">
                  <strong class="govuk-tag govuk-tag--red">
                    {i18n.t("docs.common.required")}
                  </strong>
                </td>
                <td class="govuk-table__cell">v1.11</td>
              </tr>
              <tr class="govuk-table__row">
                <td class="govuk-table__cell">
                  <strong>
                    {i18n.t("docs.compliance_suites.core.client_server_api")}
                  </strong>
                </td>
                <td class="govuk-table__cell">
                  <strong class="govuk-tag govuk-tag--red">
                    {i18n.t("docs.common.required")}
                  </strong>
                </td>
                <td class="govuk-table__cell">v1.11</td>
              </tr>
              <tr class="govuk-table__row">
                <td class="govuk-table__cell">
                  <strong>
                    {i18n.t("docs.compliance_suites.core.room_versions")}
                  </strong>
                </td>
                <td class="govuk-table__cell">
                  <strong class="govuk-tag govuk-tag--red">
                    {i18n.t("docs.common.required")}
                  </strong>
                </td>
                <td class="govuk-table__cell">v1.11</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Advanced Features */}
      <h3 class="govuk-heading-m">
        {i18n.t("docs.compliance_suites.advanced_features_title")}
      </h3>
      <p class="govuk-body">
        {i18n.t("docs.compliance_suites.advanced_features_description")}
      </p>

      <div class="table-wrapper">
        <div class="table-scroll">
          <table class="govuk-table">
            <thead class="govuk-table__head">
              <tr class="govuk-table__row">
                <th scope="col" class="govuk-table__header">
                  {i18n.t("docs.compliance_suites.table.feature")}
                </th>
                <th scope="col" class="govuk-table__header">
                  {i18n.t("docs.compliance_suites.table.requirement")}
                </th>
                <th scope="col" class="govuk-table__header">
                  {i18n.t("docs.compliance_suites.table.spec_version")}
                </th>
              </tr>
            </thead>
            <tbody class="govuk-table__body">
              <tr class="govuk-table__row">
                <td class="govuk-table__cell">
                  <strong>
                    {i18n.t("docs.compliance_suites.advanced.e2ee")}
                  </strong>
                </td>
                <td class="govuk-table__cell">
                  <strong class="govuk-tag govuk-tag--yellow">
                    {i18n.t("docs.common.recommended")}
                  </strong>
                </td>
                <td class="govuk-table__cell">v1.11</td>
              </tr>
              <tr class="govuk-table__row">
                <td class="govuk-table__cell">
                  <strong>
                    {i18n.t("docs.compliance_suites.advanced.spaces")}
                  </strong>
                </td>
                <td class="govuk-table__cell">
                  <strong class="govuk-tag govuk-tag--yellow">
                    {i18n.t("docs.common.recommended")}
                  </strong>
                </td>
                <td class="govuk-table__cell">v1.11</td>
              </tr>
              <tr class="govuk-table__row">
                <td class="govuk-table__cell">
                  <strong>
                    {i18n.t("docs.compliance_suites.advanced.threading")}
                  </strong>
                </td>
                <td class="govuk-table__cell">
                  <strong class="govuk-tag govuk-tag--yellow">
                    {i18n.t("docs.common.recommended")}
                  </strong>
                </td>
                <td class="govuk-table__cell">v1.11</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Optional Features */}
      <h3 class="govuk-heading-m">
        {i18n.t("docs.compliance_suites.optional_features_title")}
      </h3>
      <p class="govuk-body">
        {i18n.t("docs.compliance_suites.optional_features_description")}
      </p>

      <div class="govuk-accordion" data-module="govuk-accordion">
        <div class="govuk-accordion__section">
          <div class="govuk-accordion__section-header">
            <h4 class="govuk-accordion__section-heading">
              <button
                type="button"
                class="govuk-accordion__section-button"
                aria-controls="accordion-optional-features"
                aria-expanded="false"
              >
                {i18n.t("docs.compliance_suites.optional_features_category")}
              </button>
            </h4>
          </div>
          <div
            id="accordion-optional-features"
            class="govuk-accordion__section-content"
          >
            <div class="table-wrapper">
              <div class="table-scroll">
                <table class="govuk-table">
                  <thead class="govuk-table__head">
                    <tr class="govuk-table__row">
                      <th scope="col" class="govuk-table__header">
                        {i18n.t("docs.compliance_suites.table.feature")}
                      </th>
                      <th scope="col" class="govuk-table__header">
                        {i18n.t("docs.compliance_suites.table.requirement")}
                      </th>
                      <th scope="col" class="govuk-table__header">
                        {i18n.t("docs.compliance_suites.table.spec_version")}
                      </th>
                    </tr>
                  </thead>
                  <tbody class="govuk-table__body">
                    <tr class="govuk-table__row">
                      <td class="govuk-table__cell">
                        <strong>
                          {i18n.t(
                            "docs.compliance_suites.optional.voice_video",
                          )}
                        </strong>
                      </td>
                      <td class="govuk-table__cell">
                        <strong class="govuk-tag govuk-tag--grey">
                          {i18n.t("docs.common.optional")}
                        </strong>
                      </td>
                      <td class="govuk-table__cell">v1.11</td>
                    </tr>
                    <tr class="govuk-table__row">
                      <td class="govuk-table__cell">
                        <strong>
                          {i18n.t("docs.compliance_suites.optional.presence")}
                        </strong>
                      </td>
                      <td class="govuk-table__cell">
                        <strong class="govuk-tag govuk-tag--grey">
                          {i18n.t("docs.common.optional")}
                        </strong>
                      </td>
                      <td class="govuk-table__cell">v1.11</td>
                    </tr>
                    <tr class="govuk-table__row">
                      <td class="govuk-table__cell">
                        <strong>
                          {i18n.t(
                            "docs.compliance_suites.optional.read_receipts",
                          )}
                        </strong>
                      </td>
                      <td class="govuk-table__cell">
                        <strong class="govuk-tag govuk-tag--grey">
                          {i18n.t("docs.common.optional")}
                        </strong>
                      </td>
                      <td class="govuk-table__cell">v1.11</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Implementation Notes */}
      <h2 class="govuk-heading-l">
        {i18n.t("docs.compliance_suites.implementation_notes_title")}
      </h2>

      <div class="govuk-inset-text">
        {i18n.t("docs.compliance_suites.implementation_notes_text")}
      </div>

      <ul class="govuk-list govuk-list--bullet">
        <li>{i18n.t("docs.compliance_suites.note_1")}</li>
        <li>{i18n.t("docs.compliance_suites.note_2")}</li>
        <li>{i18n.t("docs.compliance_suites.note_3")}</li>
      </ul>

      {/* Related Documentation */}
      <hr class="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

      <h2 class="govuk-heading-m">
        {i18n.t("docs.common.related_documentation")}
      </h2>
      <ul class="govuk-list">
        <li>
          <a href="/docs/federation-setup" class="govuk-link">
            {i18n.t("docs.nav.federation_setup")}
          </a>
        </li>
        <li>
          <a href="/docs/client-server-api" class="govuk-link">
            {i18n.t("docs.nav.client_server_api")}
          </a>
        </li>
      </ul>
    </DocsLayout>
  );
});
