## Was ist CORS und warum braucht Matrix es?

Wenn jemand einen webbasierten Matrix-Client verwendet (wie Element Web im Browser), muss dieser Client Anfragen an Ihren Server von einer anderen Domain aus senden — zum Beispiel von `app.element.io` zu `matrix.beispiel.de`. Browser blockieren solche domainübergreifenden Anfragen standardmäßig aus Sicherheitsgründen.

CORS (Cross-Origin Resource Sharing) ist der Mechanismus, mit dem Ihr Server Browsern mitteilen kann: „Es ist sicher für Webseiten von beliebigen Domains, mit mir zu kommunizieren." Ohne korrekte CORS-Konfiguration werden Web-Clients nicht funktionieren, auch wenn Ihr Server ansonsten einwandfrei läuft.

:::banner{kind="info" title="Technische Referenz"}
CORS-Anforderungen für Matrix-Web-Clients sind in der [Matrix Client-Server-API-Spezifikation](https://spec.matrix.org/latest/client-server-api/#web-browser-clients) festgelegt.
:::

## Erforderliche CORS-Header

Ihr Matrix-Server muss diese Header auf allen `/_matrix/client/*`- und `/_matrix/media/*`-Antworten zurückgeben:

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: X-Requested-With, Content-Type, Authorization
```

Diese Header müssen auch auf `/.well-known/matrix/client` vorhanden sein.

:::banner{kind="warn" title="CORS nur auf clientseitigen Endpunkten"}
CORS-Header müssen auf jedem `/_matrix/client/*`- und `/_matrix/media/*`-Endpunkt sowie auf `/.well-known/matrix/client` vorhanden sein. Verbund-Endpunkte (`/_matrix/federation/*`) und `/.well-known/matrix/server` werden Server-zu-Server aufgerufen und benötigen keine CORS-Header.
:::

## Preflight-Anfragen verstehen

Bevor Browser bestimmte Anfragen senden (alles mit einem `Authorization`-Header, JSON-Inhalt oder PUT/DELETE-Methoden), senden sie automatisch zuerst eine `OPTIONS`-Anfrage, um die Erlaubnis zu erfragen. Dies nennt sich Preflight-Anfrage. Ihr Server muss darauf korrekt antworten, oder die eigentliche Anfrage wird nie gesendet.

Die Matrix-Spezifikation erfordert, dass alle Endpunkte `OPTIONS` unterstützen und der Server bei einer `OPTIONS`-Anfrage **keine** Logik ausführt — er soll lediglich die CORS-Header und eine `204 No Content`-Antwort zurückgeben.

## Konfigurationsbeispiele

### Nginx

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name matrix.beispiel.de;

    ssl_certificate /etc/letsencrypt/live/matrix.beispiel.de/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/matrix.beispiel.de/privkey.pem;

    location /_matrix {
        # Preflight-Anfragen auf Proxy-Ebene behandeln
        if ($request_method = OPTIONS) {
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'X-Requested-With, Content-Type, Authorization' always;
            add_header 'Access-Control-Max-Age' 86400 always;
            add_header 'Content-Length' 0;
            return 204;
        }

        proxy_pass http://localhost:8008;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Host $host;

        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'X-Requested-With, Content-Type, Authorization' always;
    }
}
```

### Caddy

Caddy verarbeitet CORS und Preflight automatisch, wenn Sie die Header hinzufügen:

```caddy
matrix.beispiel.de {
    reverse_proxy localhost:8008

    @matrix {
        path /_matrix/*
    }

    header @matrix {
        Access-Control-Allow-Origin "*"
        Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
        Access-Control-Allow-Headers "X-Requested-With, Content-Type, Authorization"
        Access-Control-Max-Age "86400"
    }

    @options {
        method OPTIONS
    }
    respond @options 204
}
```

## CORS testen

### Mit curl

```bash
# Prüfen ob CORS-Header am Versions-Endpunkt vorhanden sind
curl -I https://matrix.beispiel.de/_matrix/client/versions

# Preflight-Anfrage testen
curl -X OPTIONS https://matrix.beispiel.de/_matrix/client/versions \
  -H "Origin: https://app.element.io" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Authorization" \
  -I
```

Die Antwort sollte `Access-Control-Allow-Origin: *` enthalten.

### Mit der Browser-Konsole

Öffnen Sie die Entwicklertools (F12) und führen Sie aus:

```javascript
fetch('https://matrix.beispiel.de/_matrix/client/versions')
  .then((r) => r.json())
  .then((d) => console.log('OK:', d))
  .catch((e) => console.error('CORS-Fehler:', e))
```

Wenn CORS korrekt ist, sehen Sie das Versions-JSON. Ein CORS-Fehler bedeutet, dass die Header fehlen oder falsch sind.

## Häufige CORS-Probleme

### „No Access-Control-Allow-Origin header"

CORS-Header fehlen in der Antwort. Fügen Sie die Header zu Ihrem Reverse-Proxy hinzu (siehe Beispiele oben).

### OPTIONS-Anfragen geben 404 oder 405 zurück

Ihr Reverse-Proxy oder Homeserver behandelt die OPTIONS-Methode nicht. Fügen Sie den Preflight-Handler hinzu (siehe Beispiele oben).

### CORS funktioniert auf manchen Pfaden, aber nicht auf allen

CORS-Header müssen auf allen `/_matrix/*`-Pfaden gesetzt sein. Prüfen Sie, ob Ihr Pfad-Matcher alle Endpunkte abdeckt, nicht nur spezifische.

### Well-Known-Client-Datei ohne CORS-Header

`/.well-known/matrix/client` benötigt `Access-Control-Allow-Origin: *`, da webbasierte Clients sie im Browser abrufen. Konfigurationsbeispiele finden Sie unter [Well-Known-Delegierung](/docs/api-endpoints/well-known-delegation).

## Warum `Access-Control-Allow-Origin: *` für Matrix sicher ist

Das Verwenden eines Wildcard-Origins ist für Matrix beabsichtigt und sicher, weil:

- Matrix tokenbasierte Authentifizierung verwendet, keine Cookies oder Sitzungsanmeldedaten
- Die API so gestaltet ist, dass sie öffentlich zugänglich ist (alle geheimen Daten sind Ende-zu-Ende-verschlüsselt)
- Das Einschränken auf bestimmte Origins jeden Matrix-Client blockieren würde, der nicht vorab genehmigt ist
