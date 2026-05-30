## Was ist Matrix 2.0-Authentifizierung?

Matrix 2.0 ersetzt das eingebaute Login-System des Homeservers durch einen delegierten OIDC-Anbieter (OpenID Connect). Anstatt dass der Homeserver Passwörter und Sitzungen direkt verwaltet, verweist er Clients an einen separaten Dienst — beispielsweise den [Matrix Authentication Service (MAS)](https://github.com/element-hq/matrix-authentication-service) — der Token über Standard-OAuth-2.0/OIDC-Flows ausstellt.

:::banner{kind="info" title="Technische Referenz"}
OIDC-Delegation ist in [MSC3861](https://github.com/matrix-org/matrix-spec-proposals/pull/3861) definiert, das in [Matrix 1.7](https://spec.matrix.org/v1.7/client-server-api/#openid-connect) in die Spezifikation aufgenommen wurde.
:::

## Warum das relevant ist

OIDC-Delegation ist ein eigenständiger Dienst, der unabhängig vom Homeserver ausfallen kann. Häufige Probleme sind:

- Der OIDC-Anbieter ist vom Homeserver aus erreichbar, aber nicht vom Browser des Clients (CORS oder Firewall)
- Die Aussteller-URL in der Homeserver-Konfiguration stimmt nicht mit dem `issuer`-Feld im OIDC-Discovery-Dokument überein
- Der Anbieter bewirbt den `matrix`-Scope nicht, den Clients benötigen, um ein Matrix-Zugriffstoken zu erhalten
- Der JWKS-Endpunkt ist nicht erreichbar, sodass Clients Token-Signaturen nicht verifizieren können

Der Verbindungstest validiert die gesamte Kette von der Homeserver-Ankündigung bis zur OIDC-Anbieterkonfiguration.

## Discovery-Kette

Der Tester durchläuft die folgende Kette der Reihe nach:

### 1. Well-Known-Ankündigung

Clients suchen zunächst nach `m.authentication` in `/.well-known/matrix/client`:

```json
{
  "m.homeserver": { "base_url": "https://matrix.beispiel.de" },
  "m.authentication": {
    "issuer": "https://auth.beispiel.de/",
    "account": "https://auth.beispiel.de/account"
  }
}
```

Das `issuer`-Feld ist hier die maßgebliche Quelle. Wenn es vorhanden ist, verwendet der Tester es direkt, ohne den Homeserver abzufragen.

### 2. Auth-Issuer-Endpunkt

Wenn `m.authentication` im Well-Known-Dokument fehlt, fragt der Tester den Auth-Issuer-Endpunkt des Homeservers ab. Welcher Endpunkt zuerst versucht wird, hängt davon ab, was der Server in `/_matrix/client/versions` bewirbt:

| Beworbenes Feature | Verwendeter Endpunkt |
| --- | --- |
| `org.matrix.msc2965` | `/_matrix/client/unstable/org.matrix.msc2965/auth_metadata` |
| Matrix ≥ 1.7 oder `org.matrix.msc3861` | `/_matrix/client/v1/auth_issuer` |
| Nichts Spezifisches | Alle oben genannten als Fallback |

Jeder Endpunkt gibt ein JSON-Objekt mit einem `issuer`-Feld zurück, das auf die Basis-URL des OIDC-Anbieters zeigt.

### 3. OIDC-Discovery-Dokument

Sobald die Aussteller-URL bekannt ist, ruft der Tester folgendes ab:

```
{issuer}/.well-known/openid-configuration
```

Dies ist ein Standard-OIDC-Discovery-Dokument. Der Tester überprüft:

- Das Dokument ist erreichbar und enthält gültiges JSON
- Das `issuer`-Feld im Dokument stimmt mit der URL überein, die zum Abrufen verwendet wurde
- `code_challenge_methods_supported` enthält `S256` (PKCE, von Matrix-Clients benötigt)
- `code_challenge_methods_supported` und andere erforderliche Felder sind vorhanden

### 4. JWKS-Endpunkt

Der `jwks_uri` im Discovery-Dokument zeigt auf den öffentlichen Schlüsselsatz des Anbieters. Clients benötigen diesen, um Token-Signaturen zu verifizieren. Der Tester prüft, ob er erreichbar ist und einen gültigen Schlüsselsatz zurückgibt.

## Was jede Prüfung bedeutet

### Aussteller-URL

Die Basis-URL des OIDC-Anbieters, entnommen aus der ersten erfolgreichen Discovery-Quelle. Diese muss exakt mit dem übereinstimmen, was der Anbieter in seinem eigenen Discovery-Dokument meldet.

### OIDC-Discovery erreichbar

Ob der Browser `{issuer}/.well-known/openid-configuration` erreichen konnte. Schlägt dies fehl, können Clients die Authentifizierung nicht abschließen, selbst wenn der Homeserver funktioniert. Das Discovery-Dokument wird in der Regel vom OIDC-Anbieter bereitgestellt, nicht vom Homeserver — ein Fehler hier deutet auf ein Problem mit der öffentlichen Erreichbarkeit des OIDC-Anbieters hin.

### Aussteller-Abweichung

Das `issuer`-Feld im Discovery-Dokument muss exakt mit der URL übereinstimmen, die zum Abrufen verwendet wurde. Eine Abweichung bricht die OIDC-Sicherheit — Clients lehnen Token von einem abweichenden Aussteller ab. Häufige Ursache ist ein Unterschied bei abschließenden Schrägstrichen zwischen der konfigurierten URL und der vom Anbieter gemeldeten URL.

### PKCE S256

Matrix-Clients benötigen PKCE (Proof Key for Code Exchange) mit der `S256`-Challenge-Methode. Dies schützt vor Abfang von Autorisierungscodes. Wenn Ihr OIDC-Anbieter `S256` nicht bewirbt, können Matrix-Clients den Login-Flow nicht sicher abschließen.

### JWKS-Endpunkt

Der JSON Web Key Set-Endpunkt stellt die öffentlichen Schlüssel bereit, die zur Verifizierung von Token verwendet werden. Ist er nicht erreichbar, können Clients die empfangenen Token-Signaturen nicht validieren, was zu Authentifizierungsfehlern führt.

## Häufige Probleme

### OIDC-CORS blockiert

Der Browser kann den OIDC-Discovery-Endpunkt oder den JWKS-Endpunkt nicht erreichen, weil CORS-Header fehlen. Der OIDC-Anbieter muss `Access-Control-Allow-Origin: *` (oder Ihren spezifischen Origin) bereitstellen auf:

- `/.well-known/openid-configuration`
- Dem JWKS-Endpunkt
- Allen Token- und Autorisierungsendpunkten

MAS liefert diese Header standardmäßig. Wenn Sie einen anderen Anbieter verwenden, prüfen Sie dessen CORS-Konfiguration.

### Aussteller-Abweichung

Prüfen Sie, ob der `issuer`-Wert in Ihrer Homeserver-Konfiguration (oder `/.well-known/matrix/client`) exakt mit dem übereinstimmt, was in `{issuer}/.well-known/openid-configuration` steht. Abschließende Schrägstriche sind eine häufige Ursache:

```
# Konfiguriert:  https://auth.beispiel.de
# Gemeldet:      https://auth.beispiel.de/
```

Beheben Sie dies, indem Sie beide konsistent machen. MAS meldet den Aussteller mit abschließendem Schrägstrich; konfigurieren Sie Ihren Homeserver entsprechend.

### JWKS nicht erreichbar

Die JWKS-Endpunkt-URL stammt aus dem Discovery-Dokument. Ist er nicht erreichbar, prüfen Sie:

- Die URL ist öffentlich zugänglich (nicht hinter einer Firewall oder VPN)
- CORS-Header sind vorhanden
- Der Endpunkt gibt ein JSON-Objekt mit einem `keys`-Array zurück

## Manuelles Testen

```bash
# Prüfen, was der Homeserver bewirbt
curl https://beispiel.de/.well-known/matrix/client | jq '."m.authentication"'

# Auth-Issuer-Endpunkt prüfen (Matrix 1.7+)
curl https://matrix.beispiel.de/_matrix/client/v1/auth_issuer

# OIDC-Discovery-Dokument abrufen
curl https://auth.beispiel.de/.well-known/openid-configuration | jq '{issuer, scopes_supported, code_challenge_methods_supported, jwks_uri}'

# CORS am Discovery-Dokument prüfen
curl -I -H "Origin: https://element.beispiel.de" https://auth.beispiel.de/.well-known/openid-configuration
```

Oder führen Sie den [Verbindungstest](/) aus, der die gesamte Kette automatisch durchläuft.
