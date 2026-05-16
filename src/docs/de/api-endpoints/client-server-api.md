## Was ist die Client-Server-API?

Die Client-Server-API ist der Weg, auf dem Matrix-Apps mit Ihrem Homeserver kommunizieren. Wenn jemand Element (oder einen anderen Matrix-Client) öffnet und sich einloggt, eine Nachricht sendet oder die Raumliste lädt, verwendet er diese API. Sie ist getrennt vom Verbund, der beschreibt, wie Ihr Server mit anderen Servern kommuniziert.

:::banner{kind="info" title="Technische Referenz"}
Die Client-Server-API ist in der [Matrix Client-Server-API-Spezifikation](https://spec.matrix.org/latest/client-server-api/) definiert.
:::

## Was der Verbindungstest prüft

Der Tester ruft `/_matrix/client/versions` auf, um zu bestätigen, dass Ihr Server auf Client-Anfragen antwortet, und meldet, welche API-Versionen er unterstützt. Eine fehlgeschlagene Client-Server-Prüfung bedeutet normalerweise eines von:

- Ihr Reverse-Proxy leitet `/_matrix/client/*`-Anfragen nicht an Ihren Homeserver weiter
- CORS-Header fehlen, was verhindert, dass Web-Clients sich verbinden
- Der Homeserver läuft nicht

## Client-Discovery

Vor der Verbindung suchen Clients nach `https://beispiel.de/.well-known/matrix/client`, um Ihre Server-Adresse zu finden:

```json
{
  "m.homeserver": {
    "base_url": "https://matrix.beispiel.de"
  }
}
```

Ohne diese Datei müssen Nutzer die vollständige Homeserver-Adresse manuell eingeben. Einrichtungsanweisungen finden Sie unter [Well-Known-Delegierung](/docs/api-endpoints/well-known-delegation).

## API-Versionen

Der `/versions`-Endpunkt teilt Clients mit, welche API-Versionen Ihr Server unterstützt:

```bash
curl https://matrix.beispiel.de/_matrix/client/versions
```

Erwartete Antwort:

```json
{
  "versions": ["v1.1", "v1.2", "v1.3", "v1.4", "v1.5"],
  "unstable_features": {
    "org.matrix.msc3266": true
  }
}
```

Moderne Homeserver wie Synapse unterstützen mehrere Versionen. Clients verwenden die höchste Version, die beide — Client und Server — unterstützen.

## CORS-Anforderung

Die Client-Server-API muss mit CORS-Headern bereitgestellt werden, damit webbasierte Clients sich von beliebigen Domains aus verbinden können. Ohne diese Header schlagen Browser-Clients fehl, auch wenn Desktop- und Mobil-Apps einwandfrei funktionieren.

Einrichtungsanweisungen finden Sie unter [CORS-Konfiguration](/docs/configuration/cors).

## Authentifizierung

Clients authentifizieren sich mit einem Zugriffstoken, das beim Login erhalten wird. Das Token wird bei jeder Anfrage im `Authorization`-Header mitgesendet:

```http
Authorization: Bearer syt_abc123...
```

Traditionelle Matrix-Zugriffstoken sind langlebig und laufen nicht automatisch ab — sie bleiben gültig, bis ein Nutzer sich explizit abmeldet oder ein Administrator sie widerruft. „Invalid access token"-Fehler in Ihren Logs bedeuten typischerweise, dass ein Nutzer sich von einem anderen Gerät abgemeldet oder das Token widerrufen wurde.

Der [Matrix Authentication Service (MAS)](https://github.com/element-hq/matrix-authentication-service) ist die empfohlene Authentifizierungslösung für Synapse und führt OAuth2/OIDC mit kurzlebigen Zugriffstoken und Refresh-Token ein — ähnlich wie moderne Web-Authentifizierung funktioniert.

## Testen

```bash
# Prüfen ob die API erreichbar ist
curl https://matrix.beispiel.de/_matrix/client/versions

# Client-Well-Known prüfen
curl https://beispiel.de/.well-known/matrix/client

# Prüfen ob CORS-Header vorhanden sind
curl -I https://matrix.beispiel.de/_matrix/client/versions
```

Oder führen Sie den [Verbindungstest](/) aus, der all das automatisch prüft.
