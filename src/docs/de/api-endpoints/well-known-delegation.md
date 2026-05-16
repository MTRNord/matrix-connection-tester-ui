## Was ist Well-Known-Delegierung?

Die Well-Known-Delegierung ermöglicht es Ihnen, Ihren Matrix-Server unter einer anderen Domain oder einem anderen Port zu betreiben, als Ihre Matrix-ID vermuten lässt. Zum Beispiel können Sie Matrix-IDs wie `@nutzer:beispiel.de` haben, während Ihr Server tatsächlich unter `matrix.beispiel.de` betrieben wird.

Dies ist der empfohlene Ansatz für die Matrix-Servererkennung, da er flexibel ist, auf Port 443 funktioniert und mit einem einzigen Setup sowohl den Verbund (Server-zu-Server) als auch die Client-Erkennung abdeckt.

:::banner{kind="info" title="Technische Referenz"}
Die Well-Known-Delegierung ist in der [Matrix Server-Server-API-Spezifikation](https://spec.matrix.org/latest/server-server-api/#server-discovery) und der [Matrix Client-Server-API-Spezifikation](https://spec.matrix.org/latest/client-server-api/#well-known-uri) festgelegt.
:::

:::banner{kind="warn" title="Kann nicht geändert werden, sobald Nutzer auf Ihrem Server sind"}
Sobald die Well-Known-Delegierung konfiguriert ist und Nutzer dem Server beitreten, ist eine Änderung praktisch unmöglich — der Server würde aus Sicht des restlichen Matrix-Netzwerks wie ein anderer Server aussehen. Planen Sie Ihre Delegierungsstruktur sorgfältig, bevor Sie in Produktion gehen.
:::

## Wie die Erkennung funktioniert

Wenn ein Matrix-Server oder Client mit Ihrem Server kommunizieren möchte:

1. Er ruft `https://beispiel.de/.well-known/matrix/server` ab (für den Verbund) oder `https://beispiel.de/.well-known/matrix/client` (für Clients)
2. Die Well-Known-Datei teilt ihm mit, wo Ihr eigentlicher Server zu finden ist
3. Er verbindet sich mit der delegierten Adresse

:::card

### Beispiel: Client-Erkennung

Ein Nutzer öffnet seine App und gibt `@alice:beispiel.de` als sein Konto ein.

1. Client ruft ab: `https://beispiel.de/.well-known/matrix/client`
2. Datei antwortet: `{ "m.homeserver": { "base_url": "https://matrix.beispiel.de" } }`
3. Client verbindet sich mit `https://matrix.beispiel.de`
   :::

## Die zwei Well-Known-Dateien

### `/.well-known/matrix/server` (Verbund)

Dateipfad: `https://beispiel.de/.well-known/matrix/server`

Teilt anderen Matrix-Servern mit, wo Ihr Verbund-Endpunkt zu finden ist:

```json
{
  "m.server": "matrix.beispiel.de:443"
}
```

Diese Datei benötigt **keine** CORS-Header — sie wird von anderen Matrix-Servern abgerufen, nicht von Browsern.

### `/.well-known/matrix/client` (Clients)

Dateipfad: `https://beispiel.de/.well-known/matrix/client`

Teilt Matrix-Clients mit, wo sie sich verbinden sollen:

```json
{
  "m.homeserver": {
    "base_url": "https://matrix.beispiel.de"
  }
}
```

Diese Datei **muss** `Access-Control-Allow-Origin: *` enthalten, da webbasierte Clients (wie Element Web) sie über einen Browser abrufen.

## Verhältnis zu SRV-Einträgen

SRV-Einträge (`_matrix-fed._tcp`) sind eine ältere Alternative zur Well-Known-Delegierung für die Verbunderkennung. Well-Known wird bevorzugt, weil:

- Es beide — Verbund und Client-Erkennung — mit einer Einrichtung abdeckt
- Es auf Port 443 funktioniert, der selten von Firewalls blockiert wird
- SRV-Einträge nur beeinflussen, wie andere Server Ihren Verbund-Endpunkt finden — für die Client-Erkennung helfen sie nicht

:::banner{kind="info" title="Veralteter SRV-Eintragsname"}
Der `_matrix._tcp`-SRV-Eintragsname ist seit Matrix-Spezifikation v1.8 veraltet. Der aktuelle Name ist `_matrix-fed._tcp`. Neue Einrichtungen sollten Well-Known-Delegierung anstelle von SRV-Einträgen verwenden.
:::

## Konfigurationsbeispiele

### Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name beispiel.de;

    ssl_certificate /etc/letsencrypt/live/beispiel.de/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/beispiel.de/privkey.pem;

    # Verbund-Well-Known — kein CORS nötig (nur Server-zu-Server)
    location /.well-known/matrix/server {
        default_type application/json;
        return 200 '{"m.server": "matrix.beispiel.de:443"}';
    }

    # Client-Well-Known — CORS erforderlich
    location /.well-known/matrix/client {
        default_type application/json;
        add_header Access-Control-Allow-Origin *;
        return 200 '{"m.homeserver": {"base_url": "https://matrix.beispiel.de"}}';
    }
}
```

### Caddy

```caddy
beispiel.de {
    # Verbund-Well-Known
    header /.well-known/matrix/server Content-Type application/json
    respond /.well-known/matrix/server `{"m.server": "matrix.beispiel.de:443"}` 200

    # Client-Well-Known — CORS erforderlich
    header /.well-known/matrix/client Content-Type application/json
    header /.well-known/matrix/client Access-Control-Allow-Origin *
    respond /.well-known/matrix/client `{"m.homeserver": {"base_url": "https://matrix.beispiel.de"}}` 200
}
```

### Statische Dateien

Erstellen Sie die Dateien auf Ihrem Webserver:

**`/var/www/html/.well-known/matrix/server`:**

```json
{ "m.server": "matrix.beispiel.de:443" }
```

**`/var/www/html/.well-known/matrix/client`:**

```json
{ "m.homeserver": { "base_url": "https://matrix.beispiel.de" } }
```

Beide Dateien müssen mit `Content-Type: application/json` ausgeliefert werden. Die Client-Datei benötigt zusätzlich `Access-Control-Allow-Origin: *`.

## Testen

```bash
# Verbund-Well-Known testen
curl https://beispiel.de/.well-known/matrix/server

# Client-Well-Known testen (CORS-Header prüfen)
curl -I https://beispiel.de/.well-known/matrix/client

# Beide als JSON validieren
curl https://beispiel.de/.well-known/matrix/server | jq .
curl https://beispiel.de/.well-known/matrix/client | jq .
```

Oder verwenden Sie den [Verbindungstest](/) — er prüft beide Dateien und meldet genau, was falsch ist.

## Häufige Probleme

### CORS-Fehler bei der Client-Well-Known-Datei

`/.well-known/matrix/client` muss `Access-Control-Allow-Origin: *` enthalten, da Web-Clients sie im Browser abrufen. Prüfen Sie Ihre Reverse-Proxy-Konfiguration, ob dieser Header auf der Client-Datei gesetzt ist.

### Falscher Content-Type

Beide Dateien müssen `Content-Type: application/json` zurückgeben. Wenn Ihr Server `text/plain` zurückgibt, können Clients die Antwort ablehnen.

### Ungültiges JSON

```bash
curl https://beispiel.de/.well-known/matrix/client | jq .
```

Jeder Fehler von `jq` bedeutet, dass das JSON fehlerhaft ist.

### HTTPS funktioniert nicht

Die Well-Known-Delegierung erfordert HTTPS auf Port 443. Prüfen Sie, ob Ihre Basis-Domain (`beispiel.de`) ein gültiges TLS-Zertifikat hat.

### Delegierung auf einen nicht-standardmäßigen Port

```json
{ "m.server": "matrix.beispiel.de:8448" }
```

Der Port in `m.server` muss mit dem Port übereinstimmen, auf dem Ihr Server tatsächlich lauscht.
