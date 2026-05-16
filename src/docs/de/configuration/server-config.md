## Überblick

Diese Seite behandelt die grundlegenden Konfigurationsoptionen, die beeinflussen, ob der Verbindungstest Ihren Server erreichen kann. Es handelt sich nicht um eine vollständige Homeserver-Konfigurationsanleitung — für vollständige Details lesen Sie bitte die offizielle Dokumentation Ihres Homeservers.

- [Synapse-Dokumentation](https://element-hq.github.io/synapse/latest/)
- [Continuwuity-Dokumentation](https://continuwuity.org/)

## Servername

Der Servername ist die Domain, die in Matrix-IDs erscheint (`@nutzer:beispiel.de`). Er muss vor dem Produktionsbetrieb festgelegt werden — eine spätere Änderung erstellt effektiv einen neuen Server.

**Synapse (`homeserver.yaml`):**

```yaml
server_name: 'beispiel.de'
```

**Continuwuity (`config.toml`):**

```toml
[global]
server_name = "beispiel.de"
```

:::banner{kind="warn" title="Dies kann später nicht geändert werden"}
Sobald Nutzer sich auf Ihrem Server registriert haben, ist eine Änderung des Servernamens nicht mehr möglich. Alle bestehenden Nutzer-IDs, Raummitgliedschaften und Nachrichtenverläufe sind mit dem ursprünglichen Servernamen verknüpft.
:::

## Listening-Konfiguration

Damit der Verbindungstest Ihren Server erreichen kann, muss er vom öffentlichen Internet aus erreichbar sein. Das empfohlene Setup ist, den Homeserver nur auf localhost lauschen zu lassen und einen Reverse-Proxy (Nginx oder Caddy) für TLS und die Weiterleitung von Anfragen zu verwenden.

**Synapse — nur auf localhost lauschen (Reverse-Proxy übernimmt TLS):**

```yaml
listeners:
  - port: 8008
    type: http
    tls: false
    bind_addresses: ['127.0.0.1']
    x_forwarded: true
    resources:
      - names: [client, federation]
        compress: false
```

Die Einstellung `x_forwarded: true` weist Synapse an, dem `X-Forwarded-For`-Header Ihres Reverse-Proxys zu vertrauen, sodass die echte Client-IP-Adresse sichtbar ist.

Reverse-Proxy-Beispiele für TLS auf Port 443 finden Sie unter [TLS-Zertifikate](/docs/configuration/tls-certificates).

## Registrierung

Standardmäßig sollte die offene Registrierung deaktiviert oder vor Missbrauch geschützt sein. Der Verbindungstest erfordert keine offene Registrierung.

**Synapse — Registrierung deaktivieren:**

```yaml
enable_registration: false
```

**Synapse — Registrierung mit CAPTCHA:**

```yaml
enable_registration: true
enable_registration_captcha: true
recaptcha_public_key: 'IHR_RECAPTCHA_PUBLIC_KEY'
recaptcha_private_key: 'IHR_RECAPTCHA_PRIVATE_KEY'
```

**Synapse — Registrierung mit Einladungs-Tokens:**

```yaml
enable_registration: true
registration_requires_token: true
```

Tokens werden über die [Synapse Admin API](https://element-hq.github.io/synapse/latest/admin_api/registration_tokens.html) erstellt.

:::banner{kind="info" title="Matrix Authentication Service"}
Für Synapse ist der [Matrix Authentication Service (MAS)](https://github.com/element-hq/matrix-authentication-service) die empfohlene Authentifizierungslösung. Er bietet OAuth2/OIDC-Unterstützung und flexiblere Registrierungskontrollen als die integrierte Synapse-Authentifizierung.
:::

## Verbund

Der Verbund ist in Synapse standardmäßig aktiviert. Falls Sie ihn versehentlich deaktiviert haben, prüfen Sie, ob eine `federation_domain_whitelist`-Einstellung vorhanden ist, die einschränkt, mit welchen Servern Sie föderieren können.

**Synapse — uneingeschränkter Verbund (Standard):**

```yaml
# Kein federation_domain_whitelist bedeutet Verbund mit allen Servern
```

## Häufige Konfigurationsfehler

### Server antwortet auf localhost, aber nicht von außen

Ihr Homeserver ist wahrscheinlich nur an `127.0.0.1` gebunden (was korrekt ist), aber Ihr Reverse-Proxy ist nicht so konfiguriert, dass er Anfragen daran weiterleitet. Prüfen Sie Ihre Nginx- oder Caddy-Konfiguration.

### `x_forwarded` nicht gesetzt

Ohne `x_forwarded: true` in Synapse verwendet das Rate-Limiting die Adresse des Proxys anstelle der echten Client-IP. Dies ist kein Verbindungsproblem, kann aber zu unerwartetem Verhalten führen.

### Falscher Servername

Der `server_name` in Ihrer Homeserver-Konfiguration muss mit der Domain in Ihren Well-Known-Dateien und der TLS-Zertifikatskette übereinstimmen. Stimmen diese nicht überein, schlägt der Verbund fehl.

## Siehe auch

- [Verbund-Einrichtung](/docs/getting-started/federation-setup) — Well-Known-Delegierung konfigurieren
- [TLS-Zertifikate](/docs/configuration/tls-certificates) — Zertifikat-Setup und Reverse-Proxy-Beispiele
- [CORS-Konfiguration](/docs/configuration/cors) — erforderlich für webbasierte Clients
- [Server-Logs](/docs/troubleshooting/server-logs) — Logs Ihres Homeservers lesen
