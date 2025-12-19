---
title: TLS Certificates
description: Configure TLS certificates for Matrix server security and federation
---

## What are TLS Certificates?

TLS (Transport Layer Security) certificates are digital certificates that prove your server's identity and encrypt communications. They're essential for secure HTTPS connections and are required for Matrix federation.

Think of a TLS certificate like a passport for your server—it proves who you are and ensures that communications with your server are private and tamper-proof.

:::inset
**Technical Reference:** Matrix federation requires valid TLS certificates as specified in the [Matrix Server-Server API specification](https://spec.matrix.org/v1.16/server-server-api/#tls-certificates). Self-signed certificates are not accepted for federation.
:::

:::warning
Matrix federation requires certificates from a trusted Certificate Authority (CA). Self-signed certificates will not work for federation, even if they work for HTTPS web access.
:::

## Certificate Requirements for Matrix

Your TLS certificate must meet these requirements:

| Requirement | Description | Status |
|-------------|-------------|--------|
| **Trusted CA** | Certificate must be issued by a recognized Certificate Authority (like Let's Encrypt, DigiCert, etc.) | Required |
| **Valid domain** | Certificate must match your server's domain name (including wildcards if applicable) | Required |
| **Not expired** | Certificate must be within its validity period | Required |
| **Complete chain** | Must include all intermediate certificates | Required |
| **Valid signature** | Certificate must have a valid cryptographic signature | Required |
| **Modern cipher** | Must support modern TLS protocols (TLS 1.2 or 1.3) | Recommended |

## Getting a Free Certificate with Let's Encrypt

[Let's Encrypt](https://letsencrypt.org/) provides free, automated TLS certificates that work perfectly with Matrix. It's the recommended solution for most deployments.

### Using Certbot

Certbot is the official Let's Encrypt client and the easiest way to get certificates.

#### Install Certbot

**Ubuntu/Debian:**

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

**RHEL/CentOS/Fedora:**

```bash
sudo dnf install certbot python3-certbot-nginx
```

#### Obtain a Certificate

**For Nginx (automatic configuration):**

```bash
sudo certbot --nginx -d matrix.example.com
```

**For manual certificate only:**

```bash
sudo certbot certonly --standalone -d matrix.example.com
```

**For multiple domains:**

```bash
sudo certbot certonly --standalone -d example.com -d matrix.example.com
```

#### Test Automatic Renewal

Let's Encrypt certificates expire after 90 days. Certbot automatically sets up renewal:

```bash
# Test renewal process (dry run)
sudo certbot renew --dry-run

# Check timer status
sudo systemctl status certbot.timer

# Manual renewal (if needed)
sudo certbot renew
```

### Using Caddy

[Caddy](https://caddyserver.com/) automatically obtains and renews Let's Encrypt certificates with zero configuration.

**Caddyfile example:**

```caddy
matrix.example.com {
    reverse_proxy localhost:8008
}

example.com {
    header /.well-known/matrix/server Content-Type application/json
    header /.well-known/matrix/server Access-Control-Allow-Origin *
    respond /.well-known/matrix/server `{"m.server": "matrix.example.com:443"}` 200
}
```

Caddy handles everything automatically:
- Obtains certificates from Let's Encrypt
- Renews certificates before expiry
- Configures TLS with secure defaults

## Certificate Placement

### For Synapse

Synapse can use certificates directly or through a reverse proxy.

**Option 1: Reverse Proxy (Recommended)**

Let your reverse proxy (Nginx/Caddy) handle TLS:

```yaml
# homeserver.yaml
listeners:
  - port: 8008
    type: http
    tls: false
    bind_addresses: ['127.0.0.1']
```

**Option 2: Direct TLS in Synapse**

```yaml
# homeserver.yaml
listeners:
  - port: 8448
    type: http
    tls: true
    bind_addresses: ['::']
    x_forwarded: false
    
tls_certificate_path: "/etc/letsencrypt/live/matrix.example.com/fullchain.pem"
tls_private_key_path: "/etc/letsencrypt/live/matrix.example.com/privkey.pem"
```

Ensure Synapse can read the certificates:

```bash
# Add synapse user to certbot group
sudo usermod -a -G ssl-cert matrix-synapse

# Set permissions
sudo chmod 640 /etc/letsencrypt/live/matrix.example.com/privkey.pem
sudo chgrp ssl-cert /etc/letsencrypt/live/matrix.example.com/privkey.pem
```

### For Continuwuity

Similar to Synapse, Continuwuity can use certificates directly or through a reverse proxy. The reverse proxy approach is recommended for easier management.

## Reverse Proxy Configuration

Using a reverse proxy for TLS termination is the recommended approach.

### Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name matrix.example.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/matrix.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/matrix.example.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/matrix.example.com/chain.pem;

    # Modern SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;

    # Proxy to Matrix server
    location / {
        proxy_pass http://localhost:8008;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name matrix.example.com;
    return 301 https://$host$request_uri;
}
```

### Apache Configuration

```apache
<VirtualHost *:443>
    ServerName matrix.example.com

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/matrix.example.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/matrix.example.com/privkey.pem

    # Modern SSL Configuration
    SSLProtocol all -SSLv3 -TLSv1 -TLSv1.1
    SSLCipherSuite ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384
    SSLHonorCipherOrder off

    # Proxy to Matrix server
    ProxyPreserveHost On
    ProxyPass / http://localhost:8008/
    ProxyPassReverse / http://localhost:8008/
    
    RequestHeader set X-Forwarded-Proto "https"
</VirtualHost>
```

## Wildcard Certificates

Wildcard certificates cover all subdomains and can simplify multi-domain setups.

### Obtain Wildcard Certificate

```bash
# Using DNS challenge (required for wildcards)
sudo certbot certonly --manual --preferred-challenges dns -d "*.example.com" -d example.com
```

You'll need to create DNS TXT records as instructed by Certbot.

### Using Wildcard with Matrix

A wildcard certificate for `*.example.com` covers:
- `matrix.example.com`
- `element.example.com`
- `jitsi.example.com`
- Any other subdomain

## Certificate Renewal

### Automatic Renewal

Let's Encrypt certificates expire after 90 days. Set up automatic renewal:

**Certbot (systemd timer):**

```bash
# Check timer status
sudo systemctl status certbot.timer

# Enable timer if not enabled
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

**Certbot (cron):**

```bash
# Add to crontab
sudo crontab -e

# Add this line (runs twice daily)
0 0,12 * * * certbot renew --quiet --deploy-hook "systemctl reload nginx"
```

### Manual Renewal

```bash
# Renew all certificates
sudo certbot renew

# Renew specific certificate
sudo certbot renew --cert-name matrix.example.com

# Force renewal (for testing)
sudo certbot renew --force-renewal
```

### Post-Renewal Hooks

Reload services after renewal:

**For Nginx:**

```bash
# Create renewal hook
sudo nano /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
```

```bash
#!/bin/bash
systemctl reload nginx
```

```bash
# Make executable
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
```

**For Synapse (if using TLS directly):**

```bash
#!/bin/bash
systemctl reload matrix-synapse
```

## Testing Your Certificate

### Using OpenSSL

```bash
# Test TLS connection
openssl s_client -connect matrix.example.com:443 -servername matrix.example.com

# Check certificate details
openssl s_client -connect matrix.example.com:443 -servername matrix.example.com | openssl x509 -noout -text

# Check certificate expiry
openssl s_client -connect matrix.example.com:443 -servername matrix.example.com | openssl x509 -noout -dates
```

### Using curl

```bash
# Test HTTPS connection
curl -v https://matrix.example.com/_matrix/federation/v1/version

# Check certificate details
curl -vI https://matrix.example.com 2>&1 | grep -i "SSL\|TLS\|certificate"
```

### Using Online Tools

- [SSL Labs Server Test](https://www.ssllabs.com/ssltest/) - Comprehensive SSL/TLS analysis
- [SSL Checker](https://www.sslshopper.com/ssl-checker.html) - Quick certificate validation

### Using This Connectivity Tester

Run the connectivity tester on the [homepage](/) to check:
- Certificate validity
- Certificate expiry
- Domain name matching
- Certificate chain completeness
- TLS protocol support

## Common Certificate Issues

### Expired Certificate

**Symptoms:** "Certificate has expired" errors in logs or browsers.

**Solution:**

```bash
# Renew certificate
sudo certbot renew

# Reload services
sudo systemctl reload nginx
sudo systemctl reload matrix-synapse  # if using TLS directly
```

### Wrong Domain Name

**Symptoms:** "Certificate name mismatch" errors.

**Solution:** Obtain a certificate for the correct domain:

```bash
sudo certbot certonly --nginx -d matrix.example.com
```

### Missing Intermediate Certificates

**Symptoms:** Some clients can connect, others cannot. Mobile apps may fail.

**Solution:** Use `fullchain.pem` instead of `cert.pem`:

```nginx
ssl_certificate /etc/letsencrypt/live/matrix.example.com/fullchain.pem;
```

### Self-Signed Certificate

**Symptoms:** Federation fails with certificate validation errors.

**Solution:** Replace with a certificate from a trusted CA like Let's Encrypt. Self-signed certificates do not work for federation.

### Permission Denied

**Symptoms:** Service cannot read certificate files.

**Solution:**

```bash
# Add service user to ssl-cert group
sudo usermod -a -G ssl-cert matrix-synapse

# Set correct permissions
sudo chmod 640 /etc/letsencrypt/live/matrix.example.com/privkey.pem
sudo chgrp ssl-cert /etc/letsencrypt/live/matrix.example.com/privkey.pem

# Restart service
sudo systemctl restart matrix-synapse
```

## Certificate Monitoring

Set up monitoring to avoid certificate expiry surprises:

### Using Certbot

Certbot sends email notifications before expiry if you provided an email during setup.

### Using Monitoring Tools

- **Uptime Robot** - Free monitoring with SSL certificate expiry checks
- **Prometheus + Blackbox Exporter** - Self-hosted monitoring
- **Nagios/Icinga** - Traditional monitoring solutions

### Manual Check Script

```bash
#!/bin/bash
# check-cert-expiry.sh

DOMAIN="matrix.example.com"
DAYS_WARN=30

EXPIRY_DATE=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s)
NOW_EPOCH=$(date +%s)
DAYS_LEFT=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))

if [ $DAYS_LEFT -lt $DAYS_WARN ]; then
    echo "WARNING: Certificate expires in $DAYS_LEFT days!"
    # Send alert (email, Slack, etc.)
else
    echo "Certificate valid for $DAYS_LEFT more days"
fi
```

## Security Best Practices

### Use Strong TLS Configuration

- Enable only TLS 1.2 and TLS 1.3
- Use modern cipher suites
- Enable OCSP stapling
- Disable old protocols (SSL, TLS 1.0, TLS 1.1)

### Certificate Management

- Set up automatic renewal
- Monitor certificate expiry
- Keep private keys secure (600 permissions)
- Use separate certificates for different services
- Rotate certificates periodically

### Keep Software Updated

- Update Certbot regularly
- Keep your web server updated
- Apply security patches promptly

## Alternative Certificate Authorities

While Let's Encrypt is recommended, other options exist:

### Commercial CAs

- **DigiCert** - Enterprise-grade certificates
- **Sectigo** - Affordable certificates with support
- **GlobalSign** - Widely trusted CA

### Other Free Options

- **ZeroSSL** - Free certificates similar to Let's Encrypt
- **Buypass** - Free certificates (primarily for Europe)

## Troubleshooting

### Certbot Rate Limits

Let's Encrypt has rate limits:
- 50 certificates per domain per week
- 5 duplicate certificates per week

If you hit rate limits, wait a week or use staging environment:

```bash
sudo certbot certonly --staging -d matrix.example.com
```

### DNS Validation Issues

For wildcard certificates:

1. Create TXT record as instructed
2. Wait for DNS propagation (5-60 minutes)
3. Verify: `dig _acme-challenge.example.com TXT`
4. Continue Certbot process

### Port 80 Required

Certbot needs port 80 for HTTP validation:

```bash
# Temporarily allow port 80
sudo ufw allow 80/tcp

# Run Certbot
sudo certbot certonly --standalone -d matrix.example.com

# Close port 80 if not needed
sudo ufw delete allow 80/tcp
```

## Next Steps

- Configure [Federation Setup](/docs/federation-setup) with your new certificate
- Set up [Well-Known Delegation](/docs/wellknown-delegation)
- Review [Network Troubleshooting](/docs/network-troubleshooting) if issues arise
- Test your setup with this connectivity tester

## Related Documentation

- [Federation Setup](/docs/federation-setup)
- [Federation TLS](/docs/federation-tls)
- [Network Troubleshooting](/docs/network-troubleshooting)
- [Server Configuration](/docs/server-configuration)
