## Was ist der Support-Endpunkt?

Der Support-Endpunkt ermöglicht es Ihnen, Kontaktinformationen für Ihren Homeserver zu veröffentlichen — wen man bei Problemen erreichen kann, wie man Sicherheitsprobleme melden kann, und wo man Ihre Support-Seite findet. Es handelt sich um eine öffentliche JSON-Datei, die Nutzer, Clients und andere Serverbetreiber abfragen können.

:::banner{kind="info" title="Technische Referenz"}
Der Support-Endpunkt ist als `GET /.well-known/matrix/support` definiert und wurde in [MSC1929](https://github.com/matrix-org/matrix-spec-proposals/pull/1929) spezifiziert, das 2023 in die Matrix-Spezifikation aufgenommen wurde.
:::

## Warum konfigurieren?

Die Konfiguration des Support-Endpunkts ist optional, aber empfehlenswert. Er erleichtert:

- Nutzern, Hilfe zu finden, wenn sie Probleme haben
- Anderen Serveradministratoren, Sie bei Verbundproblemen zu kontaktieren
- Sicherheitsforschern, Sicherheitslücken verantwortungsvoll zu melden
- Clients, Ihre Support-Informationen für Nutzer zugänglich zu machen

## Endpunkt-Format

Die Datei unter `https://matrix.beispiel.de/.well-known/matrix/support` gibt JSON zurück:

```json
{
  "contacts": [
    {
      "matrix_id": "@admin:beispiel.de",
      "email_address": "admin@beispiel.de",
      "role": "m.role.admin"
    },
    {
      "matrix_id": "@security:beispiel.de",
      "email_address": "security@beispiel.de",
      "role": "m.role.security"
    }
  ],
  "support_page": "https://beispiel.de/support"
}
```

### Rollen

| Rolle             | Zweck                                       |
| ----------------- | ------------------------------------------- |
| `m.role.admin`    | Allgemeine Serveradministration und Support |
| `m.role.security` | Meldung von Sicherheitslücken               |

### Kontaktfelder

Jedes Kontaktobjekt muss mindestens eines von `matrix_id` oder `email_address` enthalten. Das Feld `role` ist Pflicht.

- `matrix_id` — eine Matrix-ID auf Ihrem Server (verwenden Sie ein aktiv überwachtes Konto)
- `email_address` — eine E-Mail-Adresse (bevorzugen Sie rollenbasierte Adressen wie `admin@` oder `security@`)
- `support_page` — eine URL zu einer Support-Seite, Dokumentation oder einem Kontaktformular

## Konfigurationsbeispiele

### Nginx

```nginx
location = /.well-known/matrix/support {
    default_type application/json;
    add_header Access-Control-Allow-Origin *;
    return 200 '{
        "contacts": [
            {
                "matrix_id": "@admin:beispiel.de",
                "email_address": "admin@beispiel.de",
                "role": "m.role.admin"
            },
            {
                "matrix_id": "@security:beispiel.de",
                "email_address": "security@beispiel.de",
                "role": "m.role.security"
            }
        ],
        "support_page": "https://beispiel.de/support"
    }';
}
```

### Caddy

```caddy
matrix.beispiel.de {
    header /.well-known/matrix/support Content-Type application/json
    header /.well-known/matrix/support Access-Control-Allow-Origin *
    respond /.well-known/matrix/support `{
        "contacts": [
            {
                "matrix_id": "@admin:beispiel.de",
                "email_address": "admin@beispiel.de",
                "role": "m.role.admin"
            }
        ],
        "support_page": "https://beispiel.de/support"
    }` 200
}
```

### Statische Datei

Erstellen Sie eine Datei unter `/.well-known/matrix/support` auf Ihrem Webserver. Stellen Sie sicher, dass sie mit folgenden Headern ausgeliefert wird:

- `Content-Type: application/json`
- `Access-Control-Allow-Origin: *`

## Testen

```bash
# Prüfen ob der Endpunkt erreichbar ist
curl https://matrix.beispiel.de/.well-known/matrix/support

# Header prüfen
curl -I https://matrix.beispiel.de/.well-known/matrix/support

# JSON validieren
curl https://matrix.beispiel.de/.well-known/matrix/support | jq .
```

## Häufige Probleme

### Endpunkt gibt 404 zurück

Die Datei oder der Nginx/Caddy-Location-Block ist nicht eingerichtet. Prüfen Sie Ihre Reverse-Proxy-Konfiguration.

### Fehlender CORS-Header

Fügen Sie `Access-Control-Allow-Origin: *` zur Antwort hinzu. Ohne diesen Header können webbasierte Clients den Endpunkt nicht lesen.

### Ungültiges JSON

Falls das JSON durch Ihre Reverse-Proxy-Konfiguration fehlerhafte Zeichen enthält, validieren Sie es:

```bash
curl https://matrix.beispiel.de/.well-known/matrix/support | jq .
```

Ein Parsing-Fehler von `jq` bedeutet, dass das JSON fehlerhaft ist.

## Datenschutz

Der Support-Endpunkt ist öffentlich zugänglich. Verwenden Sie rollenbasierte E-Mail-Adressen (`admin@`, `security@`) anstelle von persönlichen Adressen, und veröffentlichen Sie nur Kontaktdaten, unter denen Sie bereit sind, Nachrichten zu empfangen.
