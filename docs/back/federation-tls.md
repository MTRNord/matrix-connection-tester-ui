---
title: Federation TLS Configuration
description: Configure TLS certificates for secure Matrix federation
---

# Why TLS Matters for Federation

Matrix federation requires valid TLS certificates to ensure secure, encrypted communication between servers. Unlike web browsing where users can click through certificate warnings, Matrix federation automatically rejects connections with invalid certificates.

:::inset
**Technical Reference:** TLS requirements for Matrix federation are specified in the [Matrix Server-Server API specification](https://spec.matrix.org/v1.16/server-server-api/#tls-certificates).
:::

:::warning
Self-signed certificates will NOT work for federation. You must use a certificate from a trusted Certificate Authority (CA) like Let's Encrypt.
:::

## Federation TLS Requirements

Your TLS certificate must meet these strict requirements for federation to work:

| Requirement | Details |
|-------------|---------|
| Trusted CA | Certificate must be issued by a Certificate Authority trusted by common operating systems (Let's Encrypt, DigiCert, etc.) |
| Valid domain | Certificate CN or SAN must exactly match the federation domain |
| Not expired | Certificate must be within its validity period |
| Complete chain | Must include all intermediate certificates |
| TLS 1.2+ | Must support TLS 1.2 or TLS 1.3 (older versions not accepted) |
| Strong ciphers | Must use modern cipher suites (no RC4, DES, 3DES, etc.) |

## Certificate Domain Matching

The certificate domain must match the server your well-known delegation points to:

### Scenario 1: Using Well-Known Delegation

Your well-known file at `https://example.com/.well-known/matrix/server` contains:

```json
{
  "m.server": "matrix.example.com:443"
}
```

Your TLS certificate must be valid for `matrix.example.com`.

### Scenario 2: No Delegation

If you don't use delegation and your server name is `example.com`, your certificate must be valid for `example.com`.

### Scenario 3: Using Port 8448

If federation connects directly to port 8448 on `example.com`, your certificate must be valid for `example.com`.

## Obtaining Certificates

### Using Let's Encrypt with Certbot

Let's Encrypt provides free, automated certificates. This is the recommended approach:

```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obtain certificate for your federation domain
sudo certbot --nginx -d matrix.example.com

# Certbot automatically configures Nginx and sets up renewal
# Test automatic renewal
sudo certbot renew --dry-run
```

### Using Caddy (Automatic)

Caddy obtains and manages Let's Encrypt certificates automatically:

```caddy
# Caddyfile
matrix.example.com {
    # Caddy automatically obtains certificate for this domain
    reverse_proxy localhost:8008
}

# That's it! No manual certificate management needed.
```

:::inset
**Why Caddy?** Caddy is excellent for Matrix because it handles certificate acquisition, renewal, and OCSP stapling completely automatically with zero configuration.
:::

## Testing Federation TLS

### Method 1: OpenSSL Command Line

```bash
# Test TLS connection to your federation endpoint
openssl s_client -connect matrix.example.com:443 -servername matrix.example.com

# Check certificate details
echo | openssl s_client -connect matrix.example.com:443 -servername matrix.example.com 2>/dev/null | openssl x509 -text -noout

# Check certificate expiry
echo | openssl s_client -connect matrix.example.com:443 -servername matrix.example.com 2>/dev/null | openssl x509 -noout -dates

# Verify certificate chain
openssl s_client -connect matrix.example.com:443 -servername matrix.example.com -showcerts < /dev/null
```

### Method 2: Use This Connection Tester

**The easiest and most comprehensive way** to check your TLS configuration is to use this connection tester tool:

Visit the [homepage](/) and enter your Matrix server's domain name. The tool will automatically check your TLS certificate validity, chain, expiration, and more.

### Method 3: SSL Labs

Get a comprehensive TLS security report:

[https://www.ssllabs.com/ssltest/](https://www.ssllabs.com/ssltest/)

### Method 4: This Tool

Use this connectivity tester on the [home page](/) to check your federation TLS configuration.

## Common TLS Issues

:::details Certificate verify failed errors from remote servers

**Symptoms:** Other servers cannot connect to your server via federation.

**Common causes:**

- Using a self-signed certificate
- Certificate expired
- Certificate name doesn't match domain
- Incomplete certificate chain

**How to fix:**

1. Verify certificate is from a trusted CA (not self-signed)
2. Check expiry date: `openssl x509 -in cert.pem -noout -dates`
3. Ensure domain name matches
4. Use `fullchain.pem`, not `cert.pem`

:::

:::details Name mismatch or Certificate hostname mismatch

**What it means:** The domain in your certificate doesn't match the domain other servers are trying to connect to.

**Example problem:**

- Well-known says `matrix.example.com:443`
- But certificate is for `example.com`

**How to fix:**

- Obtain certificate for the correct domain (the one in your well-known)
- Or use a wildcard certificate that covers both `*.example.com`

:::

:::details Unable to get local issuer certificate

**What it means:** The certificate chain is incomplete — intermediate certificates are missing.

**How to fix:**

- Use `fullchain.pem` instead of `cert.pem` in your web server configuration
- For Let's Encrypt: `/etc/letsencrypt/live/domain/fullchain.pem`
- Verify chain: `openssl s_client -connect matrix.example.com:443 -showcerts`

:::

:::details Certificate expired or about to expire

**Prevention:** Let's Encrypt certificates expire after 90 days and must be renewed.

**For Certbot:**

```bash
# Check renewal timer is active
sudo systemctl status certbot.timer

# Test renewal
sudo certbot renew --dry-run

# Force renewal if needed
sudo certbot renew --force-renewal
```

**For Caddy:** Renewal is completely automatic. Check logs if certificate expires.

:::

## TLS Configuration Best Practices

### Nginx TLS Configuration

```nginx
# Strong TLS configuration for federation
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name matrix.example.com;

    # Certificate files (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/matrix.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/matrix.example.com/privkey.pem;

    # TLS protocols - only modern versions
    ssl_protocols TLSv1.2 TLSv1.3;

    # Strong cipher suites
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;

    # OCSP stapling for better performance
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/matrix.example.com/chain.pem;

    # DNS resolver for OCSP
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # HSTS header
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Session cache
    ssl_session_cache shared:SSL:50m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    # DH parameters (optional, for older clients)
    # ssl_dhparam /etc/nginx/dhparam.pem;

    location / {
        proxy_pass http://localhost:8008;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Caddy TLS Configuration

Caddy uses secure defaults automatically, but you can customize:

```caddy
matrix.example.com {
    # Caddy's default TLS settings are already secure

    # Optional: Explicitly specify protocols
    tls {
        protocols tls1.2 tls1.3
        # Optional: Specify curves
        curves x25519 secp384r1 secp521r1
    }

    reverse_proxy localhost:8008
}
```

## SNI (Server Name Indication)

Server Name Indication (SNI) is required for Matrix federation. It allows servers to present the correct certificate when multiple domains are hosted on the same IP address.

Modern TLS libraries support SNI automatically, but ensure your web server is configured correctly:

- **Nginx:** Use `server_name` directive
- **Caddy:** SNI is handled automatically

## Monitoring Certificate Expiry

Set up monitoring to alert you before certificates expire:

```bash
# Create a simple monitoring script
#!/bin/bash
# check-cert-expiry.sh

DOMAIN="matrix.example.com"
DAYS_WARNING=30

EXPIRY=$(echo | openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s)
NOW_EPOCH=$(date +%s)
DAYS_LEFT=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))

if [ $DAYS_LEFT -lt $DAYS_WARNING ]; then
    echo "WARNING: Certificate expires in $DAYS_LEFT days!"
    exit 1
else
    echo "Certificate OK: $DAYS_LEFT days until expiry"
    exit 0
fi
```

## Port 8448 Considerations

If using port 8448 for federation (not recommended), your TLS configuration must be on that port:

```nginx
# Nginx configuration for port 8448 (if needed)
server {
    listen 8448 ssl http2;
    listen [::]:8448 ssl http2;
    server_name example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # TLS configuration same as above...

    location / {
        proxy_pass http://localhost:8008;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

:::inset
**Recommendation:** Use port 443 with well-known delegation instead of port 8448. It's more firewall-friendly and easier to manage. See the [Well-Known Delegation Guide](/docs/wellknown-delegation).
:::

## Best Practices Summary

- **Use Let's Encrypt:** Free, automated, and trusted
- **Use fullchain.pem:** Always include intermediate certs
- **Enable automatic renewal:** Don't let certificates expire
- **Use TLS 1.2 or higher:** Older versions are insecure
- **Enable OCSP stapling:** Improves performance
- **Monitor expiry:** Set up alerts for upcoming expiration
- **Test regularly:** Use SSL Labs and federation testers
- **Use modern ciphers:** Disable weak algorithms

## Related Documentation

- [TLS Certificates Guide](/docs/tls-certificates)
- [Federation Setup Guide](/docs/federation-setup)
- [Well-Known Delegation](/docs/wellknown-delegation)
- [Troubleshooting Guide](/docs/troubleshooting)
- [Matrix Specification - TLS Certificates](https://spec.matrix.org/v1.16/server-server-api/#tls-certificates)
- [SSL Labs Server Test](https://www.ssllabs.com/ssltest/)
