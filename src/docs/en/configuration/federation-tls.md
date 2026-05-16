## TLS for federation

Matrix federation uses TLS for all server-to-server connections. Unlike web browsing, where a browser can show a warning and let the user continue, Matrix servers reject federation connections automatically if the certificate is not valid. There is no override — the connection simply fails.

:::banner{kind="info" title="Technical Reference"}
TLS requirements for federation are specified in the [Matrix Server-Server API specification](https://spec.matrix.org/latest/server-server-api/#tls-certificates).
:::

## Requirements

| Requirement    | Details                                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Trusted CA     | Certificate must be issued by a Certificate Authority trusted by common operating systems (Let's Encrypt, DigiCert, etc.) |
| Domain match   | The certificate's domain must match the server your well-known file points to                                             |
| Not expired    | Certificate must be within its validity period                                                                            |
| Complete chain | Must include all intermediate certificates (use `fullchain.pem`, not `cert.pem`)                                          |

## What the certificate domain must match

The certificate must match the server in your well-known file — not necessarily your base domain.

**Example:** If `https://example.com/.well-known/matrix/server` contains:

```json
{ "m.server": "matrix.example.com:443" }
```

Then the TLS certificate must be valid for `matrix.example.com`.

If you delegate to the same domain (no subdomain), the certificate must cover `example.com`.

## Obtaining certificates

Use Let's Encrypt with Certbot — see [TLS Certificates](/docs/configuration/tls-certificates) for full setup instructions. The short version:

```bash
sudo certbot --nginx -d matrix.example.com
```

Or use Caddy, which handles certificates automatically.

## Testing federation TLS

```bash
# Test the TLS handshake and see the certificate
openssl s_client -connect matrix.example.com:443 -servername matrix.example.com

# Check the expiry date
echo | openssl s_client -connect matrix.example.com:443 -servername matrix.example.com 2>/dev/null \
  | openssl x509 -noout -dates

# Verify the certificate chain is complete
openssl s_client -connect matrix.example.com:443 -servername matrix.example.com -showcerts < /dev/null
```

Or use the [connectivity tester](/) — it checks TLS validity as part of the standard test.

For a detailed TLS quality report, try [SSL Labs](https://www.ssllabs.com/ssltest/).

## Common TLS errors in federation

### "certificate verify failed" from remote servers

Other servers are refusing to connect to you.

**Check:**

1. Is your certificate from a trusted CA (not self-signed)?
2. Is it expired? (`openssl x509 -noout -dates`)
3. Does the domain match the address in your well-known file?
4. Are you using `fullchain.pem` (not just `cert.pem`)?

### "unable to get local issuer certificate"

Intermediate certificates are missing. Use `fullchain.pem` in your web server:

```nginx
ssl_certificate /etc/letsencrypt/live/matrix.example.com/fullchain.pem;
```

### Certificate expired

```bash
sudo certbot renew
sudo systemctl reload nginx
```

Check that the Certbot renewal timer is active:

```bash
sudo systemctl status certbot.timer
```

### Domain mismatch

Your well-known file says `matrix.example.com:443` but your certificate covers `example.com` (or vice versa). Obtain a certificate for the correct domain:

```bash
sudo certbot certonly --nginx -d matrix.example.com
```

## See also

- [TLS Certificates](/docs/configuration/tls-certificates) — obtaining and renewing certificates
- [Federation Setup](/docs/getting-started/federation-setup) — complete federation configuration
- [Well-Known Delegation](/docs/api-endpoints/well-known-delegation) — how servers discover your federation endpoint
