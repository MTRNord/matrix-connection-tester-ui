---
title: CORS Preflight Requests
description: Understanding and configuring CORS preflight OPTIONS requests
---

## What are CORS Preflight Requests?

Before making certain types of requests, web browsers automatically send a "preflight" request to check if the actual request is allowed. This preflight request uses the OPTIONS HTTP method and asks the server for permission.

Think of it like knocking on a door before entering—the browser is checking if it's okay to proceed with the real request.

:::inset
**Technical Reference:** CORS preflight is defined in the [Fetch Standard](https://fetch.spec.whatwg.org/#cors-preflight-fetch). Matrix servers must handle preflight requests correctly for web-based clients to work, as specified in the [Matrix Client-Server API](https://spec.matrix.org/v1.16/client-server-api/#web-browser-clients).
:::

## When Do Preflight Requests Happen?

Browsers send preflight requests when the actual request meets certain criteria:

- Uses methods other than GET, HEAD, or POST
- Includes custom headers like `Authorization`
- Sends data with content types other than `application/x-www-form-urlencoded`, `multipart/form-data`, or `text/plain`

For Matrix, preflight requests happen frequently because:

- Matrix APIs use JSON (content type `application/json`)
- Many requests include authentication tokens in the `Authorization` header
- Matrix uses methods like PUT and DELETE

## How Preflight Requests Work

Here's the sequence of events:

1. **Browser prepares to make a request** (for example, sending a message)
2. **Browser sends OPTIONS request** to the same URL with special headers
3. **Server responds with allowed methods and headers**
4. **Browser checks if the actual request is allowed**
5. **Browser makes the actual request** (or blocks it if not allowed)

### Example Flow

```http
Client wants to: POST /api/send-message

Step 1: Preflight Request
OPTIONS /api/send-message
Origin: https://app.element.io
Access-Control-Request-Method: POST
Access-Control-Request-Headers: Authorization, Content-Type

Step 2: Server Response
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Max-Age: 86400

Step 3: Actual Request (if allowed)
POST /api/send-message
Authorization: Bearer token123
Content-Type: application/json
```

## Configuring Preflight Handling

### Nginx

Handle OPTIONS requests in your Nginx configuration:

```nginx
location /_matrix {
    proxy_pass http://localhost:8008;

    # Standard proxy headers
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Host $host;

    # CORS headers for all requests
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Origin, X-Requested-With, Content-Type, Accept, Authorization' always;

    # Handle preflight requests
    if ($request_method = OPTIONS) {
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Origin, X-Requested-With, Content-Type, Accept, Authorization' always;
        add_header 'Access-Control-Max-Age' 1728000; # Cache preflight for 20 days
        add_header 'Content-Type' 'text/plain charset=UTF-8';
        add_header 'Content-Length' 0;
        return 204;
    }
}
```

### Caddy

Caddy handles preflight requests automatically when you configure CORS headers:

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
        Access-Control-Max-Age "86400"
    }

    # Handle preflight
    @options {
        method OPTIONS
    }
    respond @options 204
}
```

### Apache

Handle OPTIONS requests with Apache:

```apache
<Location /_matrix>
    ProxyPass http://localhost:8008/_matrix
    ProxyPassReverse http://localhost:8008/_matrix

    # CORS headers
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header always set Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    Header always set Access-Control-Max-Age "86400"

    # Handle preflight
    RewriteEngine On
    RewriteCond %{REQUEST_METHOD} OPTIONS
    RewriteRule ^(.*)$ $1 [R=204,L]
</Location>
```

## Understanding Preflight Headers

### Request Headers (from browser)

| Header                           | Purpose                                                  |
| -------------------------------- | -------------------------------------------------------- |
| `Access-Control-Request-Method`  | The method the actual request will use (e.g., POST, PUT) |
| `Access-Control-Request-Headers` | Headers the actual request will include                  |
| `Origin`                         | The origin making the request                            |

### Response Headers (from server)

| Header                         | Purpose                                            | Recommended Value                                               |
| ------------------------------ | -------------------------------------------------- | --------------------------------------------------------------- |
| `Access-Control-Allow-Origin`  | Which origins are allowed                          | `*`                                                             |
| `Access-Control-Allow-Methods` | Which HTTP methods are allowed                     | `GET, POST, PUT, DELETE, OPTIONS`                               |
| `Access-Control-Allow-Headers` | Which headers are allowed                          | `Origin, X-Requested-With, Content-Type, Accept, Authorization` |
| `Access-Control-Max-Age`       | How long to cache the preflight response (seconds) | `86400` (24 hours)                                              |

## Common Preflight Issues

### Issue: Preflight Returns 404 or 405

**Symptoms:** Browser console shows "Method OPTIONS is not allowed" or "404 Not Found" for OPTIONS requests.

**Cause:** Server or reverse proxy isn't configured to handle OPTIONS method.

**Solution:** Add explicit handling for OPTIONS requests (see configuration examples above).

### Issue: Missing CORS Headers on Preflight

**Symptoms:** Browser console shows "Response to preflight request doesn't pass access control check".

**Cause:** CORS headers missing from OPTIONS response.

**Solution:** Ensure CORS headers are added to OPTIONS responses:

```nginx
if ($request_method = OPTIONS) {
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Origin, X-Requested-With, Content-Type, Accept, Authorization' always;
    return 204;
}
```

### Issue: Preflight Failing But Regular Requests Work

**Symptoms:** GET requests work fine, but POST/PUT requests fail with CORS errors.

**Cause:** OPTIONS method not handled, or different CORS headers on OPTIONS vs other methods.

**Solution:** Ensure OPTIONS returns the same CORS headers as other methods.

### Issue: Wrong Status Code

**Symptoms:** Preflight returns 200 instead of 204, or returns unexpected content.

**Cause:** Preflight request being proxied to backend instead of handled by reverse proxy.

**Solution:** Handle OPTIONS in the reverse proxy and return 204 No Content:

```nginx
if ($request_method = OPTIONS) {
    return 204;
}
```

## Testing Preflight Requests

### Using curl

```bash
# Send a preflight request
curl -X OPTIONS https://matrix.example.com/_matrix/client/v3/sync \
  -H "Origin: https://app.element.io" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Authorization" \
  -v
```

Expected response:

```
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization
Access-Control-Max-Age: 86400
```

### Using Browser Console

```javascript
// Make a request that triggers preflight
fetch("https://matrix.example.com/_matrix/client/versions", {
  method: "GET",
  headers: {
    Authorization: "Bearer test",
  },
})
  .then((response) => console.log("Success:", response))
  .catch((error) => console.error("Error:", error));

// Check Network tab to see the preflight OPTIONS request
```

### Using This Connectivity Tester

Run the connectivity tester on the [homepage](/) to automatically test preflight handling. The tool checks:

- OPTIONS method support
- Correct CORS headers on preflight responses
- Proper status codes
- Header caching configuration

## Preflight Caching

The `Access-Control-Max-Age` header tells browsers how long to cache the preflight response. This reduces the number of preflight requests.

```nginx
add_header 'Access-Control-Max-Age' 86400; # 24 hours
```

**Recommended values:**

- **Development:** `0` or low value (e.g., `60`) for quick testing
- **Production:** `86400` (24 hours) or `1728000` (20 days)
- **Maximum:** Most browsers cap at 86400 seconds

:::inset
**Note:** Browsers may ignore or cap the max-age value. Don't rely on it being cached for the exact duration specified.
:::

## Performance Optimization

### Reduce Preflight Requests

1. **Set appropriate Max-Age:** Cache preflight responses for 24 hours
2. **Use simple requests when possible:** GET requests without custom headers don't trigger preflight
3. **Minimize custom headers:** Only send necessary headers

### Handle Preflight at Edge

If using a CDN or edge proxy:

- Handle OPTIONS at the edge, don't proxy to origin
- Cache preflight responses globally
- Reduces latency and backend load

## Security Considerations

### Preflight Doesn't Prevent Requests

Important: CORS and preflight are **browser security features**. They don't prevent:

- Requests from non-browser clients (curl, apps, etc.)
- Malicious actors from bypassing CORS
- Server-side attacks

Always implement proper authentication and authorization on your Matrix server.

### Wildcard Origin Safety

Using `Access-Control-Allow-Origin: *` is safe for Matrix because:

- Matrix uses token-based authentication
- No cookies or credentials involved
- APIs are designed to be publicly accessible

## Debugging Preflight Issues

### Check Browser Network Tab

1. Open Developer Tools (F12)
2. Go to Network tab
3. Filter by "Fetch/XHR"
4. Look for OPTIONS requests
5. Check request and response headers

### Look for Red Flags

**Preflight request not appearing:** May indicate simple request or CORS not needed

**Preflight returning errors:** Check server logs and reverse proxy configuration

**Preflight succeeding but actual request failing:** Different CORS headers between OPTIONS and actual method

### Enable Verbose Logging

**Nginx:**

```nginx
error_log /var/log/nginx/error.log debug;
```

**Apache:**

```apache
LogLevel debug
```

## Complete Working Example

Here's a battle-tested Nginx configuration:

```nginx
server {
    listen 443 ssl http2;
    server_name matrix.example.com;

    ssl_certificate /etc/letsencrypt/live/matrix.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/matrix.example.com/privkey.pem;

    location /_matrix {
        # Handle preflight requests immediately
        if ($request_method = OPTIONS) {
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Origin, X-Requested-With, Content-Type, Accept, Authorization' always;
            add_header 'Access-Control-Max-Age' 86400 always;
            add_header 'Content-Type' 'text/plain charset=UTF-8';
            add_header 'Content-Length' 0;
            return 204;
        }

        # Proxy to Matrix server
        proxy_pass http://localhost:8008;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;

        # CORS headers for actual requests
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Origin, X-Requested-With, Content-Type, Accept, Authorization' always;
    }
}
```

## Next Steps

- Review [CORS Configuration](/docs/cors-configuration) for general CORS setup
- Configure [Client-Server API](/docs/client-server-api) endpoints
- Test your setup with this connectivity tester
- Check [Troubleshooting](/docs/troubleshooting) if issues persist

## Related Documentation

- [CORS Configuration](/docs/cors-configuration)
- [Client-Server API](/docs/client-server-api)
- [Server Configuration](/docs/server-configuration)
- [Network Troubleshooting](/docs/network-troubleshooting)
