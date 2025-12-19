---
title: CORS Configuration
description: Configure Cross-Origin Resource Sharing for your Matrix server
---

## What is CORS?

Cross-Origin Resource Sharing (CORS) is a security feature built into web browsers. It controls whether a website can access resources from another domain. For Matrix, this means your server needs to tell web browsers that it's okay for Matrix clients (like Element Web) to access your server's API.

:::inset
**Technical Reference:** CORS is defined by the [Fetch Standard](https://fetch.spec.whatwg.org/#http-cors-protocol). Matrix requires CORS for web-based clients as specified in the [Matrix Client-Server API specification](https://spec.matrix.org/v1.16/client-server-api/#web-browser-clients).
:::

## Why Does Matrix Need CORS?

When someone uses a web-based Matrix client (like Element running in their browser), the client needs to communicate with your Matrix server. Without proper CORS configuration, browsers will block these requests for security reasons.

:::details Example: How CORS affects Matrix clients

Imagine a user visits `app.element.io` and wants to connect to your server at `matrix.example.com`. The browser sees these as two different origins (different domains), so it checks if your server allows cross-origin requests. If CORS isn't configured, the browser blocks the connection.

:::

## Required CORS Headers

Your Matrix server needs to send specific headers that tell browsers it's safe to make cross-origin requests. These are the essential headers:

| Header                         | Required Value                                                  | Purpose                                     |
| ------------------------------ | --------------------------------------------------------------- | ------------------------------------------- |
| `Access-Control-Allow-Origin`  | `*`                                                             | Allows requests from any origin             |
| `Access-Control-Allow-Methods` | `GET, POST, PUT, DELETE, OPTIONS`                               | Specifies which HTTP methods are allowed    |
| `Access-Control-Allow-Headers` | `Origin, X-Requested-With, Content-Type, Accept, Authorization` | Specifies which request headers are allowed |

:::warning
CORS must be configured on all Matrix API endpoints, including `/_matrix/client/*`, `/_matrix/media/*`, and `/_matrix/federation/*`. Missing CORS headers on any endpoint will cause web clients to fail.
:::

## Configuring CORS in Reverse Proxies

Most Matrix deployments use a reverse proxy (Nginx, Caddy, Apache) in front of the homeserver. This is where you should configure CORS.

### Nginx Configuration

Add CORS headers to your Matrix server configuration:

```nginx
server {
    listen 443 ssl http2;
    server_name matrix.example.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/matrix.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/matrix.example.com/privkey.pem;

    location /_matrix {
        proxy_pass http://localhost:8008;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;

        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Origin, X-Requested-With, Content-Type, Accept, Authorization' always;

        # Handle preflight requests
        if ($request_method = OPTIONS) {
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Origin, X-Requested-With, Content-Type, Accept, Authorization' always;
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain charset=UTF-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }
}
```

### Caddy Configuration

Caddy makes CORS configuration simple:

```caddy
matrix.example.com {
    reverse_proxy localhost:8008

    @matrix {
        path /_matrix/*
    }

    header @matrix {
        Access-Control-Allow-Origin "*"
        Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
        Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    }
}
```

### Apache Configuration

Add CORS headers using mod_headers:

```apache
<VirtualHost *:443>
    ServerName matrix.example.com

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/matrix.example.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/matrix.example.com/privkey.pem

    <Location /_matrix>
        ProxyPass http://localhost:8008/_matrix
        ProxyPassReverse http://localhost:8008/_matrix

        # CORS headers
        Header always set Access-Control-Allow-Origin "*"
        Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
        Header always set Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization"

        # Handle preflight requests
        RewriteEngine On
        RewriteCond %{REQUEST_METHOD} OPTIONS
        RewriteRule ^(.*)$ $1 [R=204,L]
    </Location>
</VirtualHost>
```

## Testing CORS Configuration

### Using This Connectivity Tester

Run the connectivity tester on the [homepage](/) to automatically check CORS configuration. The tool will test:

- CORS headers on client-server API endpoints
- Preflight request handling
- Well-known file CORS headers
- Common CORS misconfigurations

### Browser Developer Console

Open your browser's developer console (F12) and try to access your server:

```javascript
fetch("https://matrix.example.com/_matrix/client/versions")
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error("CORS Error:", error));
```

If CORS is configured correctly, you'll see the server's supported versions. If not, you'll see a CORS error.

### Using curl

Test CORS headers with curl:

```bash
# Test basic request
curl -I https://matrix.example.com/_matrix/client/versions

# Test preflight request
curl -X OPTIONS https://matrix.example.com/_matrix/client/versions \
  -H "Origin: https://app.element.io" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Authorization" \
  -I
```

Expected response should include:

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization
```

## Common CORS Issues

### Missing CORS Headers

**Symptoms:** Browser console shows "No 'Access-Control-Allow-Origin' header"

**Solution:** Add CORS headers to your reverse proxy configuration (see examples above)

### CORS Only on Some Endpoints

**Symptoms:** Some API calls work, others fail with CORS errors

**Solution:** Ensure CORS headers are set for all `/_matrix/*` paths, not just specific endpoints

### Preflight Requests Failing

**Symptoms:** OPTIONS requests return errors or missing headers

**Solution:** Configure your reverse proxy to handle OPTIONS requests correctly (see [CORS Preflight](/docs/cors-preflight))

### Wrong CORS Headers

**Symptoms:** CORS errors despite headers being present

**Solution:** Verify headers match exactly:

- `Access-Control-Allow-Origin: *`
- Include all required methods and headers
- Headers must be present on both preflight and actual requests

## CORS and Well-Known Files

Well-known delegation files (`/.well-known/matrix/server` and `/.well-known/matrix/client`) also need CORS headers:

```nginx
location /.well-known/matrix/server {
    default_type application/json;
    add_header Access-Control-Allow-Origin *;
    return 200 '{"m.server": "matrix.example.com:443"}';
}

location /.well-known/matrix/client {
    default_type application/json;
    add_header Access-Control-Allow-Origin *;
    return 200 '{"m.homeserver": {"base_url": "https://matrix.example.com"}}';
}
```

## Security Considerations

### Using Wildcard Origin

Using `Access-Control-Allow-Origin: *` is safe for Matrix because:

- Matrix uses token-based authentication (not cookies)
- The API is designed to be publicly accessible
- Restricting origins would break web clients

### When to Restrict Origins

In most cases, you should use `*`. Only restrict if:

- You have specific security requirements
- You only want to allow your own web client
- You understand the limitations this creates

To restrict origins:

```nginx
# Only allow specific origins
add_header 'Access-Control-Allow-Origin' 'https://element.example.com' always;
```

### CORS and Credentials

Matrix doesn't require credentials in CORS requests. Do not add:

```http
Access-Control-Allow-Credentials: true
```

This is unnecessary and can cause issues with wildcard origins.

## Debugging CORS

### Enable Verbose Logging

**Nginx:**

```nginx
error_log /var/log/nginx/error.log debug;
```

**Apache:**

```apache
LogLevel alert rewrite:trace3
```

### Check Response Headers

```bash
# View all response headers
curl -v https://matrix.example.com/_matrix/client/versions

# Check specific header
curl -I https://matrix.example.com/_matrix/client/versions | grep Access-Control
```

### Browser Network Tab

1. Open browser developer tools (F12)
2. Go to Network tab
3. Make a request to your Matrix server
4. Click the request to see headers
5. Look for `Access-Control-*` headers in the response

## Complete Working Example

Here's a complete Nginx configuration that handles everything correctly:

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name matrix.example.com;

    ssl_certificate /etc/letsencrypt/live/matrix.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/matrix.example.com/privkey.pem;

    # Matrix client-server API
    location /_matrix {
        proxy_pass http://localhost:8008;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;

        # CORS
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Origin, X-Requested-With, Content-Type, Accept, Authorization' always;

        # Preflight
        if ($request_method = OPTIONS) {
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Origin, X-Requested-With, Content-Type, Accept, Authorization' always;
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain charset=UTF-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }
}
```

## Next Steps

- Learn about [CORS Preflight](/docs/cors-preflight) requests in detail
- Configure [Client-Server API](/docs/client-server-api) endpoints
- Review [Troubleshooting](/docs/troubleshooting) if issues persist
- Test your setup with this connectivity tester

## Related Documentation

- [CORS Preflight](/docs/cors-preflight)
- [Client-Server API](/docs/client-server-api)
- [Server Configuration](/docs/server-configuration)
- [Troubleshooting](/docs/troubleshooting)
