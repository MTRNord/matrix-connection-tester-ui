## What is the Client-Server API?

The Client-Server API is how Matrix apps talk to your homeserver. When someone opens Element (or any other Matrix client) and logs in, sends a message, or loads their room list, they are using this API. It is separate from federation, which is how your server talks to other servers.

:::banner{kind="info" title="Technical Reference"}
The Client-Server API is defined in the [Matrix Client-Server API specification](https://spec.matrix.org/latest/client-server-api/).
:::

## What the connectivity tester checks

The tester calls `/_matrix/client/versions` to confirm your server is responding to client requests and reports which API versions it supports. A failed client-server check usually means one of:

- Your reverse proxy is not forwarding `/_matrix/client/*` requests to your homeserver
- CORS headers are missing, preventing web clients from connecting
- The homeserver is not running

## Client discovery

Before connecting, clients look up `https://example.com/.well-known/matrix/client` to find your server address:

```json
{
  "m.homeserver": {
    "base_url": "https://matrix.example.com"
  }
}
```

Without this file, clients must ask users to type in the full homeserver address manually. See [Well-Known Delegation](/docs/api-endpoints/well-known-delegation) for setup instructions.

## API versions

The `/versions` endpoint tells clients which API versions your server supports:

```bash
curl https://matrix.example.com/_matrix/client/versions
```

Expected response:

```json
{
  "versions": ["v1.1", "v1.2", "v1.3", "v1.4", "v1.5"],
  "unstable_features": {
    "org.matrix.msc3266": true
  }
}
```

Modern homeservers like Synapse support multiple versions. Clients use the highest version both they and the server support.

## CORS requirement

The Client-Server API must be served with CORS headers so web-based clients can connect from any domain. Without these headers, browser clients will fail even though mobile and desktop apps work fine.

See [CORS Configuration](/docs/configuration/cors) for setup instructions.

## Authentication

Clients authenticate using an access token obtained at login. The token is sent with every request in the `Authorization` header:

```http
Authorization: Bearer syt_abc123...
```

Traditional Matrix access tokens are long-lived and do not expire on their own — they remain valid until a user explicitly logs out, or an admin revokes them. "Invalid access token" errors in your logs typically mean a user logged out from another device or the token was revoked.

[Matrix Authentication Service (MAS)](https://github.com/element-hq/matrix-authentication-service) is the recommended authentication solution for Synapse and introduces OAuth2/OIDC with short-lived access tokens and refresh tokens — closer to how modern web authentication works.

## Testing

```bash
# Check the API is reachable
curl https://matrix.example.com/_matrix/client/versions

# Check client well-known
curl https://example.com/.well-known/matrix/client

# Check CORS headers are present
curl -I https://matrix.example.com/_matrix/client/versions
```

Or run the [connectivity tester](/) which checks all of this automatically.
