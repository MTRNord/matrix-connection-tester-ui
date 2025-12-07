import { define } from "../../utils.ts";
import DocsLayout from "../../components/docs/DocsLayout.tsx";

export default define.page(function FederationSetup(ctx) {
  const { i18n } = ctx.state;
  const currentPath = ctx.url.pathname;

  return (
    <DocsLayout
      currentPath={currentPath}
      i18n={i18n}
      title={i18n.tString("docs.federation_setup.title")}
      description={i18n.tString("docs.federation_setup.description")}
    >
      {/* Introduction Section */}
      <h2 class="govuk-heading-l">
        {i18n.t("docs.federation_setup.what_is_federation_title")}
      </h2>
      <p class="govuk-body">
        {i18n.t("docs.federation_setup.what_is_federation_text")}
      </p>

      {/* Warning Callout */}
      <div class="govuk-warning-text">
        <span class="govuk-warning-text__icon" aria-hidden="true">!</span>
        <strong class="govuk-warning-text__text">
          <span class="govuk-visually-hidden">
            {i18n.t("docs.common.warning")}
          </span>
          {i18n.t("docs.federation_setup.warning_text")}
        </strong>
      </div>

      {/* Requirements Section */}
      <h2 class="govuk-heading-l">
        {i18n.t("docs.federation_setup.requirements_title")}
      </h2>

      <div class="table-wrapper">
        <div class="table-scroll">
          <table class="govuk-table">
            <caption class="govuk-table__caption govuk-table__caption--m">
              {i18n.t("docs.federation_setup.requirements_caption")}
            </caption>
            <thead class="govuk-table__head">
              <tr class="govuk-table__row">
                <th scope="col" class="govuk-table__header">
                  {i18n.t("docs.federation_setup.table.requirement")}
                </th>
                <th scope="col" class="govuk-table__header">
                  {i18n.t("docs.federation_setup.table.description")}
                </th>
                <th scope="col" class="govuk-table__header">
                  {i18n.t("docs.federation_setup.table.required")}
                </th>
              </tr>
            </thead>
            <tbody class="govuk-table__body">
              <tr class="govuk-table__row">
                <th scope="row" class="govuk-table__header">
                  {i18n.t("docs.federation_setup.table.valid_tls")}
                </th>
                <td class="govuk-table__cell">
                  {i18n.t("docs.federation_setup.table.valid_tls_desc")}
                </td>
                <td class="govuk-table__cell">
                  <strong class="govuk-tag govuk-tag--red">
                    {i18n.t("docs.common.required")}
                  </strong>
                </td>
              </tr>
              <tr class="govuk-table__row">
                <th scope="row" class="govuk-table__header">
                  {i18n.t("docs.federation_setup.table.wellknown")}
                </th>
                <td class="govuk-table__cell">
                  {i18n.t("docs.federation_setup.table.wellknown_desc")}
                </td>
                <td class="govuk-table__cell">
                  <strong class="govuk-tag govuk-tag--yellow">
                    {i18n.t("docs.common.recommended")}
                  </strong>
                </td>
              </tr>
              <tr class="govuk-table__row">
                <th scope="row" class="govuk-table__header">
                  {i18n.t("docs.federation_setup.table.srv_record")}
                </th>
                <td class="govuk-table__cell">
                  {i18n.t("docs.federation_setup.table.srv_record_desc")}
                </td>
                <td class="govuk-table__cell">
                  <strong class="govuk-tag govuk-tag--grey">
                    {i18n.t("docs.common.optional")}
                  </strong>
                </td>
              </tr>
              <tr class="govuk-table__row">
                <th scope="row" class="govuk-table__header">
                  {i18n.t("docs.federation_setup.table.port_8448")}
                </th>
                <td class="govuk-table__cell">
                  {i18n.t("docs.federation_setup.table.port_8448_desc")}
                </td>
                <td class="govuk-table__cell">
                  <strong class="govuk-tag govuk-tag--grey">
                    {i18n.t("docs.common.optional")}
                  </strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Setup Steps */}
      <h2 class="govuk-heading-l">
        {i18n.t("docs.federation_setup.setup_steps_title")}
      </h2>

      <ol class="govuk-list govuk-list--number">
        <li>
          <h3 class="govuk-heading-s">
            {i18n.t("docs.federation_setup.step_1_title")}
          </h3>
          <p class="govuk-body">
            {i18n.t("docs.federation_setup.step_1_text")}
          </p>
          <details class="govuk-details">
            <summary class="govuk-details__summary">
              <span class="govuk-details__summary-text">
                {i18n.t("docs.federation_setup.step_1_example")}
              </span>
            </summary>
            <div class="govuk-details__text">
              <pre class="govuk-!-font-size-16">
                <code>{`server_name: "example.com"`}</code>
              </pre>
            </div>
          </details>
        </li>

        <li>
          <h3 class="govuk-heading-s">
            {i18n.t("docs.federation_setup.step_2_title")}
          </h3>
          <p class="govuk-body">
            {i18n.t("docs.federation_setup.step_2_text")}
          </p>
        </li>

        <li>
          <h3 class="govuk-heading-s">
            {i18n.t("docs.federation_setup.step_3_title")}
          </h3>
          <p class="govuk-body">
            {i18n.t("docs.federation_setup.step_3_text")}
          </p>
          <details class="govuk-details">
            <summary class="govuk-details__summary">
              <span class="govuk-details__summary-text">
                {i18n.t("docs.federation_setup.step_3_options")}
              </span>
            </summary>
            <div class="govuk-details__text">
              <ol class="govuk-list govuk-list--number">
                <li>
                  <strong>
                    {i18n.t("docs.federation_setup.option_443_title")}
                  </strong>: {i18n.t("docs.federation_setup.option_443_text")}
                </li>
                <li>
                  <strong>
                    {i18n.t("docs.federation_setup.option_srv_title")}
                  </strong>: {i18n.t("docs.federation_setup.option_srv_text")}
                </li>
                <li>
                  <strong>
                    {i18n.t("docs.federation_setup.option_8448_title")}
                  </strong>: {i18n.t("docs.federation_setup.option_8448_text")}
                </li>
              </ol>
            </div>
          </details>
        </li>

        <li>
          <h3 class="govuk-heading-s">
            {i18n.t("docs.federation_setup.step_4_title")}
          </h3>
          <p class="govuk-body">
            {i18n.t("docs.federation_setup.step_4_text")}
          </p>
        </li>
      </ol>

      {/* Inset Text for Important Note */}
      <div class="govuk-inset-text">
        {i18n.t("docs.federation_setup.important_note")}
      </div>

      {/* Related Documentation */}
      <hr class="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

      <h2 class="govuk-heading-m">
        {i18n.t("docs.common.related_documentation")}
      </h2>
      <ul class="govuk-list">
        <li>
          <a href="/docs/tls-certificates" class="govuk-link">
            {i18n.t("docs.nav.tls_certificates")}
          </a>
        </li>
        <li>
          <a href="/docs/wellknown-delegation" class="govuk-link">
            {i18n.t("docs.nav.wellknown_delegation")}
          </a>
        </li>
        <li>
          <a href="/docs/federation-network" class="govuk-link">
            {i18n.t("docs.nav.federation_network")}
          </a>
        </li>
      </ul>
    </DocsLayout>
  );
});
