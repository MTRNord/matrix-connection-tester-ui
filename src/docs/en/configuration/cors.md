## What is CORS and why does Matrix need it?

When someone uses a web-based Matrix client (like Element Web running in their browser), that client needs to send requests to your server from a different domain — for example, from `app.element.io` to `matrix.example.com`. Browsers block these cross-origin requests by default for security reasons.

CORS (Cross-Origin Resource Sharing) is the mechanism that lets your server tell browsers: "it is safe for web pages from any domain to talk to me." Without correct CORS configuration, web clients will fail even if your server is otherwise working perfectly.

:::banner{kind="info" title="Technical Reference"}
CORS requirements for Matrix web clients are specified in the [Matrix Client-Server API specification](https://spec.matrix.org/latest/client-server-api/#web-browser-clients).
:::

## Required CORS headers

Your Matrix server must return these headers on all `/_matrix/client/*` and `/_matrix/media/*` responses:

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: X-Requested-With, Content-Type, Authorization
```

These headers must also appear on `/.well-known/matrix/client`.

:::banner{kind="warn" title="CORS on client-facing endpoints only"}
CORS headers must be present on every `/_matrix/client/*` and `/_matrix/media/*` endpoint, and on `/.well-known/matrix/client`. Federation endpoints (`/_matrix/federation/*`) and `/.well-known/matrix/server` are accessed server-to-server and do not need CORS headers.
:::

## Understanding preflight requests

Before making certain requests (anything with an `Authorization` header, JSON bodies, or PUT/DELETE methods), browsers automatically send an `OPTIONS` request first to ask permission. This is called a preflight request. Your server must respond correctly to these or the actual request will never be sent.

The Matrix spec requires that all endpoints support `OPTIONS` and that the server does **not** execute any logic when an `OPTIONS` request arrives — it should just return the CORS headers and a `204 No Content` response.

## Configuration examples

### Nginx

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name matrix.example.com;

    ssl_certificate /etc/letsencrypt/live/matrix.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/matrix.example.com/privkey.pem;

    location /_matrix {
        # Handle preflight requests at the proxy level
        if ($request_method = OPTIONS) {
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'X-Requested-With, Content-Type, Authorization' always;
            add_header 'Access-Control-Max-Age' 86400 always;
            add_header 'Content-Length' 0;
            return 204;
        }

        proxy_pass http://localhost:8008;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;

        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'X-Requested-With, Content-Type, Authorization' always;
    }
}
```

### Caddy

Caddy handles CORS and preflight automatically when you add the headers:

```caddy
matrix.example.com {
    reverse_proxy localhost:8008

    @matrix {
        path /_matrix/*
    }

    header @matrix {
        Access-Control-Allow-Origin "*"
        Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
        Access-Control-Allow-Headers "X-Requested-With, Content-Type, Authorization"
        Access-Control-Max-Age "86400"
    }

    @options {
        method OPTIONS
    }
    respond @options 204
}
```

## Testing CORS

### Using curl

```bash
# Test that CORS headers are present on the versions endpoint
curl -I https://matrix.example.com/_matrix/client/versions

# Test a preflight request
curl -X OPTIONS https://matrix.example.com/_matrix/client/versions \
  -H "Origin: https://app.element.io" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Authorization" \
  -I
```

The response should include `Access-Control-Allow-Origin: *`.

### Using the browser console

Open your browser's developer tools (F12) and run:

```javascript
fetch('https://matrix.example.com/_matrix/client/versions')
  .then((r) => r.json())
  .then((d) => console.log('OK:', d))
  .catch((e) => console.error('CORS error:', e))
```

If CORS is correct you'll see the versions JSON. A CORS error means the headers are missing or wrong.

## Common CORS problems

### "No Access-Control-Allow-Origin header"

CORS headers are missing from the response. Add the headers to your reverse proxy (see examples above).

### OPTIONS requests return 404 or 405

Your reverse proxy or homeserver is not handling the OPTIONS method. Add the preflight handler shown in the examples above.

### CORS works on some paths but not others

CORS headers must be set on all `/_matrix/*` paths. Check that your location block or path matcher covers all endpoints, not just specific ones.

### Well-known client file missing CORS header

`/.well-known/matrix/client` needs `Access-Control-Allow-Origin: *` because web-based clients fetch it from a browser. See [Well-Known Delegation](/docs/api-endpoints/well-known-delegation) for configuration examples.

## Why `Access-Control-Allow-Origin: *` is safe for Matrix

Using a wildcard origin is intentional and safe for Matrix because:

- Matrix uses token-based authentication, not cookies or session credentials
- The API is designed to be publicly accessible (all secret data is encrypted end-to-end)
- Restricting to specific origins would break any Matrix client that isn't pre-approved
