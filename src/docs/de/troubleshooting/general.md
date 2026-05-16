## Übersicht

Führen Sie zunächst den [Verbindungstest](/) für Ihren Server aus. Er zeigt Ihnen, welche Prüfung fehlschlägt, und beschreibt das Problem. Die folgenden Abschnitte erklären, wie Sie die häufigsten Probleme diagnostizieren und beheben.

## Verbund funktioniert nicht

### Andere Server können meinen Server nicht finden

**Symptome:** Nutzer auf anderen Servern können Ihren Nutzern keine Nachrichten senden. Räume auf anderen Servern sind nicht zugänglich.

**Zuerst prüfen:**

```bash
# Ist Ihre Well-Known-Datei erreichbar?
curl https://beispiel.de/.well-known/matrix/server

# Gibt sie gültiges JSON mit einem m.server-Feld zurück?
curl https://beispiel.de/.well-known/matrix/server | jq .

# Ist der Verbund-Endpunkt erreichbar?
curl https://matrix.beispiel.de/_matrix/federation/v1/version
```

**Häufige Ursachen:**

- `.well-known/matrix/server`-Datei fehlt oder gibt falschen Inhalt zurück
- Reverse-Proxy leitet `/_matrix/federation/*` nicht an Ihren Homeserver weiter
- Port 443 (oder 8448) ist vom Internet aus nicht erreichbar
- TLS-Zertifikat stimmt nicht mit der Domain in der Well-Known-Datei überein

Siehe [Verbund einrichten](/docs/getting-started/federation-setup) für die vollständige Anleitung.

### TLS-Zertifikatsfehler

**Symptome:** In den Logs erscheint `SSL verification failed` oder `certificate verify failed` beim Verbund mit anderen Servern.

**Zertifikat prüfen:**

```bash
openssl s_client -connect matrix.beispiel.de:443 -servername matrix.beispiel.de
```

**Häufige Ursachen:**

- Abgelaufenes Zertifikat — erneuern Sie es mit `sudo certbot renew`
- Selbstsigniertes Zertifikat — besorgen Sie ein Let's-Encrypt-Zertifikat
- Zertifikat deckt falsche Domain ab — prüfen Sie, ob es mit der Adresse in Ihrer Well-Known-Datei übereinstimmt
- `cert.pem` statt `fullchain.pem` verwendet — Zwischenzertifikate fehlen

Siehe [TLS-Zertifikate](/docs/configuration/tls-certificates) für Details.

### Verbund funktioniert nur zeitweise

**Symptome:** Manchmal funktioniert der Verbund, manchmal nicht.

**Häufige Ursachen:**

- Ihre Domain wird auf mehrere IP-Adressen aufgelöst, aber nicht alle zeigen auf Ihren Server (DNS-Fehlkonfiguration)
- Die Well-Known-Datei liefert von verschiedenen Servern unterschiedliche Inhalte (veralteter Cache, CDN-Probleme)
- Rate-Limiting blockiert manche Remote-Server

Führen Sie den Verbindungstest mehrfach aus. Bei inkonsistenten Ergebnissen prüfen Sie Ihre DNS-Einträge und stellen Sie sicher, dass alle IPs auf denselben Server zeigen.

## Verbindungsprobleme bei Clients

### Clients finden den Homeserver nicht

**Symptome:** Matrix-Apps melden „Homeserver nicht gefunden" oder können Ihren Server nicht automatisch erkennen.

**Client-Well-Known-Datei prüfen:**

```bash
curl https://beispiel.de/.well-known/matrix/client
```

Sie sollte gültiges JSON mit dem Feld `m.homeserver.base_url` zurückgeben. Fehlt die Datei oder ist sie fehlerhaft, können Clients Ihren Server nicht automatisch finden — Nutzer müssen die vollständige Adresse manuell eingeben.

Siehe [Well-Known-Delegierung](/docs/api-endpoints/well-known-delegation) für die Einrichtung.

### CORS-Fehler in Browser-Clients

**Symptome:** Die Browser-Konsole zeigt CORS-Fehler. Element Web oder ähnliche Clients schlagen fehl.

**CORS-Header prüfen:**

```bash
curl -I https://matrix.beispiel.de/_matrix/client/versions
```

Die Antwort muss `Access-Control-Allow-Origin: *` enthalten. Siehe [CORS-Konfiguration](/docs/configuration/cors) für die Einrichtung.

## DNS-Probleme

### Domain wird nicht aufgelöst

```bash
# A-Record prüfen
dig +short beispiel.de

# Von einem externen DNS-Server prüfen
dig @8.8.8.8 beispiel.de

# SRV-Einträge prüfen
dig +short _matrix-fed._tcp.beispiel.de SRV
```

Wenn DNS-Einträge kürzlich geändert wurden, warten Sie 24–48 Stunden für die Propagierung.

### Port nicht erreichbar

**Symptome:** Verbindungsversuche zum Server laufen in einen Timeout.

**Vom eigenen Server prüfen:**

```bash
sudo ss -tlnp | grep -E '(443|8448|8008)'
```

**Von einem externen Rechner testen:**

```bash
telnet beispiel.de 443
```

Stellen Sie sicher, dass Ihre Firewall eingehende Verbindungen auf Port 443 (oder 8448 bei SRV-Delegierung) zulässt.

## Leistungsprobleme

### Server antwortet langsam

Wenn der Verbindungstest erfolgreich ist, aber langsame Antwortzeiten meldet:

1. Server-Ressourcenauslastung prüfen: `htop` oder `top`
2. [Server-Logs](/docs/troubleshooting/server-logs) auf Fehler und Warnungen überprüfen
3. Siehe [Leistung](/docs/troubleshooting/performance) für Optimierungshinweise

## Weitere Hilfe

Wenn Sie das Problem mit den obigen Schritten nicht lösen können:

1. Notieren Sie die Ergebnisse des Verbindungstests
2. Sammeln Sie relevante Log-Auszüge (siehe [Server-Logs](/docs/troubleshooting/server-logs))
3. Fragen Sie in [#homeservers:matrix.org](https://matrix.to/#/#homeservers:matrix.org) oder im zugehörigen Homeserver-Support-Raum
4. Siehe [Hilfe erhalten](/docs/getting-started/getting-help) für alle Support-Ressourcen
