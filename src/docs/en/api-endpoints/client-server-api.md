## What is the Client-Server API?

The Matrix Client-Server API is the primary interface between Matrix clients
(like Element, FluffyChat, etc.) and your homeserver. It handles user
authentication, message sending/receiving, room management, and all other client
operations.

:::banner{kind="info" title="Technical Reference"}
The Client-Server API is defined in the
[Matrix Client-Server API Specification](https://spec.matrix.org/latest/client-server-api/).
Your homeserver must implement this API for clients to connect.
:::

:::banner{kind="warn" title="Work in progress."}
This page is missing deeper explanations for end users. For technical users
please refer to the
[Matrix Client-Server API Specification](https://spec.matrix.org/latest/client-server-api/).
:::

## Next Steps

- Configure [CORS](/docs/configuration/cors) properly
- Set up [TLS Certificates](/docs/configuration/tls-certificates)
- Review [Well-Known Delegation](/docs/api-endpoints/well-known-delegation)
- Check [Troubleshooting](/docs/troubleshooting/general) if issues arise
- Test with this connectivity tester

## Related Documentation

- [CORS Configuration](/docs/configuration/cors)
- [Well-Known Delegation](/docs/api-endpoints/well-known-delegation)
- [Server Configuration](/docs/configuration/server-config)
- [Troubleshooting](/docs/troubleshooting/general)
