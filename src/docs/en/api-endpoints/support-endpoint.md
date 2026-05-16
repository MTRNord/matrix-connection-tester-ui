## What is the support endpoint?

The support endpoint lets you publish contact information for your homeserver — who to reach if there are problems, how to report security issues, and where to find your support page. It is a public JSON file that users, clients, and other server operators can query.

:::banner{kind="info" title="Technical Reference"}
The support endpoint is defined as `GET /.well-known/matrix/support` and was specified in [MSC1929](https://github.com/matrix-org/matrix-spec-proposals/pull/1929), merged into the Matrix specification in 2023.
:::

## Why configure it?

Configuring the support endpoint is optional but recommended. It makes it easier for:

- Users to get help when they have problems
- Other server admins to contact you about federation issues
- Security researchers to report vulnerabilities responsibly
- Clients to surface your support information to users

## Endpoint format

The file at `https://matrix.example.com/.well-known/matrix/support` returns JSON:

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

### Roles

| Role              | Purpose                                   |
| ----------------- | ----------------------------------------- |
| `m.role.admin`    | General server administration and support |
| `m.role.security` | Security vulnerability reports            |

### Contact fields

Each contact object must have at least one of `matrix_id` or `email_address`. The `role` field is required.

- `matrix_id` — a Matrix ID on your server (use an account that is actively monitored)
- `email_address` — an email address (prefer role-based addresses like `admin@` or `security@`)
- `support_page` — a URL to a support page, documentation, or contact form

## Configuration examples

### Nginx

```nginx
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
```

### Caddy

```caddy
matrix.example.com {
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

### Static file

Create a file at `/.well-known/matrix/support` on your web server. Ensure it is served with:

- `Content-Type: application/json`
- `Access-Control-Allow-Origin: *`

## Testing

```bash
# Check the endpoint is reachable
curl https://matrix.example.com/.well-known/matrix/support

# Check headers
curl -I https://matrix.example.com/.well-known/matrix/support

# Validate the JSON
curl https://matrix.example.com/.well-known/matrix/support | jq .
```

## Common issues

### Endpoint returns 404

The file or Nginx/Caddy location block is not in place. Check your reverse proxy configuration.

### Missing CORS header

Add `Access-Control-Allow-Origin: *` to the response. Without it, web-based clients cannot read the endpoint.

### Invalid JSON

If the JSON contains extra whitespace or characters from your reverse proxy configuration, validate it:

```bash
curl https://matrix.example.com/.well-known/matrix/support | jq .
```

Any parsing error from `jq` means the JSON is malformed.

## Privacy considerations

The support endpoint is publicly accessible. Use role-based email addresses (`admin@`, `security@`) rather than personal ones, and only publish contact details you are prepared to receive messages at.
