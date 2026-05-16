## Warum TLS-Zertifikate für Matrix wichtig sind

Ein TLS-Zertifikat beweist anderen Servern und Clients, dass sie wirklich mit Ihrem Server kommunizieren, und verschlüsselt die Verbindung. Für den Matrix-Verbund ist ein gültiges Zertifikat von einer vertrauenswürdigen Zertifizierungsstelle (CA) zwingend erforderlich — andere Server werden die Verbindung automatisch ablehnen, wenn Ihr Zertifikat selbst signiert oder abgelaufen ist. Es gibt keine Ausnahme: Schlägt die Zertifikatsprüfung fehl, wird die Verbindung getrennt.

:::banner{kind="warn" title="Selbst signierte Zertifikate funktionieren nicht für den Verbund"}
Der Matrix-Verbund lehnt Verbindungen von Servern mit selbst signierten Zertifikaten automatisch ab. Sie müssen ein Zertifikat von einer öffentlich vertrauenswürdigen CA wie Let's Encrypt verwenden.
:::

## Was der Verbindungstest prüft

Der Test verifiziert:

- Ihr Zertifikat wurde von einer vertrauenswürdigen CA ausgestellt
- Das Zertifikat deckt die Domain in Ihrer Well-Known-Datei ab
- Das Zertifikat ist nicht abgelaufen
- Die vollständige Zertifikatskette ist vorhanden (einschließlich Zwischenzertifikaten)

## Welche Domain das Zertifikat abdecken muss

Das Zertifikat muss mit dem Server übereinstimmen, auf den Ihre Well-Known-Datei verweist — nicht unbedingt mit Ihrer Basis-Domain.

**Beispiel:** Wenn `https://beispiel.de/.well-known/matrix/server` enthält:

```json
{ "m.server": "matrix.beispiel.de:443" }
```

Dann muss das TLS-Zertifikat für `matrix.beispiel.de` gültig sein. Wenn Sie keine Delegierung verwenden und Ihr Server direkt unter `beispiel.de` antwortet, muss das Zertifikat `beispiel.de` abdecken.

## Kostenloses Zertifikat mit Let's Encrypt erhalten

[Let's Encrypt](https://letsencrypt.org/) stellt kostenlose, automatisch erneuernde Zertifikate bereit, die von allen wichtigen Systemen vertraut werden. Dies ist die empfohlene Option für die meisten Matrix-Deployments.

### Mit Certbot (Nginx)

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d matrix.beispiel.de
```

Certbot konfiguriert Nginx und richtet die automatische Erneuerung ein. Testen Sie, ob die Erneuerung funktioniert:

```bash
sudo certbot renew --dry-run
```

### Mit Caddy

Caddy holt und erneuert Let's Encrypt-Zertifikate automatisch — keine gesonderte Einrichtung nötig:

```caddy
matrix.beispiel.de {
    reverse_proxy localhost:8008
}
```

Das ist alles. Caddy kümmert sich um das Zertifikat.

### Certbot für Apache

```bash
sudo apt install certbot python3-certbot-apache
sudo certbot --apache -d matrix.beispiel.de
```

## Zertifikat einbinden

### Nginx (Reverse Proxy — empfohlen)

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name matrix.beispiel.de;

    ssl_certificate /etc/letsencrypt/live/matrix.beispiel.de/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/matrix.beispiel.de/privkey.pem;

    location / {
        proxy_pass http://localhost:8008;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    listen [::]:80;
    server_name matrix.beispiel.de;
    return 301 https://$host$request_uri;
}
```

:::banner{kind="info" title="fullchain.pem verwenden, nicht cert.pem"}
Verwenden Sie immer `fullchain.pem` in Ihrer Webserver-Konfiguration. `cert.pem` enthält keine Zwischenzertifikate, was dazu führt, dass einige Clients und Verbundpartner die Verbindung ablehnen, obwohl das Zertifikat im Browser gültig erscheint.
:::

### Synapse mit direktem TLS (für die meisten Setups nicht empfohlen)

Falls Sie keinen Reverse Proxy verwenden, kann Synapse TLS direkt verwalten. Fügen Sie zuerst den Zertifikatsnutzer zur Gruppe ssl-cert hinzu:

```bash
sudo usermod -a -G ssl-cert matrix-synapse
```

Dann in `homeserver.yaml`:

```yaml
listeners:
  - port: 8448
    type: http
    tls: true
    bind_addresses: ['::']

tls_certificate_path: '/etc/letsencrypt/live/matrix.beispiel.de/fullchain.pem'
tls_private_key_path: '/etc/letsencrypt/live/matrix.beispiel.de/privkey.pem'
```

## Zertifikat überprüfen

Test mit OpenSSL:

```bash
# Prüfen ob das Zertifikat gültig und vertrauenswürdig ist
openssl s_client -connect matrix.beispiel.de:443 -servername matrix.beispiel.de

# Ablaufdatum prüfen
echo | openssl s_client -connect matrix.beispiel.de:443 -servername matrix.beispiel.de 2>/dev/null \
  | openssl x509 -noout -dates

# Vollständigkeit der Zertifikatskette prüfen
openssl s_client -connect matrix.beispiel.de:443 -servername matrix.beispiel.de -showcerts < /dev/null
```

Oder führen Sie den [Verbindungstest](/) aus — er prüft automatisch alle Zertifikatsanforderungen. Für einen detaillierten TLS-Qualitätsbericht können Sie [SSL Labs](https://www.ssllabs.com/ssltest/) verwenden.

## Häufige Zertifikatsprobleme

### „certificate verify failed" von anderen Servern

Andere Server verweigern die Verbundverbindung zu Ihnen. Prüfen Sie folgende Punkte der Reihe nach:

1. Ist Ihr Zertifikat von einer vertrauenswürdigen CA (nicht selbst signiert)?
2. Ist es abgelaufen? Prüfen Sie mit `openssl x509 -noout -dates`.
3. Stimmt die Domain mit der Adresse in Ihrer Well-Known-Datei überein?
4. Verwenden Sie `fullchain.pem` (nicht nur `cert.pem`)?

### Zertifikat abgelaufen

```bash
sudo certbot renew
sudo systemctl reload nginx
```

Falls der Certbot-Timer nicht läuft:

```bash
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Zertifikat stimmt nicht mit Domain überein

Die Domain in Ihrer `.well-known/matrix/server`-Datei muss mit dem übereinstimmen, was das Zertifikat abdeckt. Wenn Ihre Well-Known-Datei `matrix.beispiel.de:443` angibt, muss das Zertifikat für `matrix.beispiel.de` gültig sein.

Besorgen Sie das korrekte Zertifikat:

```bash
sudo certbot certonly --nginx -d matrix.beispiel.de
```

### Zwischenzertifikate fehlen („unable to get local issuer certificate")

Verwenden Sie `fullchain.pem` anstelle von `cert.pem` in Ihrer Serverkonfiguration:

```nginx
ssl_certificate /etc/letsencrypt/live/matrix.beispiel.de/fullchain.pem;
```

### Zugriff auf Zertifikat verweigert

```bash
sudo usermod -a -G ssl-cert matrix-synapse
sudo chmod 640 /etc/letsencrypt/live/matrix.beispiel.de/privkey.pem
sudo chgrp ssl-cert /etc/letsencrypt/live/matrix.beispiel.de/privkey.pem
sudo systemctl restart matrix-synapse
```

## Siehe auch

- [Verbund-Einrichtung](/docs/getting-started/federation-setup) — vollständige Anleitung zur Verbundkonfiguration
