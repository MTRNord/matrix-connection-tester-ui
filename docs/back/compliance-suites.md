---
title: Unofficial Compliance Suites 2025
description: Unofficial compliance requirements and feature categories for Matrix applications (not vetted by SCT)
---

# Unofficial Compliance Suites 2025

## Document Metadata

|               |                                                                                                                                                                                                                                     |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Abstract**  | This document defines Matrix application categories for different use cases (Core, IM, Social, ...), and specifies the required spec and MSCs that client and server software needs to implement for compliance with the use cases. |
| **Author**    | MTRNord                                                                                                                                                                                                                             |
| **Copyright** | CC-BY-SA 4.0                                                                                                                                                                                                                        |
| **Status**    | <strong class="govuk-tag govuk-tag--grey">Draft</strong>                                                                                                                                                                            |
| **Version**   | 0.1.0                                                                                                                                                                                                                               |

## Introduction

With growing interest in the Matrix protocol, there is a need for a clear understanding of what is required to implement specific features and use cases. This document aims to provide a comprehensive overview of the requirements for different Matrix application categories, including the necessary specifications and MSCs (Matrix Specification Changes) that client and server software must implement for compliance.

:::warning
**Important:** Note that this document is an **unofficial compliance suite** and is **not maintained by the Matrix.org team or the Matrix Foundation**. This has **not been vetted by the Spec Core Team (SCT)**. It is based on the experience of building and designing multiple Matrix applications in various contexts, including the public sector and the TI-Messenger context.
:::

:::warning
This document is currently **incomplete**. Several compliance suites (Audio/Video, Bot, Bridge) are still under development and do not yet have defined requirements. The Widget Compliance Suite is also in draft status pending MSC finalization.
:::

This document defines Matrix application **Categories** based on typical use cases (Core, IM, ...) and **Levels** (Core, Advanced, Privacy) based on the functionality in the respective category. For each combination of those, the required spec and MSCs are listed. As the protocol evolves, we plan to publish new versions of this document to keep it up to date with the latest developments in the Matrix ecosystem.

:::inset
**Privacy:** In this context refers to implementors that require a higher level of privacy and security for their users, such as in the public sector or in the context of sensitive data. This includes features like end-to-end encryption, data minimization, and other privacy-preserving measures. At the time of writing this document, this information is mainly based upon experiences with VS-NfD concepts in Germany.
:::

### Intended Audience

**For developers:** This document provides guidance on which specifications and MSCs they need to consider when implementing an application of a certain kind. At this time however we do not provide a test suite or any other means of testing compliance with this document.

**For users:** This provides an easy way to compare implementations based on their respective advertised compliance levels and year. However since we do not provide a test suite, the compliance level is not guaranteed to be correct. We recommend to check the implementation against the requirements in this document before using it in production at this time.

**For integrators:** This document provides a starting point for understanding the implications of implementing specific features and MSCs. It also serves as a reference for evaluating the compliance of different Matrix implementations with the requirements outlined in this document.

Unless explicitly noted, support for the listed specifications is **REQUIRED** for compliance purposes. A feature is considered supported if all comma separated feature providers listed in the "Providers" column are implemented (unless otherwise noted).

:::inset
**RFC 2119 Keywords:** The keywords "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in BCP 14 [RFC2119](https://www.rfc-editor.org/info/rfc2119) and [RFC8174](https://www.rfc-editor.org/info/rfc8174) when, and only when, they appear in all capitals, as shown here.

The word "can" (not "may") is used to refer to a possible circumstance or situation, as opposed to an optional facility of the protocol.
:::

## Compliance Categories

### Core Compliance Suite

| Feature                                | Server | Client | Advanced Server | Advanced Client | Privacy Server | Privacy Client | Providers                                                                                                                 |
| -------------------------------------- | ------ | ------ | --------------- | --------------- | -------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Well-Known Client-Server Discovery** | ✓      | ✓      | ✓               | ✓               | ✓              | ✓              | [Server Discovery](https://spec.matrix.org/v1.14/client-server-api/#server-discovery)                                     |
| **Well-Known Server-Server Discovery** | ✓      | ✓      | ✓               | ✓               | ✓              | ✓              | [Server Discovery](https://spec.matrix.org/v1.14/client-server-api/#server-discovery)                                     |
| **Password UIA Authentication**        | ✓      | ✓      | ✓               | ✓               | ✕¹             | ✕¹             | [Login API](https://spec.matrix.org/v1.14/client-server-api/#login) and Password UIA                                      |
| **SSO Authentication**                 | ✕      | ✕      | ✓               | ✓               | ✓              | ✓              | [SSO Authentication API](https://spec.matrix.org/v1.14/client-server-api/#sso-client-loginauthentication)                 |
| **User Registration**                  | ✓      | ✓      | ✓               | ✓               | ✕¹             | ✕¹             | [Registration API](https://spec.matrix.org/v1.14/client-server-api/#post_matrixclientv3register)                          |
| **Terms of service at registration**   | ✕      | ✕      | ✓               | ✓               | ✕¹             | ✕¹             | [Terms of service at registration API](https://spec.matrix.org/v1.14/client-server-api/#terms-of-service-at-registration) |
| **Token-authenticated registration**   | ✓      | ✓      | ✓               | ✓               | ✕¹             | ✕¹             | [Token-authenticated API](https://spec.matrix.org/v1.14/client-server-api/#token-authenticated-registration)              |

¹ We expect privacy category to implement no registration and instead rely on an external identity provider.

### Instant Messaging Compliance Suite

To be considered instant messaging compliant, all features from the core compliance category must be met, as well as all features in this suite.

See also the [Instant Messaging module](https://spec.matrix.org/v1.14/client-server-api/#instant-messaging) of the specification for further things to consider.

| Feature                           | Server | Client | Advanced Server | Advanced Client | Privacy Server | Privacy Client | Providers                                                                                                                                                                                                                       |
| --------------------------------- | ------ | ------ | --------------- | --------------- | -------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Content Repository (Media)**    | ✓      | ✓      | ✓               | ✓               | ✓              | ✓              | [Media Repository](https://spec.matrix.org/v1.14/client-server-api/#content-repository)                                                                                                                                         |
| **Sync**                          | ✓      | ✓      | ✓               | ✓               | ✓              | ✓              | [Sync API](https://spec.matrix.org/v1.14/client-server-api/#get_matrixclientv3sync)                                                                                                                                             |
| **Room Messages**                 | ✓      | ✓      | ✓               | ✓               | ✓              | ✓              | [Room Message type](https://spec.matrix.org/v1.14/client-server-api/#mroommessage) and [message types](https://spec.matrix.org/v1.14/client-server-api/#mroommessage-msgtypes)                                                  |
| **Location Messages**             | N/A    | ✕      | N/A             | ✓               | N/A            | ✓              | [Location Message type](https://spec.matrix.org/v1.14/client-server-api/#mlocation)                                                                                                                                             |
| **Mathematical Messages (LaTeX)** | N/A    | ✕      | N/A             | ✓               | N/A            | ✓              | [Mathematical Message type](https://spec.matrix.org/v1.14/client-server-api/#mathematical-messages)                                                                                                                             |
| **Rich Replies**                  | N/A    | ✕      | N/A             | ✓               | N/A            | ✓              | [Rich Replies API](https://spec.matrix.org/v1.14/client-server-api/#rich-replies)                                                                                                                                               |
| **Mentioning Users**              | N/A    | ✕      | N/A             | ✓               | N/A            | ✓              | [Mentions API](https://spec.matrix.org/v1.14/client-server-api/#user-and-room-mentions)                                                                                                                                         |
| **Mentioning Rooms**              | N/A    | ✕      | N/A             | ✓               | N/A            | ✓              | [Mentions API](https://spec.matrix.org/v1.14/client-server-api/#user-and-room-mentions)                                                                                                                                         |
| **Core Room State Events**        | ✓      | ✓      | ✓               | ✓               | ✓              | ✓              | [Room Name](https://spec.matrix.org/v1.14/client-server-api/#mroomname), [Room Topic](https://spec.matrix.org/v1.14/client-server-api/#mroomtopic), [Room Avatar](https://spec.matrix.org/v1.14/client-server-api/#mroomavatar) |
| **Pinned Events**                 | ✕      | ✕      | ✓               | ✓               | ✓              | ✓              | [Pinned Events API](https://spec.matrix.org/v1.14/client-server-api/#mroompinned_events)                                                                                                                                        |

### Other Compliance Suites

The following compliance suites are defined but requirements are still being developed:

- **Audio/Video Compliance Suite** - Requirements to be defined
- **Bot Compliance Suite** - Requirements to be defined
- **Bridge Compliance Suite** - Requirements to be defined

To be considered compliant with any of these suites, all features from the core compliance category must be met, as well as all features in the respective suite once defined.

## Future Development

This section outlines the protocol specifications that are relevant for developers, but are not ready yet to be required for Compliance. Developers are encouraged to implement those and to share their experience and feedback on the respective MSCs. This will help to improve the specifications and to make them ready for compliance in the future.

### Widget Compliance Suite

While widgets are already used by Element-Web, Element-Call and companies like Nordeck, the MSCs haven't yet been finalized and accepted by the SCT. Therefore, we do not require them for compliance at this time. However, we still provide guidance on what we think is required for a widget compliance suite.

:::inset
**Note:** Since the widget MSCs are generally not fully up to date we will partially refer to implementations of clients and SDKs instead of the MSCs. This is to provide a more accurate overview of what is required for compliance.

The widget API is fully client side. Hence, we do not provide a server compliance suite for this usecase but instead a widget compliance type. Clients are considered a widget host in this context.
:::

Widget compliance requirements are under active development. Check back for updates as the MSCs progress through the specification process.

## Implementation Notes

Some of the protocol specifications referenced herein have their own dependencies; developers need to consult the relevant specifications for further information.

## Security Considerations

This document introduces no additional security considerations above and beyond those defined in the documents on which it depends.

## Acknowledgements

This document is heavily leaning on the work of the XMPP community in [XEP-0479](https://xmpp.org/extensions/xep-0479.html) and prior work on compliance suites. The idea of having a compliance suite for the Matrix protocol was inspired by their work and we thank them for their efforts in this area.

---

## Related Documentation

- [Federation Setup](/docs/federation-setup)
- [Client-Server API](/docs/client-server-api)
- [Matrix Specification v1.14](https://spec.matrix.org/v1.14/)
