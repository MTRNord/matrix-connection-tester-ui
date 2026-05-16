## Overview

This page covers the core configuration options that affect whether the connectivity tester can reach your server. It is not a complete homeserver configuration guide — refer to your homeserver's official documentation for full details.

- [Synapse documentation](https://element-hq.github.io/synapse/latest/)
- [Continuwuity documentation](https://continuwuity.org/)

## Server name

The server name is the domain that appears in Matrix IDs (`@user:example.com`). It must be set before going into production — it cannot be changed afterwards without effectively creating a new server.

**Synapse (`homeserver.yaml`):**

```yaml
server_name: 'example.com'
```

**Continuwuity (`config.toml`):**

```toml
[global]
server_name = "example.com"
```

:::banner{kind="warn" title="This cannot be changed later"}
Once users register on your server, changing the server name is not possible. All existing user IDs, room memberships, and message history are tied to the original server name.
:::

## Listening configuration

For the connectivity tester to reach your server, it must be reachable on the public internet. The recommended setup is to run your homeserver listening only on localhost and use a reverse proxy (Nginx or Caddy) to handle TLS and forward requests.

**Synapse — listen on localhost only (reverse proxy handles TLS):**

```yaml
listeners:
  - port: 8008
    type: http
    tls: false
    bind_addresses: ['127.0.0.1']
    x_forwarded: true
    resources:
      - names: [client, federation]
        compress: false
```

The `x_forwarded: true` setting tells Synapse to trust the `X-Forwarded-For` header from your reverse proxy, so it sees the real client IP address.

See [TLS Certificates](/docs/configuration/tls-certificates) for reverse proxy examples that handle TLS on port 443.

## Registration

By default, open registration should be disabled or protected against abuse. The connectivity tester does not require registration to be open.

**Synapse — disable registration:**

```yaml
enable_registration: false
```

**Synapse — enable registration with CAPTCHA:**

```yaml
enable_registration: true
enable_registration_captcha: true
recaptcha_public_key: 'YOUR_RECAPTCHA_PUBLIC_KEY'
recaptcha_private_key: 'YOUR_RECAPTCHA_PRIVATE_KEY'
```

**Synapse — enable registration with invite tokens:**

```yaml
enable_registration: true
registration_requires_token: true
```

Tokens are created via the [Synapse admin API](https://element-hq.github.io/synapse/latest/admin_api/registration_tokens.html).

:::banner{kind="info" title="Matrix Authentication Service"}
For Synapse, [Matrix Authentication Service (MAS)](https://github.com/element-hq/matrix-authentication-service) is the recommended authentication solution. It provides OAuth2/OIDC support and more flexible registration controls than the built-in Synapse auth.
:::

## Federation

Federation is enabled by default in Synapse. If you have accidentally disabled it, check for a `federation_domain_whitelist` setting that restricts which servers you can federate with.

**Synapse — unrestricted federation (default):**

```yaml
# No federation_domain_whitelist means federation with all servers
```

## Common configuration mistakes

### Server responds on localhost but not from outside

Your homeserver is probably bound to `127.0.0.1` only (which is correct), but your reverse proxy is not configured to forward requests to it. Check your Nginx or Caddy configuration.

### `x_forwarded` not set

Without `x_forwarded: true` in Synapse, rate limiting and IP-based decisions use the proxy's address rather than the real client IP. This is not a connectivity problem but can cause unexpected behaviour.

### Wrong server name

The `server_name` in your homeserver configuration must match the domain in your well-known files and TLS certificate chain. If these don't match, federation will fail.

## See also

- [Federation Setup](/docs/getting-started/federation-setup) — how to configure well-known delegation
- [TLS Certificates](/docs/configuration/tls-certificates) — certificate setup and reverse proxy examples
- [CORS Configuration](/docs/configuration/cors) — required for web-based clients
- [Server Logs](/docs/troubleshooting/server-logs) — how to read your homeserver's logs
