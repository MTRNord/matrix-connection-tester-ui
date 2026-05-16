## What is Well-Known Delegation?

Well-known delegation lets you run your Matrix server on a different domain or port than your Matrix ID suggests. For example, you can have Matrix IDs like `@user:example.com` while actually hosting your server at `matrix.example.com`.

This is the recommended approach for Matrix server discovery because it is flexible, works on port 443, and handles both federation (server-to-server) and client discovery with a single setup.

:::banner{kind="info" title="Technical Reference"}
Well-known delegation is specified in the [Matrix Server-Server API specification](https://spec.matrix.org/latest/server-server-api/#server-discovery) and the [Matrix Client-Server API specification](https://spec.matrix.org/latest/client-server-api/#well-known-uri).
:::

:::banner{kind="warn" title="Cannot be changed once users are on your server"}
Once well-known delegation is configured and users start joining, changing it is essentially impossible — it would make the server appear as a different server to the rest of the Matrix network. Plan your delegation structure carefully before going into production.
:::

## How discovery works

When a Matrix server or client wants to communicate with your server:

1. It fetches `https://example.com/.well-known/matrix/server` (for federation) or `https://example.com/.well-known/matrix/client` (for clients)
2. The well-known file tells it where your actual server is located
3. It connects to that delegated address

:::card

### Example: Client discovery

A user opens their app and enters `@alice:example.com` as their account.

1. Client fetches `https://example.com/.well-known/matrix/client`
2. File responds: `{ "m.homeserver": { "base_url": "https://matrix.example.com" } }`
3. Client connects to `https://matrix.example.com`
   :::

## The two well-known files

### `/.well-known/matrix/server` (federation)

File location: `https://example.com/.well-known/matrix/server`

Tells other Matrix servers where to find your federation endpoint:

```json
{
  "m.server": "matrix.example.com:443"
}
```

This file does **not** need CORS headers — it is fetched by other Matrix servers, not by browsers.

### `/.well-known/matrix/client` (clients)

File location: `https://example.com/.well-known/matrix/client`

Tells Matrix clients where to connect:

```json
{
  "m.homeserver": {
    "base_url": "https://matrix.example.com"
  }
}
```

This file **must** include `Access-Control-Allow-Origin: *` because web-based clients (like Element Web) fetch it from a browser.

## Relationship to SRV records

SRV records (`_matrix-fed._tcp`) are an older alternative to well-known delegation for federation discovery only. Well-known is preferred because:

- It covers both federation and client discovery with one setup
- It works on port 443, which is rarely blocked by firewalls
- SRV records only affect how other servers find your federation endpoint — they do nothing for client discovery

:::banner{kind="info" title="Deprecated SRV record name"}
The `_matrix._tcp` SRV record name is deprecated since Matrix spec v1.8. The current name is `_matrix-fed._tcp`. New setups should use well-known delegation instead of SRV records.
:::

## Configuration examples

### Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # Federation well-known — no CORS needed (server-to-server only)
    location /.well-known/matrix/server {
        default_type application/json;
        return 200 '{"m.server": "matrix.example.com:443"}';
    }

    # Client well-known — CORS required
    location /.well-known/matrix/client {
        default_type application/json;
        add_header Access-Control-Allow-Origin *;
        return 200 '{"m.homeserver": {"base_url": "https://matrix.example.com"}}';
    }
}
```

### Caddy

```caddy
example.com {
    # Federation well-known
    header /.well-known/matrix/server Content-Type application/json
    respond /.well-known/matrix/server `{"m.server": "matrix.example.com:443"}` 200

    # Client well-known — CORS required
    header /.well-known/matrix/client Content-Type application/json
    header /.well-known/matrix/client Access-Control-Allow-Origin *
    respond /.well-known/matrix/client `{"m.homeserver": {"base_url": "https://matrix.example.com"}}` 200
}
```

### Static files

Create the files on your web server:

**`/var/www/html/.well-known/matrix/server`:**

```json
{ "m.server": "matrix.example.com:443" }
```

**`/var/www/html/.well-known/matrix/client`:**

```json
{ "m.homeserver": { "base_url": "https://matrix.example.com" } }
```

Both files must be served with `Content-Type: application/json`. The client file also needs `Access-Control-Allow-Origin: *`.

## Testing

```bash
# Test federation well-known
curl https://example.com/.well-known/matrix/server

# Test client well-known (check CORS header is present)
curl -I https://example.com/.well-known/matrix/client

# Validate both as JSON
curl https://example.com/.well-known/matrix/server | jq .
curl https://example.com/.well-known/matrix/client | jq .
```

Or use the [connectivity tester](/) — it checks both files and reports exactly what is wrong.

## Common issues

### CORS error on client well-known

`/.well-known/matrix/client` must include `Access-Control-Allow-Origin: *` because web clients fetch it from a browser. Check your reverse proxy configuration includes that header on the client file.

### Wrong Content-Type

Both files must return `Content-Type: application/json`. If your server returns `text/plain`, clients may reject the response.

### Invalid JSON

```bash
curl https://example.com/.well-known/matrix/client | jq .
```

Any error from `jq` means the JSON is malformed.

### HTTPS not working

Well-known delegation requires HTTPS on port 443. Check that your base domain (`example.com`) has a valid TLS certificate.

### Delegating to a non-standard port

```json
{ "m.server": "matrix.example.com:8448" }
```

The port in `m.server` must match the port your server is actually listening on.
