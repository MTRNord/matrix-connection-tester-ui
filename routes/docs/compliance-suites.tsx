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
      {/* Document Metadata */}
      <div class="table-wrapper">
        <div class="table-scroll">
          <table class="govuk-table">
            <caption class="govuk-visually-hidden">
              {i18n.t("docs.compliance_suites.metadata.abstract_label")}
            </caption>
            <tbody class="govuk-table__body">
              <tr class="govuk-table__row">
                <th scope="row" class="govuk-table__header" style="width: 20%">
                  {i18n.t("docs.compliance_suites.metadata.abstract_label")}
                </th>
                <td class="govuk-table__cell">
                  {i18n.t("docs.compliance_suites.metadata.abstract_text")}
                </td>
              </tr>
              <tr class="govuk-table__row">
                <th scope="row" class="govuk-table__header">
                  {i18n.t("docs.compliance_suites.metadata.author_label")}
                </th>
                <td class="govuk-table__cell">
                  {i18n.t("docs.compliance_suites.metadata.author_name")}
                </td>
              </tr>
              <tr class="govuk-table__row">
                <th scope="row" class="govuk-table__header">
                  {i18n.t("docs.compliance_suites.metadata.copyright_label")}
                </th>
                <td class="govuk-table__cell">
                  {i18n.t("docs.compliance_suites.metadata.copyright_text")}
                </td>
              </tr>
              <tr class="govuk-table__row">
                <th scope="row" class="govuk-table__header">
                  {i18n.t("docs.compliance_suites.metadata.status_label")}
                </th>
                <td class="govuk-table__cell">
                  <strong class="govuk-tag govuk-tag--yellow">
                    {i18n.t("docs.compliance_suites.metadata.status_draft")}
                  </strong>
                </td>
              </tr>
              <tr class="govuk-table__row">
                <th scope="row" class="govuk-table__header">
                  {i18n.t("docs.compliance_suites.metadata.version_label")}
                </th>
                <td class="govuk-table__cell">
                  {i18n.t("docs.compliance_suites.metadata.version_number")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Introduction */}
      <h2 class="govuk-heading-l">
        {i18n.t("docs.compliance_suites.intro.heading")}
      </h2>

      <p class="govuk-body">
        {i18n.t("docs.compliance_suites.intro.para1")}
      </p>

      {/* Important Notice */}
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
            {i18n.t("docs.compliance_suites.warning.important_heading")}
          </h2>
        </div>
        <div class="govuk-notification-banner__content">
          <p
            class="govuk-notification-banner__heading"
            dangerouslySetInnerHTML={{
              __html: i18n.tString(
                "docs.compliance_suites.warning.unofficial_notice",
              ),
            }}
          />
        </div>
      </div>

      {/* Warning about incomplete status */}
      <div class="govuk-warning-text">
        <span class="govuk-warning-text__icon" aria-hidden="true">!</span>
        <strong class="govuk-warning-text__text">
          <span class="govuk-visually-hidden">
            {i18n.t("docs.common.warning")}
          </span>
          <span
            dangerouslySetInnerHTML={{
              __html: i18n.tString(
                "docs.compliance_suites.warning.incomplete_text",
              ),
            }}
          />
        </strong>
      </div>

      <p
        class="govuk-body"
        dangerouslySetInnerHTML={{
          __html: i18n.tString("docs.compliance_suites.intro.para2"),
        }}
      />

      <div class="govuk-inset-text">
        <strong>
          {i18n.t("docs.compliance_suites.privacy_note.heading")}
        </strong>{" "}
        {i18n.t("docs.compliance_suites.privacy_note.text")}
      </div>

      <h3 class="govuk-heading-m">
        {i18n.t("docs.compliance_suites.audience.heading")}
      </h3>

      <p class="govuk-body">
        <strong>
          {i18n.t("docs.compliance_suites.audience.developers_label")}
        </strong>{" "}
        {i18n.t("docs.compliance_suites.audience.developers_text")}
      </p>

      <p class="govuk-body">
        <strong>
          {i18n.t("docs.compliance_suites.audience.users_label")}
        </strong>{" "}
        {i18n.t("docs.compliance_suites.audience.users_text")}
      </p>

      <p class="govuk-body">
        <strong>
          {i18n.t("docs.compliance_suites.audience.integrators_label")}
        </strong>{" "}
        {i18n.t("docs.compliance_suites.audience.integrators_text")}
      </p>

      <p
        class="govuk-body"
        dangerouslySetInnerHTML={{
          __html: i18n.tString("docs.compliance_suites.audience.general_note"),
        }}
      />

      <div class="govuk-inset-text">
        <strong>{i18n.t("docs.compliance_suites.rfc2119.heading")}</strong>{" "}
        {i18n.t("docs.compliance_suites.rfc2119.text")}{" "}
        <a
          href="https://www.rfc-editor.org/info/rfc2119"
          class="govuk-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          RFC2119
        </a>{" "}
        {i18n.t("docs.common.and")}{" "}
        <a
          href="https://www.rfc-editor.org/info/rfc8174"
          class="govuk-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          RFC8174
        </a>{" "}
        when, and only when, they appear in all capitals, as shown here.
        <br />
        <br />
        {i18n.t("docs.compliance_suites.rfc2119.can_note")}
      </div>

      {/* Compliance Categories */}
      <h2 class="govuk-heading-l" id="compliance-categories">
        {i18n.t("docs.compliance_suites.categories.heading")}
      </h2>

      {/* Core Compliance Suite */}
      <h3 class="govuk-heading-m" id="core-compliance">
        {i18n.t("docs.compliance_suites.core.heading")}
      </h3>

      <div class="table-wrapper">
        <div class="table-scroll">
          <table class="govuk-table">
            <caption class="govuk-visually-hidden">
              {i18n.t("docs.compliance_suites.core.heading")}
            </caption>
            <thead class="govuk-table__head">
              <tr class="govuk-table__row">
                <th scope="col" class="govuk-table__header">
                  {i18n.t("docs.compliance_suites.table.feature")}
                </th>
                <th scope="col" class="govuk-table__header">
                  {i18n.t("docs.compliance_suites.table.server")}
                </th>
                <th scope="col" class="govuk-table__header">
                  {i18n.t("docs.compliance_suites.table.client")}
                </th>
                <th scope="col" class="govuk-table__header">
                  {i18n.t("docs.compliance_suites.table.advanced_server")}
                </th>
                <th scope="col" class="govuk-table__header">
                  {i18n.t("docs.compliance_suites.table.advanced_client")}
                </th>
                <th scope="col" class="govuk-table__header">
                  {i18n.t("docs.compliance_suites.table.privacy_server")}
                </th>
                <th scope="col" class="govuk-table__header">
                  {i18n.t("docs.compliance_suites.table.privacy_client")}
                </th>
                <th scope="col" class="govuk-table__header">
                  {i18n.t("docs.compliance_suites.table.providers")}
                </th>
              </tr>
            </thead>
            <tbody class="govuk-table__body">
              <tr class="govuk-table__row">
                <td class="govuk-table__cell">
                  <strong>
                    {i18n.t("docs.compliance_suites.core.feature_wellknown_cs")}
                  </strong>
                </td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">
                  <a
                    href="https://spec.matrix.org/v1.14/client-server-api/#server-discovery"
                    class="govuk-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Server Discovery
                  </a>
                </td>
              </tr>
              <tr class="govuk-table__row">
                <td class="govuk-table__cell">
                  <strong>
                    {i18n.t("docs.compliance_suites.core.feature_wellknown_ss")}
                  </strong>
                </td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">
                  <a
                    href="https://spec.matrix.org/v1.14/client-server-api/#server-discovery"
                    class="govuk-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Server Discovery
                  </a>
                </td>
              </tr>
              <tr class="govuk-table__row">
                <td class="govuk-table__cell">
                  <strong>
                    {i18n.t("docs.compliance_suites.core.feature_password_uia")}
                  </strong>
                </td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">
                  ✕<sup>1</sup>
                </td>
                <td class="govuk-table__cell">
                  ✕<sup>1</sup>
                </td>
                <td class="govuk-table__cell">
                  <a
                    href="https://spec.matrix.org/v1.14/client-server-api/#login"
                    class="govuk-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Login API
                  </a>{" "}
                  and Password UIA
                </td>
              </tr>
              <tr class="govuk-table__row">
                <td class="govuk-table__cell">
                  <strong>
                    {i18n.t("docs.compliance_suites.core.feature_sso")}
                  </strong>
                </td>
                <td class="govuk-table__cell">✕</td>
                <td class="govuk-table__cell">✕</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">
                  <a
                    href="https://spec.matrix.org/v1.14/client-server-api/#sso-client-loginauthentication"
                    class="govuk-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    SSO Authentication API
                  </a>
                </td>
              </tr>
              <tr class="govuk-table__row">
                <td class="govuk-table__cell">
                  <strong>
                    {i18n.t("docs.compliance_suites.core.feature_registration")}
                  </strong>
                </td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">
                  ✕<sup>1</sup>
                </td>
                <td class="govuk-table__cell">
                  ✕<sup>1</sup>
                </td>
                <td class="govuk-table__cell">
                  <a
                    href="https://spec.matrix.org/v1.14/client-server-api/#post_matrixclientv3register"
                    class="govuk-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Registration API
                  </a>
                </td>
              </tr>
              <tr class="govuk-table__row">
                <td class="govuk-table__cell">
                  <strong>
                    {i18n.t("docs.compliance_suites.core.feature_tos")}
                  </strong>
                </td>
                <td class="govuk-table__cell">✕</td>
                <td class="govuk-table__cell">✕</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">
                  ✕<sup>1</sup>
                </td>
                <td class="govuk-table__cell">
                  ✕<sup>1</sup>
                </td>
                <td class="govuk-table__cell">
                  <a
                    href="https://spec.matrix.org/v1.14/client-server-api/#terms-of-service-at-registration"
                    class="govuk-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Terms of service at registration API
                  </a>
                </td>
              </tr>
              <tr class="govuk-table__row">
                <td class="govuk-table__cell">
                  <strong>
                    {i18n.t("docs.compliance_suites.core.feature_token_reg")}
                  </strong>
                </td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">
                  ✕<sup>1</sup>
                </td>
                <td class="govuk-table__cell">
                  ✕<sup>1</sup>
                </td>
                <td class="govuk-table__cell">
                  <a
                    href="https://spec.matrix.org/v1.14/client-server-api/#token-authenticated-registration"
                    class="govuk-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Token-authenticated API
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p class="govuk-body govuk-body-s">
        <sup>1</sup>{" "}
        {i18n.t("docs.compliance_suites.core.footnote_privacy_registration")}
      </p>

      {/* Instant Messaging Compliance Suite */}
      <h3 class="govuk-heading-m" id="im-compliance">
        {i18n.t("docs.compliance_suites.im.heading")}
      </h3>

      <p class="govuk-body">
        {i18n.t("docs.compliance_suites.im.intro")}
      </p>

      <p class="govuk-body">
        {i18n.t("docs.compliance_suites.im.note")}{" "}
        <a
          href="https://spec.matrix.org/v1.14/client-server-api/#instant-messaging"
          class="govuk-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          Instant Messaging module
        </a>{" "}
        of the specification for further things to consider.
      </p>

      <div class="table-wrapper">
        <div class="table-scroll">
          <table class="govuk-table">
            <caption class="govuk-visually-hidden">
              {i18n.t("docs.compliance_suites.im.heading")}
            </caption>
            <thead class="govuk-table__head">
              <tr class="govuk-table__row">
                <th scope="col" class="govuk-table__header">
                  {i18n.t("docs.compliance_suites.table.feature")}
                </th>
                <th scope="col" class="govuk-table__header">
                  {i18n.t("docs.compliance_suites.table.server")}
                </th>
                <th scope="col" class="govuk-table__header">
                  {i18n.t("docs.compliance_suites.table.client")}
                </th>
                <th scope="col" class="govuk-table__header">
                  {i18n.t("docs.compliance_suites.table.advanced_server")}
                </th>
                <th scope="col" class="govuk-table__header">
                  {i18n.t("docs.compliance_suites.table.advanced_client")}
                </th>
                <th scope="col" class="govuk-table__header">
                  {i18n.t("docs.compliance_suites.table.privacy_server")}
                </th>
                <th scope="col" class="govuk-table__header">
                  {i18n.t("docs.compliance_suites.table.privacy_client")}
                </th>
                <th scope="col" class="govuk-table__header">
                  {i18n.t("docs.compliance_suites.table.providers")}
                </th>
              </tr>
            </thead>
            <tbody class="govuk-table__body">
              <tr class="govuk-table__row">
                <td class="govuk-table__cell">
                  <strong>
                    {i18n.t("docs.compliance_suites.im.feature_media")}
                  </strong>
                </td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">
                  <a
                    href="https://spec.matrix.org/v1.14/client-server-api/#content-repository"
                    class="govuk-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Media Repository
                  </a>
                </td>
              </tr>
              <tr class="govuk-table__row">
                <td class="govuk-table__cell">
                  <strong>
                    {i18n.t("docs.compliance_suites.im.feature_sync")}
                  </strong>
                </td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">
                  <a
                    href="https://spec.matrix.org/v1.14/client-server-api/#get_matrixclientv3sync"
                    class="govuk-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Sync API
                  </a>
                </td>
              </tr>
              <tr class="govuk-table__row">
                <td class="govuk-table__cell">
                  <strong>
                    {i18n.t("docs.compliance_suites.im.feature_messages")}
                  </strong>
                </td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">
                  <a
                    href="https://spec.matrix.org/v1.14/client-server-api/#mroommessage"
                    class="govuk-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Room Message type
                  </a>{" "}
                  {i18n.t("docs.common.and")}{" "}
                  <a
                    href="https://spec.matrix.org/v1.14/client-server-api/#mroommessage-msgtypes"
                    class="govuk-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    message types
                  </a>
                </td>
              </tr>
              <tr class="govuk-table__row">
                <td class="govuk-table__cell">
                  <strong>
                    {i18n.t("docs.compliance_suites.im.feature_location")}
                  </strong>
                </td>
                <td class="govuk-table__cell">N/A</td>
                <td class="govuk-table__cell">✕</td>
                <td class="govuk-table__cell">N/A</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">N/A</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">
                  <a
                    href="https://spec.matrix.org/v1.14/client-server-api/#mlocation"
                    class="govuk-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Location Message type
                  </a>
                </td>
              </tr>
              <tr class="govuk-table__row">
                <td class="govuk-table__cell">
                  <strong>
                    {i18n.t("docs.compliance_suites.im.feature_math")}
                  </strong>
                </td>
                <td class="govuk-table__cell">N/A</td>
                <td class="govuk-table__cell">✕</td>
                <td class="govuk-table__cell">N/A</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">N/A</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">
                  <a
                    href="https://spec.matrix.org/v1.14/client-server-api/#mathematical-messages"
                    class="govuk-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Mathematical Message type
                  </a>
                </td>
              </tr>
              <tr class="govuk-table__row">
                <td class="govuk-table__cell">
                  <strong>
                    {i18n.t("docs.compliance_suites.im.feature_replies")}
                  </strong>
                </td>
                <td class="govuk-table__cell">N/A</td>
                <td class="govuk-table__cell">✕</td>
                <td class="govuk-table__cell">N/A</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">N/A</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">
                  <a
                    href="https://spec.matrix.org/v1.14/client-server-api/#rich-replies"
                    class="govuk-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Rich Replies API
                  </a>
                </td>
              </tr>
              <tr class="govuk-table__row">
                <td class="govuk-table__cell">
                  <strong>
                    {i18n.t("docs.compliance_suites.im.feature_mentions_users")}
                  </strong>
                </td>
                <td class="govuk-table__cell">N/A</td>
                <td class="govuk-table__cell">✕</td>
                <td class="govuk-table__cell">N/A</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">N/A</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">
                  <a
                    href="https://spec.matrix.org/v1.14/client-server-api/#user-and-room-mentions"
                    class="govuk-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Mentions API
                  </a>
                </td>
              </tr>
              <tr class="govuk-table__row">
                <td class="govuk-table__cell">
                  <strong>
                    {i18n.t("docs.compliance_suites.im.feature_mentions_rooms")}
                  </strong>
                </td>
                <td class="govuk-table__cell">N/A</td>
                <td class="govuk-table__cell">✕</td>
                <td class="govuk-table__cell">N/A</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">N/A</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">
                  <a
                    href="https://spec.matrix.org/v1.14/client-server-api/#user-and-room-mentions"
                    class="govuk-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Mentions API
                  </a>
                </td>
              </tr>
              <tr class="govuk-table__row">
                <td class="govuk-table__cell">
                  <strong>
                    {i18n.t("docs.compliance_suites.im.feature_room_state")}
                  </strong>
                </td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">
                  <a
                    href="https://spec.matrix.org/v1.14/client-server-api/#mroomname"
                    class="govuk-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Room Name
                  </a>,{" "}
                  <a
                    href="https://spec.matrix.org/v1.14/client-server-api/#mroomtopic"
                    class="govuk-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Room Topic
                  </a>,{" "}
                  <a
                    href="https://spec.matrix.org/v1.14/client-server-api/#mroomavatar"
                    class="govuk-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Room Avatar
                  </a>
                </td>
              </tr>
              <tr class="govuk-table__row">
                <td class="govuk-table__cell">
                  <strong>
                    {i18n.t("docs.compliance_suites.im.feature_pinned")}
                  </strong>
                </td>
                <td class="govuk-table__cell">✕</td>
                <td class="govuk-table__cell">✕</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">✓</td>
                <td class="govuk-table__cell">
                  <a
                    href="https://spec.matrix.org/v1.14/client-server-api/#mroompinned_events"
                    class="govuk-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Pinned Events API
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Other Compliance Suites */}
      <h3 class="govuk-heading-m" id="other-suites">
        {i18n.t("docs.compliance_suites.other_suites.heading")}
      </h3>

      <p class="govuk-body">
        {i18n.t("docs.compliance_suites.other_suites.intro")}
      </p>

      <ul class="govuk-list govuk-list--bullet">
        <li>
          <strong>
            {i18n.t("docs.compliance_suites.other_suites.audio_video")}
          </strong>{" "}
          - {i18n.t("docs.compliance_suites.other_suites.tbd")}
        </li>
        <li>
          <strong>
            {i18n.t("docs.compliance_suites.other_suites.bot")}
          </strong>{" "}
          - {i18n.t("docs.compliance_suites.other_suites.tbd")}
        </li>
        <li>
          <strong>
            {i18n.t("docs.compliance_suites.other_suites.bridge")}
          </strong>{" "}
          - {i18n.t("docs.compliance_suites.other_suites.tbd")}
        </li>
      </ul>

      <p class="govuk-body">
        {i18n.t("docs.compliance_suites.other_suites.note")}
      </p>

      {/* Future Development */}
      <h2 class="govuk-heading-l" id="future-development">
        {i18n.t("docs.compliance_suites.future.heading")}
      </h2>

      <p class="govuk-body">
        {i18n.t("docs.compliance_suites.future.intro")}
      </p>

      <h3 class="govuk-heading-m" id="widget-compliance">
        {i18n.t("docs.compliance_suites.future.widget_heading")}
      </h3>

      <p class="govuk-body">
        {i18n.t("docs.compliance_suites.future.widget_intro")}
      </p>

      <div class="govuk-inset-text">
        <p class="govuk-body">
          <strong>{i18n.t("docs.common.note")}</strong>{" "}
          {i18n.t("docs.compliance_suites.future.widget_note_msc")}
        </p>
        <p class="govuk-body">
          {i18n.t("docs.compliance_suites.future.widget_note_client")}
        </p>
      </div>

      <p class="govuk-body">
        {i18n.t("docs.compliance_suites.future.widget_status")}
      </p>

      {/* Implementation Notes */}
      <h2 class="govuk-heading-l" id="implementation-notes">
        {i18n.t("docs.compliance_suites.implementation.heading")}
      </h2>

      <p class="govuk-body">
        {i18n.t("docs.compliance_suites.implementation.text")}
      </p>

      {/* Security Considerations */}
      <h2 class="govuk-heading-l" id="security">
        {i18n.t("docs.compliance_suites.security.heading")}
      </h2>

      <p class="govuk-body">
        {i18n.t("docs.compliance_suites.security.text")}
      </p>

      {/* Acknowledgements */}
      <h2 class="govuk-heading-l" id="acknowledgements">
        {i18n.t("docs.compliance_suites.acknowledgements.heading")}
      </h2>

      <p class="govuk-body">
        {i18n.t("docs.compliance_suites.acknowledgements.text")}{" "}
        <a
          href="https://xmpp.org/extensions/xep-0479.html"
          class="govuk-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          XEP-0479
        </a>{" "}
        and prior work on compliance suites. The idea of having a compliance
        suite for the Matrix protocol was inspired by their work and we thank
        them for their efforts in this area.
      </p>

      {/* Related Documentation */}
      <hr class="govuk-section-break govuk-section-break--l govuk-section-break--visible" />

      <h2 class="govuk-heading-m">
        {i18n.t("docs.compliance_suites.related.heading")}
      </h2>
      <ul class="govuk-list">
        <li>
          <a href="/docs/federation-setup" class="govuk-link">
            {i18n.t("docs.compliance_suites.related.federation_setup")}
          </a>
        </li>
        <li>
          <a href="/docs/client-server-api" class="govuk-link">
            {i18n.t("docs.compliance_suites.related.client_server_api")}
          </a>
        </li>
        <li>
          <a
            href="https://spec.matrix.org/v1.14/"
            class="govuk-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            {i18n.t("docs.compliance_suites.related.matrix_spec")}
          </a>
        </li>
      </ul>
    </DocsLayout>
  );
});
