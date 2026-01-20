---
title: Client-Server API
description: Understanding the Matrix Client-Server API
---

## What is the Client-Server API?

The Matrix Client-Server API is the primary interface between Matrix clients (like Element, FluffyChat, etc.) and your homeserver. It handles user authentication, message sending/receiving, room management, and all other client operations.

:::inset
**Technical Reference:** The Client-Server API is defined in the [Matrix Client-Server API Specification](https://spec.matrix.org/latest/client-server-api/). Your homeserver must implement this API for clients to connect.
:::

:::warning
This page is a Work in Progress and therefor missing deeper explanations for endusers. For technical users please refer to the [Matrix Client-Server API Specification](https://spec.matrix.org/latest/client-server-api/).
:::

## Next Steps

- Configure [CORS](/docs/cors-configuration) properly
- Set up [TLS Certificates](/docs/tls-certificates)
- Review [Well-Known Delegation](/docs/wellknown-delegation)
- Check [Troubleshooting](/docs/troubleshooting) if issues arise
- Test with this connectivity tester

## Related Documentation

- [CORS Configuration](/docs/cors-configuration)
- [CORS Preflight](/docs/cors-preflight)
- [Well-Known Delegation](/docs/wellknown-delegation)
- [Server Configuration](/docs/server-configuration)
- [Troubleshooting](/docs/troubleshooting)
