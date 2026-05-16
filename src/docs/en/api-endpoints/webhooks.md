## What are webhooks?

Webhooks let you receive real-time event notifications as signed HTTP POST requests to a URL you control. Instead of polling for changes, your system is called the moment something happens to a monitored server — useful for integrating with PagerDuty, Slack, custom dashboards, or any automation pipeline.

You configure webhook endpoints per alert from the **Alerts → Edit → Webhook endpoints** section. Each alert can have multiple endpoints, and each endpoint can have its own HMAC-SHA256 signing secret.

## Event types

| `event_type`          | When it fires                                                   |
| --------------------- | --------------------------------------------------------------- |
| `federation_down`     | Federation confirmed failing (after the confirmation threshold) |
| `federation_up`       | Recovery from a confirmed failure                               |
| `federation_reminder` | Reminder while federation is still failing (every 12 hours)     |
| `server_name_changed` | Homeserver implementation name changed (opt-in)                 |
| `version_changed`     | Software version string changed (opt-in)                        |
| `tls_cert_changed`    | TLS certificate fingerprint changed (opt-in)                    |
| `tls_expiry_warning`  | Certificate expires within 14 days (opt-in)                     |
| `ping`                | Sent when you click the **Test** button                         |

## Payload format

Every delivery is an HTTP POST with `Content-Type: application/json`. The body always contains these top-level fields:

```json
{
  "event_id":   "550e8400-e29b-41d4-a716-446655440000",
  "event_type": "federation_down",
  "timestamp":  1700000000,
  "server_name": "matrix.example.com",
  "data": { ... }
}
```

| Field         | Type   | Description                                                       |
| ------------- | ------ | ----------------------------------------------------------------- |
| `event_id`    | string | UUID v4 — use this as an idempotency key to deduplicate retries   |
| `event_type`  | string | One of the event types listed above                               |
| `timestamp`   | number | Unix epoch seconds (i64) — use for replay prevention              |
| `server_name` | string | The Matrix homeserver domain this alert watches                   |
| `data`        | object | Event-specific details (may be an empty object for simple events) |

### Example: `federation_down`

```json
{
  "event_id": "550e8400-e29b-41d4-a716-446655440000",
  "event_type": "federation_down",
  "timestamp": 1700000000,
  "server_name": "matrix.example.com",
  "data": {
    "failure_reason": "Connection refused on port 8448"
  }
}
```

### Example: `federation_up`

```json
{
  "event_id": "660f9511-f30c-52e5-b827-557766551111",
  "event_type": "federation_up",
  "timestamp": 1700003600,
  "server_name": "matrix.example.com",
  "data": {}
}
```

### Example: `ping`

```json
{
  "event_id": "770a0622-041d-63f6-c938-668877662222",
  "event_type": "ping",
  "timestamp": 1700010000,
  "server_name": "matrix.example.com",
  "data": {}
}
```

## Security — verifying the signature

If you configure an HMAC secret for a webhook, each delivery includes a signature header (default: `X-Signature-256`). The value is in GitHub's format:

```
X-Signature-256: sha256=<lowercase_hex>
```

The signature is computed as `HMAC-SHA256(secret, raw_request_body)`.

:::banner{kind="warning" title="Always verify signatures in production"}
Skip verification only for local development. In production, an unverified endpoint could be triggered by anyone who discovers the URL.
:::

### Python

```python
import hashlib
import hmac

def verify_signature(secret: str, body: bytes, header: str) -> bool:
    expected = "sha256=" + hmac.new(
        secret.encode(), body, hashlib.sha256
    ).hexdigest()
    # Use compare_digest to prevent timing attacks
    return hmac.compare_digest(expected, header)

# In your handler (e.g. Flask):
body = request.get_data()
header = request.headers.get("X-Signature-256", "")
if not verify_signature("your-secret", body, header):
    return "Forbidden", 403
```

### Node.js

```js
const crypto = require('crypto')

function verifySignature(secret, body, header) {
  const expected =
    'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex')
  // timingSafeEqual prevents timing attacks
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(header))
}

// In your handler (e.g. Express):
app.post('/webhook', (req, res) => {
  const sig = req.headers['x-signature-256'] ?? ''
  if (!verifySignature('your-secret', req.rawBody, sig)) {
    return res.status(403).send('Forbidden')
  }
  // process event...
  res.status(200).send('OK')
})
```

### Shell / curl (for testing)

```bash
SECRET="your-secret"
BODY='{"event_id":"...","event_type":"ping",...}'

EXPECTED=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$SECRET" -hex | awk '{print "sha256="$2}')
echo "Expected header value: $EXPECTED"
```

## Replay prevention

Each payload includes two fields you should check:

- **`event_id`** — a UUID v4. Store seen IDs for at least 5 minutes. Reject any payload whose `event_id` you have already processed.
- **`timestamp`** — Unix epoch seconds. Reject any payload where `|now − timestamp| > 300` (5 minutes).

Together these prevent replayed or delayed deliveries from being processed more than once.

## Retry behaviour

If your endpoint returns a non-2xx response (or times out), the system retries with exponential back-off:

| Attempt | Delay before retry |
| ------- | ------------------ |
| 1 → 2   | 30 seconds         |
| 2 → 3   | 2 minutes          |
| 3 → 4   | 10 minutes         |
| 4 → 5   | 1 hour             |
| 5       | Marked **failed**  |

After 5 failed attempts the delivery is marked `failed` and no further retries are made. You can see delivery history — including status and HTTP response codes — in the **Deliveries** panel for each webhook.

:::banner{kind="info" title="Respond quickly"}
Your endpoint should return a 2xx status as fast as possible and process the payload asynchronously. A slow response will be retried just like a failure, and the 10-second timeout means heavy processing must happen off the request path.
:::

## Testing

Use the **Test** button next to any configured webhook to send a `ping` event immediately. The delivery appears in the **Deliveries** panel within seconds.

You can also use a service like [webhook.site](https://webhook.site/) to inspect the full payload and headers during development.
