## What is Matrix 2.0 authentication?

Matrix 2.0 replaces the homeserver's built-in login system with a delegated OIDC (OpenID Connect) provider. Instead of your homeserver handling passwords and sessions directly, it points clients to a separate service — such as [Matrix Authentication Service (MAS)](https://github.com/element-hq/matrix-authentication-service) — which issues tokens using standard OAuth 2.0 / OIDC flows.

:::banner{kind="info" title="Technical Reference"}
OIDC delegation is defined in [MSC3861](https://github.com/matrix-org/matrix-spec-proposals/pull/3861), merged into the Matrix specification in [Matrix 1.7](https://spec.matrix.org/v1.7/client-server-api/#openid-connect).
:::

## Why it matters

OIDC delegation is a separate service that can fail independently of your homeserver. Common problems include:

- The OIDC provider is reachable from the homeserver but not from the client's browser (CORS or firewall)
- The issuer URL in your homeserver config does not match the `issuer` field in the OIDC discovery document
- The provider does not advertise the `matrix` scope, which clients need to obtain a Matrix access token
- The JWKS endpoint is unreachable, preventing clients from verifying tokens

The connectivity tester validates the full chain from homeserver advertisement to OIDC provider configuration.

## Discovery chain

The tester walks the following chain in order:

### 1. Well-known advertisement

Clients first look for `m.authentication` in `/.well-known/matrix/client`:

```json
{
  "m.homeserver": { "base_url": "https://matrix.example.com" },
  "m.authentication": {
    "issuer": "https://auth.example.com/",
    "account": "https://auth.example.com/account"
  }
}
```

The `issuer` field here is the canonical source of truth. If present, the tester uses it directly without querying the homeserver.

### 2. Auth issuer endpoint

If `m.authentication` is absent from the well-known document, the tester falls back to querying the homeserver's auth issuer endpoint. Which endpoint is tried first depends on what the server advertises in `/_matrix/client/versions`:

| Advertised feature | Endpoint tried |
| --- | --- |
| `org.matrix.msc2965` | `/_matrix/client/unstable/org.matrix.msc2965/auth_metadata` |
| Matrix ≥ 1.7 or `org.matrix.msc3861` | `/_matrix/client/v1/auth_issuer` |
| Nothing specific | All of the above as a fallback |

Each endpoint returns a JSON object with an `issuer` field pointing to the OIDC provider's base URL.

### 3. OIDC discovery document

Once the issuer URL is known, the tester fetches:

```
{issuer}/.well-known/openid-configuration
```

This is a standard OIDC discovery document. The tester validates:

- The document is reachable and contains valid JSON
- The `issuer` field in the document matches the URL used to fetch it
- `code_challenge_methods_supported` includes `S256` (PKCE, required by Matrix clients)
- `code_challenge_methods_supported` and other required fields are present

### 4. JWKS endpoint

The discovery document's `jwks_uri` points to the provider's public key set. Clients need this to verify token signatures. The tester checks that it is reachable and returns a valid key set.

## What each check means

### Issuer URL

The base URL of the OIDC provider, taken from the first successful discovery source. This must match exactly what the provider reports in its own discovery document.

### OIDC discovery reachable

Whether the browser could reach `{issuer}/.well-known/openid-configuration`. If this fails, clients cannot complete authentication even if the homeserver is working. The discovery document is usually served by the OIDC provider, not by your homeserver, so a failure here points to a problem with the OIDC provider's public availability.

### Issuer mismatch

The `issuer` field inside the discovery document must exactly match the URL used to fetch it. A mismatch breaks OIDC security — clients will reject tokens from a mismatched issuer. This is often caused by a trailing-slash difference between the configured URL and the provider's self-reported URL.

### PKCE S256

Matrix clients require PKCE (Proof Key for Code Exchange) with the `S256` challenge method. This protects against authorization code interception. If your OIDC provider does not advertise `S256`, Matrix clients cannot safely complete the login flow.

### JWKS endpoint

The JSON Web Key Set endpoint provides the public keys used to verify tokens. If it is unreachable, clients cannot validate the token signatures they receive, which causes authentication failures.

## Common issues

### OIDC CORS blocked

The browser cannot reach the OIDC discovery endpoint or JWKS endpoint because CORS headers are missing. The OIDC provider must serve `Access-Control-Allow-Origin: *` (or your specific origin) on:

- `/.well-known/openid-configuration`
- The JWKS endpoint
- All token and authorization endpoints

MAS serves these headers by default. If you are using a different provider, check its CORS configuration.

### Issuer mismatch

Check that the `issuer` value in your homeserver config (or `/.well-known/matrix/client`) matches exactly what appears in `{issuer}/.well-known/openid-configuration`. Trailing slashes are a common cause:

```
# Configured:  https://auth.example.com
# Reported:    https://auth.example.com/
```

Fix by making both consistent. MAS reports the issuer with a trailing slash; configure your homeserver to match.

### JWKS unreachable

The JWKS endpoint URL comes from the discovery document. If it is unreachable, check:

- The URL is publicly accessible (not behind a firewall or VPN)
- CORS headers are present
- The endpoint returns a JSON object with a `keys` array

## Testing manually

```bash
# Check what the homeserver advertises
curl https://example.com/.well-known/matrix/client | jq '."m.authentication"'

# Check the auth issuer endpoint (Matrix 1.7+)
curl https://matrix.example.com/_matrix/client/v1/auth_issuer

# Fetch the OIDC discovery document
curl https://auth.example.com/.well-known/openid-configuration | jq '{issuer, scopes_supported, code_challenge_methods_supported, jwks_uri}'

# Check CORS on the discovery document
curl -I -H "Origin: https://element.example.com" https://auth.example.com/.well-known/openid-configuration
```

Or run the [connectivity tester](/) which walks the full chain automatically.
