---
title: Well-Known Delegation
description: Configure Matrix well-known delegation for flexible server hosting
---

## What is Well-Known Delegation?

Well-known delegation allows you to run your Matrix server on a different domain or port than your Matrix ID suggests. For example, you can have Matrix IDs like `@user:example.com` while actually hosting your Matrix server at `matrix.example.com` or on a non-standard port.

This is the recommended approach for Matrix federation because it's more flexible and firewall-friendly than using SRV records or port 8448 directly.

:::inset
**Technical Reference:** Well-known delegation is specified in the [Matrix Server-Server API specification](https://spec.matrix.org/v1.16/server-server-api/#server-discovery) and the [Matrix Client-Server API specification](https://spec.matrix.org/v1.16/client-server-api/#well-known-uri).
:::

## Why Use Well-Known Delegation?

Well-known delegation solves several common problems:

- **Separate your server location from your domain:** Your Matrix server can run on `matrix.example.com` while users have IDs like `@user:example.com`
- **Use port 443 instead of 8448:** Avoids firewall issues and works better with corporate networks

:::warning
Once you set up well-known delegation and users start joining your server, changing it is essentially impossible. Changing it would make it a different server from the vision of others. Plan your delegation structure carefully before going into production.
:::

## How Well-Known Discovery Works (simplified)

When a Matrix client or server wants to communicate with your server, here's what happens:

1. **Check well-known files:** Looks for `https://example.com/.well-known/matrix/server` (for federation) and `https://example.com/.well-known/matrix/client` (for clients)
2. **Read delegation target:** The well-known file tells where your actual server is located
3. **Connect to delegated server:** Makes the actual connection to the delegated location

:::details Example: Discovery process

**Scenario:** A user wants to send a message to `@alice:example.com`

1. Client requests: `https://example.com/.well-known/matrix/client`
2. Well-known file responds: `{ "m.homeserver": { "base_url": "https://matrix.example.com" } }`
3. Client connects to `https://matrix.example.com`

:::

## Two Types of Well-Known Files

### Server-to-Server (Federation)

File location: `https://example.com/.well-known/matrix/server`

This tells other Matrix servers where to find your federation endpoint.

```json
{
  "m.server": "matrix.example.com:443"
}
```

### Client-to-Server

File location: `https://example.com/.well-known/matrix/client`

This tells Matrix clients where to connect.

```json
{
  "m.homeserver": {
    "base_url": "https://matrix.example.com"
  }
}
```

## Configuration Examples

### Nginx

Serve well-known files with Nginx:

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # Server-to-Server (Federation)
    location /.well-known/matrix/server {
        default_type application/json;
        add_header Access-Control-Allow-Origin *;
        return 200 '{"m.server": "matrix.example.com:443"}';
    }

    # Client-to-Server
    location /.well-known/matrix/client {
        default_type application/json;
        add_header Access-Control-Allow-Origin *;
        return 200 '{"m.homeserver": {"base_url": "https://matrix.example.com"}}';
    }
}
```

### Caddy

Serve well-known files with Caddy:

```caddy
example.com {
    # Automatic HTTPS with Let's Encrypt

    # Server-to-Server (Federation)
    header /.well-known/matrix/server Content-Type application/json
    header /.well-known/matrix/server Access-Control-Allow-Origin *
    respond /.well-known/matrix/server `{"m.server": "matrix.example.com:443"}` 200

    # Client-to-Server
    header /.well-known/matrix/client Content-Type application/json
    header /.well-known/matrix/client Access-Control-Allow-Origin *
    respond /.well-known/matrix/client `{"m.homeserver": {"base_url": "https://matrix.example.com"}}` 200
}
```

### Apache

Serve well-known files with Apache:

```apache
<VirtualHost *:443>
    ServerName example.com

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/example.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/example.com/privkey.pem

    # Server-to-Server (Federation)
    <Location "/.well-known/matrix/server">
        Header set Content-Type "application/json"
        Header set Access-Control-Allow-Origin "*"
        RewriteEngine On
        RewriteRule .* - [R=200,L]
    </Location>

    # Client-to-Server
    <Location "/.well-known/matrix/client">
        Header set Content-Type "application/json"
        Header set Access-Control-Allow-Origin "*"
        RewriteEngine On
        RewriteRule .* - [R=200,L]
    </Location>
</VirtualHost>
```

### Static Files

Alternatively, create actual JSON files on your web server:

**`/var/www/html/.well-known/matrix/server`:**

```json
{
  "m.server": "matrix.example.com:443"
}
```

**`/var/www/html/.well-known/matrix/client`:**

```json
{
  "m.homeserver": {
    "base_url": "https://matrix.example.com"
  }
}
```

Make sure these files are served with:

- Content-Type: `application/json`
- Access-Control-Allow-Origin: `*`

## Testing Your Configuration

### Test with curl

```bash
# Test server-to-server well-known
curl https://example.com/.well-known/matrix/server

# Test client-to-server well-known
curl https://example.com/.well-known/matrix/client

# Should return JSON with proper Content-Type
curl -I https://example.com/.well-known/matrix/server
```

Expected response headers:

- `Content-Type: application/json`
- `Access-Control-Allow-Origin: *`

### Test with this tool

Use this connectivity tester to verify your well-known delegation is working correctly. Enter your domain on the [homepage](/) and run the tests.

The tool will check:

- Well-known file accessibility
- Correct JSON format
- Proper headers
- Delegation target reachability

## Common Issues

### CORS Errors

**Problem:** Clients cannot access well-known files due to CORS errors.

**Solution:** Ensure you're setting the CORS header:

```
Access-Control-Allow-Origin: *
```

### Wrong Content-Type

**Problem:** Well-known files served with wrong content type (e.g., `text/plain`).

**Solution:** Set the content type to `application/json`:

```
Content-Type: application/json
```

### Invalid JSON

**Problem:** Well-known file contains invalid JSON.

**Solution:** Validate your JSON:

```bash
# Test if JSON is valid
cat server.json | jq .
```

### HTTPS Not Working

**Problem:** Well-known files not accessible over HTTPS.

**Solution:**

- Ensure you have a valid TLS certificate for your base domain
- Well-known delegation requires HTTPS (port 443)
- Test with `curl -v https://example.com/.well-known/matrix/server`

## Advanced Configurations

### Delegating to Non-Standard Port

```json
{
  "m.server": "matrix.example.com:3000"
}
```

### Multiple Homeservers

You cannot delegate a single domain to multiple homeservers. Each domain can only delegate to one Matrix server.

## Security Considerations

- **Use HTTPS:** Well-known files must be served over HTTPS
- **Valid certificates:** Use trusted CA certificates, not self-signed
- **No sensitive data:** Well-known files are public
- **Monitor changes:** Unauthorized changes can redirect federation traffic

## Next Steps

- Learn about [Federation Setup](/docs/federation-setup) for complete configuration
- Understand [TLS Certificates](/docs/tls-certificates) requirements
- Review [Network Troubleshooting](/docs/network-troubleshooting) if issues arise
- Check [Server Configuration](/docs/server-configuration) best practices

## Related Documentation

- [Federation Setup](/docs/federation-setup)
- [TLS Certificates](/docs/tls-certificates)
- [Network Troubleshooting](/docs/network-troubleshooting)
- [Server Configuration](/docs/server-configuration)
