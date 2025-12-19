---
title: Support Endpoint Configuration
description: Configure the Matrix support endpoint for contact information
---

## What is the Support Endpoint?

The Matrix support endpoint provides contact information for your homeserver. It tells users and administrators how to get help, report issues, or contact server operators.

This endpoint is accessed at `https://matrix.example.com/.well-known/matrix/support` and returns contact information in a standardized format.

:::inset
**Technical Reference:** The support endpoint is defined in [MSC1929](https://github.com/matrix-org/matrix-spec-proposals/blob/main/proposals/1929-homeserver-admin-contact-endpoint.md) and is part of the Matrix specification.
:::

## Why Configure a Support Endpoint?

- **User support** - Help users find assistance when they have problems
- **Admin contact** - Provide ways to reach server administrators
- **Security reports** - Enable responsible disclosure of security issues
- **Federation issues** - Help other server admins contact you about federation problems
- **Transparency** - Show users how to reach the people running the server

## Support Endpoint Format

The endpoint returns JSON with contact information:

```json
{
  "contacts": [
    {
      "matrix_id": "@admin:example.com",
      "email_address": "admin@example.com",
      "role": "m.role.admin"
    },
    {
      "matrix_id": "@security:example.com",
      "email_address": "security@example.com",
      "role": "m.role.security"
    }
  ],
  "support_page": "https://example.com/support"
}
```

## Configuration Examples

### Nginx

Serve the support endpoint with Nginx:

```nginx
server {
    listen 443 ssl http2;
    server_name matrix.example.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/matrix.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/matrix.example.com/privkey.pem;

    # Support endpoint
    location = /.well-known/matrix/support {
        default_type application/json;
        add_header Access-Control-Allow-Origin *;
        return 200 '{
            "contacts": [
                {
                    "matrix_id": "@admin:example.com",
                    "email_address": "admin@example.com",
                    "role": "m.role.admin"
                }
            ],
            "support_page": "https://example.com/support"
        }';
    }
}
```

### Caddy

Serve the support endpoint with Caddy:

```caddy
matrix.example.com {
    # Support endpoint
    header /.well-known/matrix/support Content-Type application/json
    header /.well-known/matrix/support Access-Control-Allow-Origin *
    respond /.well-known/matrix/support `{
        "contacts": [
            {
                "matrix_id": "@admin:example.com",
                "email_address": "admin@example.com",
                "role": "m.role.admin"
            }
        ],
        "support_page": "https://example.com/support"
    }` 200
}
```

### Apache

Serve the support endpoint with Apache:

```apache
<VirtualHost *:443>
    ServerName matrix.example.com

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/matrix.example.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/matrix.example.com/privkey.pem

    <Location "/.well-known/matrix/support">
        Header set Content-Type "application/json"
        Header set Access-Control-Allow-Origin "*"

        # Serve inline JSON (requires mod_rewrite)
        RewriteEngine On
        RewriteRule .* - [R=200,L]
    </Location>
</VirtualHost>
```

### Static File

Create a static JSON file at `/.well-known/matrix/support`:

**`/var/www/html/.well-known/matrix/support`:**

```json
{
  "contacts": [
    {
      "matrix_id": "@admin:example.com",
      "email_address": "admin@example.com",
      "role": "m.role.admin"
    },
    {
      "matrix_id": "@security:example.com",
      "email_address": "security@example.com",
      "role": "m.role.security"
    }
  ],
  "support_page": "https://example.com/support"
}
```

Ensure the file is served with proper headers:

- Content-Type: `application/json`
- Access-Control-Allow-Origin: `*`

## Contact Roles

The `role` field identifies the type of contact:

| Role              | Purpose                                               |
| ----------------- | ----------------------------------------------------- |
| `m.role.admin`    | General administration and server management          |
| `m.role.security` | Security vulnerability reports and security incidents |

### Admin Contact

For general server administration:

```json
{
  "matrix_id": "@admin:example.com",
  "email_address": "admin@example.com",
  "role": "m.role.admin"
}
```

### Security Contact

For security-related issues:

```json
{
  "matrix_id": "@security:example.com",
  "email_address": "security@example.com",
  "role": "m.role.security"
}
```

## Contact Fields

### Required Fields

None of the fields are strictly required, but you should provide at least one contact method.

### matrix_id

The Matrix ID of a contact person:

```json
"matrix_id": "@admin:example.com"
```

- Must be a valid Matrix ID
- Should be an account on your server
- User should be responsive to messages

### email_address

Email contact:

```json
"email_address": "admin@example.com"
```

- Should be monitored regularly
- Consider using a role-based address (admin@, security@)
- Avoid personal email addresses that might change

### role

The contact's role:

```json
"role": "m.role.admin"
```

Currently defined roles:

- `m.role.admin` - General administration
- `m.role.security` - Security contacts

## Support Page

The `support_page` field links to a web page with support information:

```json
"support_page": "https://example.com/support"
```

This page can include:

- How to get help
- Community rooms or forums
- Documentation links
- Contact form
- Status page
- Terms of service
- Privacy policy

### Example Support Page Content

Create a dedicated support page at `https://example.com/support`:

- **Getting Help:** Link to community Matrix rooms
- **Report Issues:** Link to issue tracker or contact form
- **Security:** Instructions for reporting security vulnerabilities
- **Server Status:** Current server status and known issues
- **Documentation:** Link to your server's documentation
- **Contact:** Additional contact methods

## Multiple Contacts

You can specify multiple contacts for different purposes:

```json
{
  "contacts": [
    {
      "matrix_id": "@admin:example.com",
      "email_address": "admin@example.com",
      "role": "m.role.admin"
    },
    {
      "matrix_id": "@security:example.com",
      "email_address": "security@example.com",
      "role": "m.role.security"
    },
    {
      "matrix_id": "@support:example.com",
      "role": "m.role.admin"
    }
  ],
  "support_page": "https://example.com/support"
}
```

## Testing the Support Endpoint

### Using curl

```bash
# Test support endpoint
curl https://matrix.example.com/.well-known/matrix/support

# Check headers
curl -I https://matrix.example.com/.well-known/matrix/support
```

Expected response:

```json
{
  "contacts": [
    {
      "matrix_id": "@admin:example.com",
      "email_address": "admin@example.com",
      "role": "m.role.admin"
    }
  ],
  "support_page": "https://example.com/support"
}
```

Expected headers:

- `Content-Type: application/json`
- `Access-Control-Allow-Origin: *`

### Using This Connectivity Tester

Run the connectivity tester on the [homepage](/) to check your support endpoint. The tool will verify:

- Endpoint accessibility
- Valid JSON format
- Proper CORS headers
- Valid Matrix IDs (if provided)
- Valid email addresses (format check)

## Common Issues

### Endpoint Returns 404

**Problem:** Support endpoint not found.

**Solution:** Ensure the endpoint is configured at `/.well-known/matrix/support`

### Invalid JSON

**Problem:** Malformed JSON response.

**Solution:** Validate your JSON:

```bash
# Test JSON validity
curl https://matrix.example.com/.well-known/matrix/support | jq .
```

### Missing CORS Headers

**Problem:** Browsers cannot access the endpoint due to CORS.

**Solution:** Add CORS header:

```http
Access-Control-Allow-Origin: *
```

### Wrong Content Type

**Problem:** Endpoint served as HTML or plain text.

**Solution:** Set content type to `application/json`

## Privacy Considerations

### Public Information

Support endpoint information is publicly accessible. Consider:

- Use role-based email addresses (admin@, security@)
- Don't expose personal contact information
- Use dedicated support accounts
- Consider spam protection for published emails

### Email Addresses

If publishing email addresses:

- Use addresses you're prepared to receive spam on
- Consider using a contact form instead
- Use SPF/DKIM to prevent spoofing
- Monitor for abuse

## Best Practices

### Keep It Current

- Update contact information when it changes
- Test contacts periodically to ensure they work
- Remove outdated contacts

### Responsive Contacts

- Monitor support channels regularly
- Respond to inquiries promptly
- Set expectations for response times

### Multiple Contact Methods

Provide multiple ways to reach you:

- Matrix ID for instant messaging
- Email for formal communications
- Support page for documentation

### Security Contact

Always provide a security contact:

- Separate from general admin contact
- Monitored by security-aware personnel
- Include in security policy documentation

## Security Vulnerability Reporting

For security contacts, consider:

### Security Policy

Create a security policy at `https://example.com/security` or `/.well-known/security.txt`:

```securitytxt
Contact: mailto:security@example.com
Contact: matrix:u/security:example.com
Preferred-Languages: en
Canonical: https://example.com/.well-known/security.txt
```

### Responsible Disclosure

Document your security disclosure process:

1. How to report vulnerabilities
2. Expected response time
3. Disclosure timeline
4. Recognition policy

## Integration with Homeserver

Some homeservers can serve the support endpoint directly.

### Synapse

Synapse doesn't serve support endpoint natively. Configure via reverse proxy (recommended) or serve as static file.

### Continuwuity

Check Continuwuity documentation for support endpoint configuration options.

## Example Complete Configuration

Here's a complete example with all well-known files:

```nginx
server {
    listen 443 ssl http2;
    server_name matrix.example.com;

    ssl_certificate /etc/letsencrypt/live/matrix.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/matrix.example.com/privkey.pem;

    # Server delegation (federation)
    location = /.well-known/matrix/server {
        default_type application/json;
        add_header Access-Control-Allow-Origin *;
        return 200 '{"m.server": "matrix.example.com:443"}';
    }

    # Client discovery
    location = /.well-known/matrix/client {
        default_type application/json;
        add_header Access-Control-Allow-Origin *;
        return 200 '{"m.homeserver": {"base_url": "https://matrix.example.com"}}';
    }

    # Support endpoint
    location = /.well-known/matrix/support {
        default_type application/json;
        add_header Access-Control-Allow-Origin *;
        return 200 '{
            "contacts": [
                {
                    "matrix_id": "@admin:example.com",
                    "email_address": "admin@example.com",
                    "role": "m.role.admin"
                },
                {
                    "matrix_id": "@security:example.com",
                    "email_address": "security@example.com",
                    "role": "m.role.security"
                }
            ],
            "support_page": "https://example.com/support"
        }';
    }

    # Matrix server proxy
    location /_matrix {
        proxy_pass http://localhost:8008;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;
    }
}
```

## Next Steps

- Create a support page at your domain
- Set up monitoring for support channels
- Document your support process
- Review [Getting Help](/docs/getting-help) for community resources
- Test your configuration with this connectivity tester

## Related Documentation

- [Well-Known Delegation](/docs/wellknown-delegation)
- [Federation Setup](/docs/federation-setup)
- [Getting Help](/docs/getting-help)
- [Server Configuration](/docs/server-configuration)
