## Why TLS certificates matter for Matrix

A TLS certificate proves to other servers and clients that they are really talking to your server, and encrypts the connection. For Matrix federation, a valid certificate from a trusted Certificate Authority (CA) is mandatory — other servers will refuse to connect automatically if your certificate is self-signed or expired. There is no override: if the certificate check fails, the connection is dropped.

:::banner{kind="warn" title="Self-signed certificates do not work for federation"}
Matrix federation automatically rejects connections from servers that present self-signed certificates. You must use a certificate from a publicly trusted CA such as Let's Encrypt.
:::

## What the connectivity tester checks

The tester verifies:

- Your certificate is issued by a trusted CA
- The certificate covers the domain in your well-known file
- The certificate is not expired
- The full certificate chain is present (intermediate certificates included)

## What domain the certificate must cover

The certificate must match the server your well-known file points to — not necessarily your base domain.

**Example:** If `https://example.com/.well-known/matrix/server` contains:

```json
{ "m.server": "matrix.example.com:443" }
```

Then the TLS certificate must be valid for `matrix.example.com`. If you are not using delegation and your server answers directly at `example.com`, the certificate must cover `example.com`.

## Getting a free certificate with Let's Encrypt

[Let's Encrypt](https://letsencrypt.org/) provides free, automatically-renewing certificates trusted by all major systems. This is the recommended option for most Matrix deployments.

### Using Certbot (Nginx)

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d matrix.example.com
```

Certbot configures Nginx and sets up automatic renewal. Test that renewal works:

```bash
sudo certbot renew --dry-run
```

### Using Caddy

Caddy obtains and renews Let's Encrypt certificates automatically — no separate setup needed:

```caddy
matrix.example.com {
    reverse_proxy localhost:8008
}
```

That's it. Caddy handles the certificate.

### Certbot for Apache

```bash
sudo apt install certbot python3-certbot-apache
sudo certbot --apache -d matrix.example.com
```

## Certificate placement

### Nginx (reverse proxy — recommended)

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name matrix.example.com;

    ssl_certificate /etc/letsencrypt/live/matrix.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/matrix.example.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8008;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    listen [::]:80;
    server_name matrix.example.com;
    return 301 https://$host$request_uri;
}
```

:::banner{kind="info" title="Use fullchain.pem, not cert.pem"}
Always use `fullchain.pem` in your web server configuration. `cert.pem` omits the intermediate certificates, which causes some clients and federation partners to fail even though the certificate looks valid in a browser.
:::

### Synapse with direct TLS (not recommended for most setups)

If you are not using a reverse proxy, Synapse can handle TLS directly. Add the certificate user to the ssl-cert group first:

```bash
sudo usermod -a -G ssl-cert matrix-synapse
```

Then in `homeserver.yaml`:

```yaml
listeners:
  - port: 8448
    type: http
    tls: true
    bind_addresses: ['::']

tls_certificate_path: '/etc/letsencrypt/live/matrix.example.com/fullchain.pem'
tls_private_key_path: '/etc/letsencrypt/live/matrix.example.com/privkey.pem'
```

## Verifying your certificate

Test with OpenSSL:

```bash
# Check the certificate is valid and trusted
openssl s_client -connect matrix.example.com:443 -servername matrix.example.com

# Check the expiry date
echo | openssl s_client -connect matrix.example.com:443 -servername matrix.example.com 2>/dev/null \
  | openssl x509 -noout -dates

# Verify the certificate chain is complete
openssl s_client -connect matrix.example.com:443 -servername matrix.example.com -showcerts < /dev/null
```

Or run the [connectivity tester](/) — it will check all certificate requirements automatically. For a detailed TLS quality report, try [SSL Labs](https://www.ssllabs.com/ssltest/).

## Common certificate problems

### "certificate verify failed" from remote servers

Other servers are refusing to federate with you. Work through each of these:

1. Is your certificate from a trusted CA (not self-signed)?
2. Is it expired? Run `openssl x509 -noout -dates` to check.
3. Does the domain match the address in your well-known file?
4. Are you serving `fullchain.pem` (not just `cert.pem`)?

### Certificate expired

```bash
sudo certbot renew
sudo systemctl reload nginx
```

If the Certbot timer is not running:

```bash
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Certificate name does not match domain

The domain in your `.well-known/matrix/server` file must match what the certificate covers. If your well-known says `matrix.example.com:443`, the certificate must be valid for `matrix.example.com`.

Obtain the correct certificate:

```bash
sudo certbot certonly --nginx -d matrix.example.com
```

### Intermediate certificates missing ("unable to get local issuer certificate")

Use `fullchain.pem` instead of `cert.pem` in your server configuration:

```nginx
ssl_certificate /etc/letsencrypt/live/matrix.example.com/fullchain.pem;
```

### Permission denied reading certificate

```bash
sudo usermod -a -G ssl-cert matrix-synapse
sudo chmod 640 /etc/letsencrypt/live/matrix.example.com/privkey.pem
sudo chgrp ssl-cert /etc/letsencrypt/live/matrix.example.com/privkey.pem
sudo systemctl restart matrix-synapse
```

## See also

- [Federation Setup](/docs/getting-started/federation-setup) — complete federation configuration guide
