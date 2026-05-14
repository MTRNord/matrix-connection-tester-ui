:::banner{kind="warn" title="Still being written."}
These pages are a work in progress — some bits may be incomplete or out of date. Spotted a mistake? [Edit on GitHub](#).
:::

A Matrix homeserver needs to be reachable in two distinct ways: by other homeservers (federation) and by user clients (client-server). The Connectivity Tester checks both from outside your network and reports each layer separately.

Most issues fall into one of three buckets: a missing DNS record, a TLS certificate the wider internet doesn't trust, or a reverse proxy that isn't forwarding the right path. The pages below walk through each in plain language.

:::card

### If you're new to running a homeserver

Start with these four pages, in order. Each one takes about ten minutes to read.

1. [Federation setup](/docs/getting-started/federation-setup) — configure your server for federation
2. [TLS certificates](/docs/configuration/tls-certificates) — set up secure connections
3. [Well-known delegation](/docs/api-endpoints/well-known-delegation) — configure discovery
4. [CORS configuration](/docs/configuration/cors) — enable web clients
   :::

## Need help?

- Run the [connectivity tester](/) against your server
- Check your homeserver's logs for relevant errors
- Read the [troubleshooting guide](/docs/troubleshooting/general) for common issues
- Ask in `#homeservers:matrix.org`
- Post on the [forum](https://forum.mtrnord.blog/c/matrix-connectivity-tester/support/6)
