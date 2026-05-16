## TLS für den Verbund

Matrix-Verbund nutzt TLS für alle Server-zu-Server-Verbindungen. Anders als beim Surfen im Browser, wo eine Warnung angezeigt werden kann, lehnen Matrix-Server Verbundverbindungen automatisch ab, wenn das Zertifikat nicht gültig ist. Es gibt keine Ausnahme — die Verbindung schlägt einfach fehl.

:::banner{kind="info" title="Technische Referenz"}
TLS-Anforderungen für den Verbund sind in der [Matrix Server-Server-API-Spezifikation](https://spec.matrix.org/latest/server-server-api/#tls-certificates) festgelegt.
:::

## Anforderungen

| Anforderung            | Details                                                                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Vertrauenswürdige CA   | Das Zertifikat muss von einer Zertifizierungsstelle ausgestellt sein, der gängige Betriebssysteme vertrauen (Let's Encrypt, DigiCert, etc.) |
| Domain-Übereinstimmung | Die Domain des Zertifikats muss zu dem Server passen, auf den Ihre Well-Known-Datei verweist                                                |
| Nicht abgelaufen       | Das Zertifikat muss sich innerhalb seines Gültigkeitszeitraums befinden                                                                     |
| Vollständige Kette     | Muss alle Zwischenzertifikate enthalten (verwenden Sie `fullchain.pem`, nicht `cert.pem`)                                                   |

## Welche Domain das Zertifikat abdecken muss

Das Zertifikat muss zu dem Server in Ihrer Well-Known-Datei passen — nicht unbedingt zu Ihrer Basisdomain.

**Beispiel:** Wenn `https://beispiel.de/.well-known/matrix/server` enthält:

```json
{ "m.server": "matrix.beispiel.de:443" }
```

Dann muss das TLS-Zertifikat für `matrix.beispiel.de` gültig sein.

Wenn Sie zur gleichen Domain delegieren (keine Subdomain), muss das Zertifikat `beispiel.de` abdecken.

## Zertifikate erhalten

Verwenden Sie Let's Encrypt mit Certbot — vollständige Einrichtungsanleitung unter [TLS-Zertifikate](/docs/configuration/tls-certificates). Kurzversion:

```bash
sudo certbot --nginx -d matrix.beispiel.de
```

Oder verwenden Sie Caddy, das Zertifikate automatisch verwaltet.

## Verbund-TLS testen

```bash
# TLS-Handshake testen und Zertifikat anzeigen
openssl s_client -connect matrix.beispiel.de:443 -servername matrix.beispiel.de

# Ablaufdatum prüfen
echo | openssl s_client -connect matrix.beispiel.de:443 -servername matrix.beispiel.de 2>/dev/null \
  | openssl x509 -noout -dates

# Vollständigkeit der Zertifikatskette prüfen
openssl s_client -connect matrix.beispiel.de:443 -servername matrix.beispiel.de -showcerts < /dev/null
```

Oder nutzen Sie den [Verbindungstest](/) — er prüft TLS-Gültigkeit als Teil des Standardtests.

Für einen detaillierten TLS-Qualitätsbericht können Sie [SSL Labs](https://www.ssllabs.com/ssltest/) verwenden.

## Häufige TLS-Fehler im Verbund

### „certificate verify failed" von anderen Servern

Andere Server verweigern die Verbindung zu Ihnen.

**Prüfen Sie:**

1. Ist Ihr Zertifikat von einer vertrauenswürdigen CA (nicht selbst signiert)?
2. Ist es abgelaufen? (`openssl x509 -noout -dates`)
3. Stimmt die Domain mit der Adresse in Ihrer Well-Known-Datei überein?
4. Verwenden Sie `fullchain.pem` (nicht nur `cert.pem`)?

### „unable to get local issuer certificate"

Zwischenzertifikate fehlen. Verwenden Sie `fullchain.pem` in Ihrem Webserver:

```nginx
ssl_certificate /etc/letsencrypt/live/matrix.beispiel.de/fullchain.pem;
```

### Zertifikat abgelaufen

```bash
sudo certbot renew
sudo systemctl reload nginx
```

Prüfen Sie, ob der Certbot-Erneuerungstimer aktiv ist:

```bash
sudo systemctl status certbot.timer
```

### Domain-Diskrepanz

Ihre Well-Known-Datei gibt `matrix.beispiel.de:443` an, aber Ihr Zertifikat deckt `beispiel.de` ab (oder umgekehrt). Besorgen Sie ein Zertifikat für die korrekte Domain:

```bash
sudo certbot certonly --nginx -d matrix.beispiel.de
```

## Siehe auch

- [TLS-Zertifikate](/docs/configuration/tls-certificates) — Zertifikate beziehen und erneuern
- [Verbund-Einrichtung](/docs/getting-started/federation-setup) — vollständige Verbundkonfiguration
- [Well-Known-Delegierung](/docs/api-endpoints/well-known-delegation) — wie Server Ihren Verbund-Endpunkt entdecken
