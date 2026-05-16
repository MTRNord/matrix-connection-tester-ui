## Was sind Webhooks?

Mit Webhooks kannst du Echtzeit-Ereignisbenachrichtigungen als signierte HTTP-POST-Anfragen an eine URL deiner Wahl empfangen. Anstatt Änderungen abzufragen, wird dein System sofort benachrichtigt, sobald etwas mit einem überwachten Server passiert — nützlich für die Integration mit PagerDuty, Slack, eigenen Dashboards oder beliebigen Automatisierungspipelines.

Du konfigurierst Webhook-Endpunkte pro Alert unter **Benachrichtigungen → Bearbeiten → Webhook-Endpunkte**. Jeder Alert kann mehrere Endpunkte haben, und jeder Endpunkt kann ein eigenes HMAC-SHA256-Signing-Secret besitzen.

## Ereignistypen

| `event_type`          | Wann ausgelöst                                                         |
| --------------------- | ---------------------------------------------------------------------- |
| `federation_down`     | Federation bestätigt fehlgeschlagen (nach dem Bestätigungsschwellwert) |
| `federation_up`       | Wiederherstellung nach einem bestätigten Ausfall                       |
| `federation_reminder` | Erinnerung, solange die Federation noch ausfällt (alle 12 Stunden)     |
| `server_name_changed` | Name der Homeserver-Implementierung hat sich geändert (opt-in)         |
| `version_changed`     | Softwareversionsstring hat sich geändert (opt-in)                      |
| `tls_cert_changed`    | TLS-Zertifikats-Fingerprint hat sich geändert (opt-in)                 |
| `tls_expiry_warning`  | Zertifikat läuft in 14 Tagen oder weniger ab (opt-in)                  |
| `ping`                | Wird gesendet, wenn du auf **Testen** klickst                          |

## Payload-Format

Jede Zustellung ist ein HTTP-POST mit `Content-Type: application/json`. Der Body enthält immer diese Felder auf der obersten Ebene:

```json
{
  "event_id":   "550e8400-e29b-41d4-a716-446655440000",
  "event_type": "federation_down",
  "timestamp":  1700000000,
  "server_name": "matrix.example.com",
  "data": { ... }
}
```

| Feld          | Typ    | Beschreibung                                                          |
| ------------- | ------ | --------------------------------------------------------------------- |
| `event_id`    | string | UUID v4 — nutze diesen als Idempotenzschlüssel zur Duplikatserkennung |
| `event_type`  | string | Einer der oben genannten Ereignistypen                                |
| `timestamp`   | number | Unix-Epoch-Sekunden (i64) — nutze diesen zur Replay-Prävention        |
| `server_name` | string | Die Matrix-Homeserver-Domain, die dieser Alert überwacht              |
| `data`        | object | Ereignisspezifische Details (kann ein leeres Objekt sein)             |

## Sicherheit — Signatur verifizieren

Wenn du für einen Webhook ein HMAC-Secret konfigurierst, enthält jede Zustellung einen Signatur-Header (Standard: `X-Signature-256`). Der Wert ist im GitHub-Format:

```
X-Signature-256: sha256=<kleingeschriebenes_hex>
```

Die Signatur wird berechnet als `HMAC-SHA256(secret, raw_request_body)`.

:::banner{kind="warning" title="Signaturen in der Produktion immer prüfen"}
Überspringe die Verifizierung nur für die lokale Entwicklung. In der Produktion könnte sonst jeder, der die URL kennt, deinen Endpunkt auslösen.
:::

### Python

```python
import hashlib
import hmac

def verify_signature(secret: str, body: bytes, header: str) -> bool:
    expected = "sha256=" + hmac.new(
        secret.encode(), body, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, header)
```

### Node.js

```js
const crypto = require('crypto')

function verifySignature(secret, body, header) {
  const expected =
    'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(header))
}
```

### Shell / curl (zum Testen)

```bash
SECRET="dein-secret"
BODY='{"event_id":"...","event_type":"ping",...}'

EXPECTED=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$SECRET" -hex | awk '{print "sha256="$2}')
echo "Erwarteter Header-Wert: $EXPECTED"
```

## Replay-Prävention

Jeder Payload enthält zwei Felder, die du prüfen solltest:

- **`event_id`** — eine UUID v4. Speichere gesehene IDs mindestens 5 Minuten lang. Verwerfe jeden Payload, dessen `event_id` du bereits verarbeitet hast.
- **`timestamp`** — Unix-Epoch-Sekunden. Verwerfe jeden Payload, bei dem `|jetzt − timestamp| > 300` (5 Minuten).

Zusammen verhindern diese Felder, dass replayed oder verzögerte Zustellungen mehrfach verarbeitet werden.

## Wiederholungsverhalten

Wenn dein Endpunkt einen Nicht-2xx-Status zurückgibt (oder ein Timeout auftritt), wiederholt das System die Zustellung mit exponentiellem Backoff:

| Versuch | Verzögerung vor Wiederholung    |
| ------- | ------------------------------- |
| 1 → 2   | 30 Sekunden                     |
| 2 → 3   | 2 Minuten                       |
| 3 → 4   | 10 Minuten                      |
| 4 → 5   | 1 Stunde                        |
| 5       | Als **fehlgeschlagen** markiert |

Nach 5 fehlgeschlagenen Versuchen wird die Zustellung als `failed` markiert und es werden keine weiteren Versuche unternommen.

:::banner{kind="info" title="Schnell antworten"}
Dein Endpunkt sollte so schnell wie möglich einen 2xx-Status zurückgeben und den Payload asynchron verarbeiten. Das Timeout beträgt 10 Sekunden.
:::

## Testen

Nutze die Schaltfläche **Testen** neben einem konfigurierten Webhook, um sofort ein `ping`-Ereignis zu senden. Die Zustellung erscheint innerhalb weniger Sekunden im **Zustellungen**-Panel.
