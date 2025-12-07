import { define } from "../../utils.ts";
import DocsLayout from "../../components/docs/DocsLayout.tsx";

export default define.page(function ComplianceSuites(ctx) {
  const { i18n } = ctx.state;
  const currentPath = ctx.url.pathname;

  return (
    <DocsLayout
      currentPath={currentPath}
      i18n={i18n}
      title="Unofficial Compliance Suites 2025"
      description="Matrix application compliance categories and requirements for different use cases"
    >
      {/* Document Metadata */}
      <div class="table-wrapper">
        <div class="table-scroll">
          <table class="govuk-table">
            <caption class="govuk-visually-hidden">
              Document Metadata
            </caption>
            <tbody class="govuk-table__body">
              <tr class="govuk-table__row">
                <th scope="row" class="govuk-table__header" style="width: 20%">
                  Abstract
                </th>
                <td class="govuk-table__cell">
                  This document defines Matrix application categories for
                  different use cases (Core, IM, Social, ...), and specifies the
                  required spec and MSCs that client and server software needs
                  to implement for compliance with the use cases.
                </td>
              </tr>
              <tr class="govuk-table__row">
                <th scope="row" class="govuk-table__header">
                  Author
                </th>
                <td class="govuk-table__cell">MTRNord</td>
              </tr>
              <tr class="govuk-table__row">
                <th scope="row" class="govuk-table__header">
                  Copyright
                </th>
                <td class="govuk-table__cell">CC-BY-SA 4.0</td>
              </tr>
              <tr class="govuk-table__row">
                <th scope="row" class="govuk-table__header">
                  Status
                </th>
                <td class="govuk-table__cell">
                  <strong class="govuk-tag govuk-tag--yellow">Draft</strong>
                </td>
              </tr>
              <tr class="govuk-table__row">
                <th scope="row" class="govuk-table__header">
                  Version
                </th>
                <td class="govuk-table__cell">0.1.0</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Introduction */}
      <h2 class="govuk-heading-l">Introduction</h2>

      <p class="govuk-body">
        With growing interest in the Matrix protocol, there is a need for a
        clear understanding of what is required to implement specific features
        and use cases. This document aims to provide a comprehensive overview of
        the requirements for different Matrix application categories, including
        the necessary specifications and MSCs (Matrix Specification Changes)
        that client and server software must implement for compliance.
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
            Important
          </h2>
        </div>
        <div class="govuk-notification-banner__content">
          <p class="govuk-notification-banner__heading">
            Note that this document is an{" "}
            <strong>unofficial compliance suite</strong> and is{" "}
            <strong>
              not maintained by the Matrix.org team or the Matrix Foundation
            </strong>. This has{" "}
            <strong>not been vetted by the Spec Core Team (SCT)</strong>. It is
            based on the experience of building and designing multiple Matrix
            applications in various contexts, including the public sector and
            the TI-Messenger context.
          </p>
        </div>
      </div>

      {/* Warning about incomplete status */}
      <div class="govuk-warning-text">
        <span class="govuk-warning-text__icon" aria-hidden="true">!</span>
        <strong class="govuk-warning-text__text">
          <span class="govuk-visually-hidden">Warning</span>
          This document is currently{" "}
          <strong>incomplete</strong>. Several compliance suites (Audio/Video,
          Bot, Bridge) are still under development and do not yet have defined
          requirements. The Widget Compliance Suite is also in draft status.
        </strong>
      </div>

      <p class="govuk-body">
        This document defines Matrix application <strong>Categories</strong>
        {" "}
        based on typical use cases (Core, IM, ...) and <strong>Levels</strong>
        {" "}
        (Core, Advanced, Privacy) based on the functionality in the respective
        category. For each combination of those, the required spec and MSCs are
        listed. As the protocol evolves, we plan to publish new versions of this
        document to keep it up to date with the latest developments in the
        Matrix ecosystem.
      </p>

      <div class="govuk-inset-text">
        <strong>Privacy:</strong>{" "}
        In this context refers to implementors that require a higher level of
        privacy and security for their users, such as in the public sector or in
        the context of sensitive data. This includes features like end-to-end
        encryption, data minimization, and other privacy-preserving measures. At
        the time of writing this document, this information is mainly based upon
        experiences with VS-NfD concepts in Germany.
      </div>

      <h3 class="govuk-heading-m">Intended Audience</h3>

      <p class="govuk-body">
        <strong>For developers:</strong>{" "}
        This document provides guidance on which specifications and MSCs they
        need to consider when implementing an application of a certain kind. At
        this time however we do not provide a test suite or any other means of
        testing compliance with this document.
      </p>

      <p class="govuk-body">
        <strong>For users:</strong>{" "}
        This provides an easy way to compare implementations based on their
        respective advertised compliance levels and year. However since we do
        not provide a test suite, the compliance level is not guaranteed to be
        correct. We recommend to check the implementation against the
        requirements in this document before using it in production at this
        time.
      </p>

      <p class="govuk-body">
        <strong>For integrators:</strong>{" "}
        This document provides a starting point for understanding the
        implications of implementing specific features and MSCs. It also serves
        as a reference for evaluating the compliance of different Matrix
        implementations with the requirements outlined in this document.
      </p>

      <p class="govuk-body">
        Unless explicitly noted, support for the listed specifications is{" "}
        <strong>REQUIRED</strong>{" "}
        for compliance purposes. A feature is considered supported if all comma
        separated feature providers listed in the "Providers" column are
        implemented (unless otherwise noted).
      </p>

      <div class="govuk-inset-text">
        <strong>RFC 2119 Keywords:</strong>{" "}
        The keywords "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT",
        "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and
        "OPTIONAL" in this document are to be interpreted as described in BCP 14
        {" "}
        <a
          href="https://www.rfc-editor.org/info/rfc2119"
          class="govuk-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          RFC2119
        </a>{" "}
        and{" "}
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
        The word "can" (not "may") is used to refer to a possible circumstance
        or situation, as opposed to an optional facility of the protocol.
      </div>

      {/* Compliance Categories */}
      <h2 class="govuk-heading-l" id="compliance-categories">
        Compliance Categories
      </h2>

      {/* Core Compliance Suite */}
      <h3 class="govuk-heading-m" id="core-compliance">
        Core Compliance Suite
      </h3>

      <div class="table-wrapper">
        <div class="table-scroll">
          <table class="govuk-table">
            <caption class="govuk-visually-hidden">
              Core Compliance Suite Requirements
            </caption>
            <thead class="govuk-table__head">
              <tr class="govuk-table__row">
                <th scope="col" class="govuk-table__header">Feature</th>
                <th scope="col" class="govuk-table__header">Server</th>
                <th scope="col" class="govuk-table__header">Client</th>
                <th scope="col" class="govuk-table__header">Advanced Server</th>
                <th scope="col" class="govuk-table__header">Advanced Client</th>
                <th scope="col" class="govuk-table__header">Privacy Server</th>
                <th scope="col" class="govuk-table__header">Privacy Client</th>
                <th scope="col" class="govuk-table__header">Providers</th>
              </tr>
            </thead>
            <tbody class="govuk-table__body">
              <tr class="govuk-table__row">
                <td class="govuk-table__cell">
                  <strong>Well-Known Client-Server Discovery</strong>
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
                  <strong>Well-Known Server-Server Discovery</strong>
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
                  <strong>Password UIA Authentication</strong>
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
                  <strong>SSO Authentication</strong>
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
                  <strong>User Registration</strong>
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
                  <strong>Terms of service at registration</strong>
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
                  <strong>Token-authenticated registration</strong>
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
        We expect privacy category to implement no registration and instead rely
        on an external identity provider.
      </p>

      {/* Instant Messaging Compliance Suite */}
      <h3 class="govuk-heading-m" id="im-compliance">
        Instant Messaging Compliance Suite
      </h3>

      <p class="govuk-body">
        To be considered instant messaging compliant, all features from the core
        compliance category must be met, as well as all features in this suite.
      </p>

      <p class="govuk-body">
        See also the{" "}
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
              Instant Messaging Compliance Suite Requirements
            </caption>
            <thead class="govuk-table__head">
              <tr class="govuk-table__row">
                <th scope="col" class="govuk-table__header">Feature</th>
                <th scope="col" class="govuk-table__header">Server</th>
                <th scope="col" class="govuk-table__header">Client</th>
                <th scope="col" class="govuk-table__header">Advanced Server</th>
                <th scope="col" class="govuk-table__header">Advanced Client</th>
                <th scope="col" class="govuk-table__header">Privacy Server</th>
                <th scope="col" class="govuk-table__header">Privacy Client</th>
                <th scope="col" class="govuk-table__header">Providers</th>
              </tr>
            </thead>
            <tbody class="govuk-table__body">
              <tr class="govuk-table__row">
                <td class="govuk-table__cell">
                  <strong>Content Repository (Media)</strong>
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
                  <strong>Sync</strong>
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
                  <strong>Room Messages</strong>
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
                  and{" "}
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
                  <strong>Location Messages</strong>
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
                  <strong>Mathematical Messages (LaTeX)</strong>
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
                  <strong>Rich Replies</strong>
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
                  <strong>Mentioning Users</strong>
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
                  <strong>Mentioning Rooms</strong>
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
                  <strong>Core Room State Events</strong>
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
                  <strong>Pinned Events</strong>
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
      <h3 class="govuk-heading-m" id="other-suites">Other Compliance Suites</h3>

      <p class="govuk-body">
        The following compliance suites are defined but requirements are still
        being developed:
      </p>

      <ul class="govuk-list govuk-list--bullet">
        <li>
          <strong>Audio/Video Compliance Suite</strong>{" "}
          - Requirements to be defined
        </li>
        <li>
          <strong>Bot Compliance Suite</strong> - Requirements to be defined
        </li>
        <li>
          <strong>Bridge Compliance Suite</strong> - Requirements to be defined
        </li>
      </ul>

      <p class="govuk-body">
        To be considered compliant with any of these suites, all features from
        the core compliance category must be met, as well as all features in the
        respective suite once defined.
      </p>

      {/* Future Development */}
      <h2 class="govuk-heading-l" id="future-development">
        Future Development
      </h2>

      <p class="govuk-body">
        This section outlines the protocol specifications that are relevant for
        developers, but are not ready yet to be required for Compliance.
        Developers are encouraged to implement those and to share their
        experience and feedback on the respective MSCs. This will help to
        improve the specifications and to make them ready for compliance in the
        future.
      </p>

      <h3 class="govuk-heading-m" id="widget-compliance">
        Widget Compliance Suite
      </h3>

      <p class="govuk-body">
        While widgets are already used by Element-Web, Element-Call and
        companies like Nordeck, the MSCs haven't yet been finalized and accepted
        by the SCT. Therefore, we do not require them for compliance at this
        time. However, we still provide guidance on what we think is required
        for a widget compliance suite.
      </p>

      <div class="govuk-inset-text">
        <p class="govuk-body">
          <strong>Note:</strong>{" "}
          Since the widget MSCs are generally not fully up to date we will
          partially refer to implementations of clients and SDKs instead of the
          MSCs. This is to provide a more accurate overview of what is required
          for compliance.
        </p>
        <p class="govuk-body">
          The widget API is fully client side. Hence, we do not provide a server
          compliance suite for this usecase but instead a widget compliance
          type. Clients are considered a widget host in this context.
        </p>
      </div>

      <p class="govuk-body">
        Widget compliance requirements are under active development. Check back
        for updates as the MSCs progress through the specification process.
      </p>

      {/* Implementation Notes */}
      <h2 class="govuk-heading-l" id="implementation-notes">
        Implementation Notes
      </h2>

      <p class="govuk-body">
        Some of the protocol specifications referenced herein have their own
        dependencies; developers need to consult the relevant specifications for
        further information.
      </p>

      {/* Security Considerations */}
      <h2 class="govuk-heading-l" id="security">Security Considerations</h2>

      <p class="govuk-body">
        This document introduces no additional security considerations above and
        beyond those defined in the documents on which it depends.
      </p>

      {/* Acknowledgements */}
      <h2 class="govuk-heading-l" id="acknowledgements">Acknowledgements</h2>

      <p class="govuk-body">
        This document is heavily leaning on the work of the XMPP community in
        {" "}
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

      <h2 class="govuk-heading-m">Related Documentation</h2>
      <ul class="govuk-list">
        <li>
          <a href="/docs/federation-setup" class="govuk-link">
            Federation Setup
          </a>
        </li>
        <li>
          <a href="/docs/client-server-api" class="govuk-link">
            Client-Server API
          </a>
        </li>
        <li>
          <a
            href="https://spec.matrix.org/v1.14/"
            class="govuk-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            Matrix Specification v1.14
          </a>
        </li>
      </ul>
    </DocsLayout>
  );
});
