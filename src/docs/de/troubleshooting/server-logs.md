## Warum Logs wichtig sind

Server-Logs sind Ihr wichtigstes Werkzeug zur Diagnose von Problemen. Wenn etwas schiefläuft, verraten Ihnen die Logs in der Regel genau, was fehlgeschlagen ist und warum. Wenn Sie in Community-Kanälen um Hilfe bitten, fügen Sie immer relevante Log-Auszüge bei.

## Logs finden

### Synapse

```bash
# Aktuelle Logs anzeigen
sudo journalctl -u matrix-synapse -n 100

# Logs in Echtzeit verfolgen
sudo journalctl -u matrix-synapse -f

# Nach Fehlern suchen
sudo journalctl -u matrix-synapse | grep -i error

# Logs seit einem bestimmten Zeitpunkt
sudo journalctl -u matrix-synapse --since "2024-01-01 12:00:00"
```

Wenn Synapse so konfiguriert ist, dass es in eine Datei schreibt, prüfen Sie `/var/log/matrix-synapse/homeserver.log` oder den Pfad in Ihrer `homeserver.yaml`.

### Continuwuity

```bash
sudo journalctl -u continuwuity -n 100
sudo journalctl -u continuwuity -f
sudo journalctl -u continuwuity | grep -i error
```

### Nginx

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Caddy

```bash
sudo journalctl -u caddy -n 100
sudo journalctl -u caddy -f
```

## Log-Level

| Level   | Bedeutung                                             | Was tun                            |
| ------- | ----------------------------------------------------- | ---------------------------------- |
| ERROR   | Etwas ist fehlgeschlagen und erfordert Aufmerksamkeit | Untersuchen                        |
| WARNING | Potenzielles Problem oder ungewöhnliche Situation     | Prüfen                             |
| INFO    | Normale Betriebsmeldungen                             | Keine Aktion                       |
| DEBUG   | Detaillierte technische Informationen                 | Nur bei der Fehlersuche aktivieren |

## Häufige Fehlermeldungen

### „SSL verification failed" oder „certificate verify failed"

Ihr Server kann das TLS-Zertifikat eines Remote-Servers, mit dem er föderieren möchte, nicht verifizieren. Dies wird in der Regel durch ein abgelaufenes oder selbst signiertes Zertifikat auf der Remote-Seite verursacht — das Problem liegt auf der Seite des anderen Servers. Wenn es viele Server betrifft, prüfen Sie ob Ihr OS-Zertifikatsspeicher aktuell ist:

```bash
sudo update-ca-certificates
```

Wenn der Fehler das Zertifikat Ihres eigenen Servers betrifft, lesen Sie [TLS-Zertifikate](/docs/configuration/tls-certificates).

### „Connection refused" oder „Connection timed out" beim Verbund

Ihr Server kann einen Remote-Server nicht erreichen. Dies ist in der Regel ein vorübergehendes Netzwerkproblem auf der Remote-Seite. Wenn Sie einen bestimmten Server konsistent nicht erreichen können, testen Sie mit:

```bash
curl https://remote-server.beispiel.de/_matrix/federation/v1/version
```

### „Invalid access token"

Ein Client verwendet ein Token, das widerrufen wurde — typischerweise weil der Nutzer sich von einem anderen Gerät abgemeldet hat oder ein Administrator die Sitzung entfernt hat. Bei traditioneller Matrix-Authentifizierung sind Zugriffstoken langlebig und werden nur ungültig, wenn sie explizit widerrufen werden. Dieser Fehler in den Logs ist für sich allein kein Problem, es sei denn, Nutzer melden Anmeldeprobleme.

Wenn Sie den [Matrix Authentication Service (MAS)](https://github.com/element-hq/matrix-authentication-service) verwenden, haben Token kürzere Lebensdauern und Clients nutzen Refresh-Token.

### „database is locked" (nur SQLite)

SQLite kann die gleichzeitigen Datenbankoperationen nicht in dem Umfang verarbeiten, den Matrix erfordert. Migrieren Sie zu PostgreSQL — das wird für jeden Produktionsserver erwartet.

## Log-Ausführlichkeit für die Fehlersuche erhöhen

Bei Synapse können Sie vorübergehend ein Modul in Ihrer Log-Konfigurationsdatei (normalerweise `/etc/matrix-synapse/log.yaml`) auf DEBUG setzen:

```yaml
loggers:
  synapse.federation:
    level: DEBUG
```

Dann neu laden: `sudo systemctl reload matrix-synapse`

:::banner{kind="warn" title="Nach der Fehlersuche zurück auf INFO setzen"}
DEBUG-Logging erzeugt eine große Datenmenge und kann Ihren Server verlangsamen. Setzen Sie es zurück auf INFO, sobald Sie das Problem gefunden haben.
:::

## Datenschutz beim Teilen von Logs

Logs enthalten Matrix-Nutzer-IDs, Raum-IDs und IP-Adressen. Bevor Sie Log-Auszüge öffentlich teilen:

- Schwärzen Sie Benutzernamen und Raum-IDs, die Sie nicht teilen möchten
- Schwärzen Sie IP-Adressen falls sensibel
- Teilen Sie nur den relevanten Abschnitt, nicht die gesamte Log-Datei
