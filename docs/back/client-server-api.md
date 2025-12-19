---
title: Client-Server API
description: Understanding the Matrix Client-Server API
---

## What is the Client-Server API?

The Matrix Client-Server API is the primary interface between Matrix clients (like Element, FluffyChat, etc.) and your homeserver. It handles user authentication, message sending/receiving, room management, and all other client operations.

:::inset
**Technical Reference:** The Client-Server API is defined in the [Matrix Client-Server API Specification](https://spec.matrix.org/latest/client-server-api/). Your homeserver must implement this API for clients to connect.
:::

## API Versioning

Matrix uses API versioning to maintain compatibility. Clients check which API versions your server supports.

### Version Endpoint

The `/versions` endpoint tells clients which API versions are available:

```bash
curl https://matrix.example.com/_matrix/client/versions
```

Expected response:

```json
{
  "versions": [
    "r0.0.1",
    "r0.1.0",
    "r0.2.0",
    "r0.3.0",
    "r0.4.0",
    "r0.5.0",
    "r0.6.0",
    "v1.1",
    "v1.2",
    "v1.3",
    "v1.4",
    "v1.5"
  ],
  "unstable_features": {
    "org.matrix.e2e_cross_signing": true,
    "org.matrix.msc2285.stable": true
  }
}
```

## Key Endpoints

### Authentication

**Login:**

- `POST /_matrix/client/v3/login`

**Registration:**

- `POST /_matrix/client/v3/register`

**Logout:**

- `POST /_matrix/client/v3/logout`

### Rooms

**Create room:**

- `POST /_matrix/client/v3/createRoom`

**Join room:**

- `POST /_matrix/client/v3/join/{roomIdOrAlias}`

**Leave room:**

- `POST /_matrix/client/v3/rooms/{roomId}/leave`

**Send message:**

- `PUT /_matrix/client/v3/rooms/{roomId}/send/{eventType}/{txnId}`

### Sync

**Sync events:**

- `GET /_matrix/client/v3/sync`

This is the most important endpoint - clients poll or long-poll this to receive new messages and events.

### Media

**Upload media:**

- `POST /_matrix/media/v3/upload`

**Download media:**

- `GET /_matrix/media/v3/download/{serverName}/{mediaId}`

## Client Discovery

Clients discover your server using the `/.well-known/matrix/client` file.

### Configure Client Well-Known

**Nginx:**

```nginx
location /.well-known/matrix/client {
    default_type application/json;
    add_header Access-Control-Allow-Origin *;
    return 200 '{"m.homeserver": {"base_url": "https://matrix.example.com"}}';
}
```

**Caddy:**

```caddy
example.com {
    header /.well-known/matrix/client Content-Type application/json
    header /.well-known/matrix/client Access-Control-Allow-Origin *
    respond /.well-known/matrix/client `{"m.homeserver": {"base_url": "https://matrix.example.com"}}` 200
}
```

### Well-Known Format

```json
{
  "m.homeserver": {
    "base_url": "https://matrix.example.com"
  },
  "m.identity_server": {
    "base_url": "https://vector.im"
  }
}
```

**Fields:**

- `m.homeserver.base_url` - Your homeserver's base URL (required)
- `m.identity_server.base_url` - Identity server URL (optional)

## CORS Requirements

The Client-Server API requires CORS headers for web clients.

### Required Headers

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization
```

See [CORS Configuration](/docs/cors-configuration) for detailed setup.

## Authentication

Matrix uses access tokens for authentication.

### Login Flow

1. Client sends credentials to `/login` endpoint
2. Server validates and returns access token
3. Client includes token in `Authorization` header for subsequent requests

**Example:**

```bash
# Login
curl -X POST https://matrix.example.com/_matrix/client/v3/login \
  -H "Content-Type: application/json" \
  -d '{
    "type": "m.login.password",
    "identifier": {
      "type": "m.id.user",
      "user": "alice"
    },
    "password": "secretpassword"
  }'

# Response includes access token
{
  "user_id": "@alice:example.com",
  "access_token": "syt_abc123...",
  "device_id": "DEVICEID"
}

# Use token for authenticated requests
curl https://matrix.example.com/_matrix/client/v3/sync \
  -H "Authorization: Bearer syt_abc123..."
```

## Rate Limiting

Protect your server from abuse with rate limiting.

**Synapse configuration:**

```yaml
rc_message:
  per_second: 0.2
  burst_count: 10

rc_registration:
  per_second: 0.17
  burst_count: 3

rc_login:
  address:
    per_second: 0.17
    burst_count: 3
  account:
    per_second: 0.17
    burst_count: 3
```

When rate limited, the server returns HTTP 429 with:

```json
{
  "errcode": "M_LIMIT_EXCEEDED",
  "error": "Too many requests",
  "retry_after_ms": 2000
}
```

## Testing the Client-Server API

### Test with curl

```bash
# Check API versions
curl https://matrix.example.com/_matrix/client/versions

# Test client well-known
curl https://example.com/.well-known/matrix/client

# Test sync endpoint (requires authentication)
curl https://matrix.example.com/_matrix/client/v3/sync?timeout=0 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test with a Client

Try connecting with Element or another Matrix client:

1. Open Element Web at https://app.element.io
2. Click "Sign In"
3. Click "Edit" next to homeserver
4. Enter your domain: `example.com`
5. Element should discover your server via well-known
6. Try logging in with a test account

### Using This Connectivity Tester

Run the connectivity tester on the [homepage](/) to automatically check:

- Client well-known configuration
- API endpoint accessibility
- CORS headers
- Supported API versions
- Common client-server issues

## Common Issues

### Client Cannot Find Homeserver

**Symptoms:** "Homeserver not found" or similar error.

**Causes:**

- Missing or misconfigured `/.well-known/matrix/client`
- CORS headers not set on well-known file
- DNS issues

**Solutions:**

1. Verify well-known file is accessible
2. Check CORS headers are present
3. Test with curl: `curl https://example.com/.well-known/matrix/client`

### CORS Errors

**Symptoms:** Browser console shows CORS errors.

**Solutions:**

- Add CORS headers to all `/_matrix/client/*` endpoints
- Handle OPTIONS preflight requests
- See [CORS Configuration](/docs/cors-configuration)

### Authentication Failures

**Symptoms:** Login fails, "Invalid credentials" errors.

**Causes:**

- Wrong password
- User doesn't exist
- Server configuration issues

**Solutions:**

1. Verify user exists
2. Check server logs for errors
3. Try registering a new user
4. Verify database connectivity

### Sync Timeouts

**Symptoms:** Client can't sync, appears offline.

**Causes:**

- Network issues
- Server overload
- Firewall blocking connections

**Solutions:**

1. Check server is running
2. Review [Server Logs](/docs/server-logs)
3. Verify network connectivity
4. Check resource usage

## Security Considerations

### HTTPS Required

Always use HTTPS for the Client-Server API:

- Protects user credentials
- Prevents message interception
- Required by most clients

### Token Security

Access tokens are sensitive:

- Store securely in clients
- Use HTTPS to prevent interception
- Implement token expiration
- Allow users to revoke tokens

### Input Validation

Validate all client input:

- Sanitize user input
- Enforce length limits
- Check content types
- Prevent injection attacks

## Performance Optimization

### Sync Optimization

The sync endpoint is heavily used:

- Enable sync caching
- Use reasonable timeout values
- Implement efficient database queries
- Consider worker processes for sync

### Media Optimization

Media can be bandwidth-intensive:

- Enable media caching
- Use CDN for media delivery
- Implement thumbnail generation
- Set reasonable upload size limits

## Advanced Features

### End-to-End Encryption

Matrix supports E2EE:

- Device verification
- Key backup
- Cross-signing
- Secret storage

Enable E2EE features in your server configuration.

### Push Notifications

Configure push for mobile apps:

```yaml
push:
  include_content: true
  group_unread_count_by_room: false
```

### Presence

User online/offline status:

```yaml
presence:
  enabled: true
```

Can be disabled for privacy/performance:

```yaml
presence:
  enabled: false
```

## API Documentation

For complete API reference, see:

- [Matrix Client-Server API Spec](https://spec.matrix.org/latest/client-server-api/)
- [Synapse API Documentation](https://element-hq.github.io/synapse/latest/)
- [Matrix Developer Docs](https://matrix.org/docs/guides/)

## Development and Testing

### API Testing Tools

- **curl** - Command-line testing
- **Postman** - API development and testing
- **matrix-js-sdk** - JavaScript SDK for building clients
- **matrix-nio** - Python SDK for Matrix

### Example with matrix-js-sdk

```javascript
const sdk = require("matrix-js-sdk");

const client = sdk.createClient({
  baseUrl: "https://matrix.example.com",
  accessToken: "YOUR_ACCESS_TOKEN",
  userId: "@alice:example.com",
});

client.startClient();

client.on("Room.timeline", (event, room) => {
  if (event.getType() !== "m.room.message") return;
  console.log(`${event.getSender()}: ${event.getContent().body}`);
});
```

## Next Steps

- Configure [CORS](/docs/cors-configuration) properly
- Set up [TLS Certificates](/docs/tls-certificates)
- Review [Well-Known Delegation](/docs/wellknown-delegation)
- Check [Troubleshooting](/docs/troubleshooting) if issues arise
- Test with this connectivity tester

## Related Documentation

- [CORS Configuration](/docs/cors-configuration)
- [CORS Preflight](/docs/cors-preflight)
- [Well-Known Delegation](/docs/wellknown-delegation)
- [Server Configuration](/docs/server-configuration)
- [Troubleshooting](/docs/troubleshooting)
