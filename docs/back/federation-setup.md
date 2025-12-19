---
title: Matrix Federation Setup
description: Learn how to configure your Matrix homeserver for federation with other servers
---

## What is Matrix Federation?

Matrix federation allows different Matrix servers to communicate with each other, enabling users on different servers to participate in the same conversations and rooms. This distributed architecture is fundamental to Matrix's design.

:::warning
Your Matrix server must be accessible from the public internet for federation to work properly. Ensure your firewall and network configuration allow incoming connections.
:::

## Federation Requirements

| Requirement                          | Description                                                                            | Status                 |
| ------------------------------------ | -------------------------------------------------------------------------------------- | ---------------------- |
| **Valid TLS Certificate**            | A trusted TLS/SSL certificate from a recognized certificate authority                  | Required               |
| **Well-Known Delegation (Port 443)** | Serve `/.well-known/matrix/server` on port 443 to delegate to your federation endpoint | Recommended            |
| **SRV Record**                       | DNS SRV record for `_matrix._tcp` pointing to your server                              | Optional (Alternative) |
| **Port 8448 Direct**                 | Expose federation API directly on port 8448                                            | Optional (Fallback)    |

## Setup Steps

### 1. Configure your server name

Set your server's domain name in your homeserver configuration. This is the domain users will see in their Matrix IDs (e.g., `@user:example.com`).

:::details Example configuration
```yaml
server_name: "example.com"
```
:::

### 2. Obtain a valid TLS certificate

Use Let's Encrypt or another certificate authority to obtain a valid TLS certificate for your domain. Matrix requires valid certificates for federation.

```bash
# Example using certbot for Let's Encrypt
sudo certbot certonly --nginx -d matrix.example.com
```

### 3. Configure federation discovery

Choose how other servers will discover your federation endpoint. The recommended approach is to use well-known delegation on port 443.

:::details Federation discovery options (in order of preference)

1. **Port 443 with Well-Known Delegation (Recommended)**: Serve a `/.well-known/matrix/server` file on port 443 that points to your federation endpoint. This is the most flexible and firewall-friendly option.

2. **SRV Record (Alternative)**: Create a DNS SRV record (`_matrix._tcp.yourdomain.com`) pointing to your server. This is useful when you cannot serve well-known files.

3. **Port 8448 Direct (Fallback)**: Expose your federation API directly on port 8448. This is the simplest but least flexible option and may have firewall issues.

:::

#### Option 1: Well-Known Delegation (Recommended)

Create a file at `https://example.com/.well-known/matrix/server`:

```json
{
  "m.server": "matrix.example.com:443"
}
```

This tells other servers to connect to `matrix.example.com` on port 443 for federation.

**Nginx configuration example:**

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;

    location /.well-known/matrix/server {
        default_type application/json;
        add_header Access-Control-Allow-Origin *;
        return 200 '{"m.server": "matrix.example.com:443"}';
    }
}
```

**Caddy configuration example:**

```caddy
example.com {
    header /.well-known/matrix/server Content-Type application/json
    header /.well-known/matrix/server Access-Control-Allow-Origin *
    respond /.well-known/matrix/server `{"m.server": "matrix.example.com:443"}` 200
}
```

#### Option 2: SRV Record

Add a DNS SRV record:

```dns
_matrix._tcp.example.com. 3600 IN SRV 10 5 8448 matrix.example.com.
```

This tells other servers to connect to `matrix.example.com` on port 8448.

#### Option 3: Direct Port 8448

Expose your Matrix server directly on port 8448. Other servers will attempt to connect to `example.com:8448` by default.

```nginx
server {
    listen 8448 ssl http2;
    server_name example.com;

    location / {
        proxy_pass http://localhost:8008;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
    }
}
```

### 4. Test your configuration

Use this connectivity tester to verify that your server is properly configured and reachable by other Matrix servers.

Enter your server's domain name on the [homepage](/) and run the tests to check:

- DNS resolution and delegation
- TLS certificate validity
- Federation endpoint accessibility
- Server version and compatibility

:::inset
**Important Note:** The preferred federation setup uses port 443 with well-known delegation. This approach works better with firewalls, proxies, and is more flexible for complex deployments. Port 8448 should only be used as a fallback when well-known delegation or SRV records are not feasible.
:::

## Common Federation Setups

### Setup 1: Domain and Server on Same Host (Simplest)

Your domain is `example.com` and Matrix runs on the same host.

- Serve well-known delegation on `https://example.com/.well-known/matrix/server`
- Point to `example.com:443`
- Configure reverse proxy to forward to Matrix

### Setup 2: Separate Matrix Subdomain (Recommended)

Your domain is `example.com` but Matrix runs on `matrix.example.com`.

- Serve well-known delegation on `https://example.com/.well-known/matrix/server`
- Point to `matrix.example.com:443`
- Matrix server runs on `matrix.example.com` with valid TLS certificate

### Setup 3: Non-Standard Port

Your Matrix server must run on a non-standard port (e.g., 8448).

- Serve well-known delegation on `https://example.com/.well-known/matrix/server`
- Point to `matrix.example.com:8448`
- Ensure port 8448 is accessible from the internet

## Troubleshooting

If federation isn't working after setup:

1. **Test with this tool**: Run the connectivity tester to identify specific issues
2. **Check DNS**: Verify your DNS records are correct using `dig` or `nslookup`
3. **Verify TLS**: Ensure your certificate is valid and covers all necessary domains
4. **Check firewall**: Make sure required ports are open (443 or 8448)
5. **Review logs**: Check your [server logs](/docs/server-logs) for federation errors
6. **Test manually**: Try connecting to your federation endpoint with curl

```bash
# Test federation endpoint
curl https://matrix.example.com/_matrix/federation/v1/version

# Test well-known delegation
curl https://example.com/.well-known/matrix/server
```

## Security Considerations

- **Always use valid TLS certificates** - Self-signed certificates will not work for federation
- **Keep your server updated** - Security patches are critical for federated servers
- **Monitor federation traffic** - Watch for unusual activity or abuse
- **Configure rate limiting** - Protect your server from federation spam

## Next Steps

- Learn about [Well-Known Delegation](/docs/wellknown-delegation) in detail
- Configure [TLS Certificates](/docs/tls-certificates) properly
- Understand [Federation Network](/docs/federation-network) architecture
- Review [Troubleshooting](/docs/troubleshooting) guides

## Related Documentation

- [TLS Certificates](/docs/tls-certificates)
- [Well-Known Delegation](/docs/wellknown-delegation)
- [Federation Network](/docs/federation-network)
- [Network Troubleshooting](/docs/network-troubleshooting)
