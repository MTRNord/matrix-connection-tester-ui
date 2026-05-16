## Überblick

Netzwerkprobleme gehören zu den häufigsten Ursachen für fehlgeschlagene Verbindungstests. Diese Anleitung hilft Ihnen, sie Schritt für Schritt zu diagnostizieren — von der Überprüfung, ob der Server läuft, bis hin zur Bestätigung, dass er vom Internet aus erreichbar ist.

:::banner{kind="info" title="Von außen testen"}
Testen Sie immer von einem externen Netzwerk aus oder nutzen Sie den Verbindungstest hier. Tests aus demselben Netzwerk wie Ihr Server können irreführende Ergebnisse liefern, da lokaler Datenverkehr Ihre Firewall und das öffentliche DNS umgeht.
:::

## Schritt 1: Server-Status prüfen

### Synapse

```bash
sudo systemctl status matrix-synapse
sudo journalctl -u matrix-synapse -n 50
```

### Continuwuity

```bash
sudo systemctl status continuwuity
sudo journalctl -u continuwuity -n 50
```

Wenn der Dienst nicht läuft, starten Sie ihn und prüfen Sie die Logs auf den Grund für den Stopp.

## Schritt 2: Prüfen ob der Server auf dem richtigen Port lauscht

```bash
# Was lauscht gerade?
sudo ss -tlnp | grep -E '(443|8448|8008)'
```

Sie sollten Ihren Homeserver oder Reverse-Proxy auf Port 8008 (intern) sehen, und Nginx/Caddy auf Port 443 oder 8448.

**Wenn Port 8008 `127.0.0.1` zeigt:** Das ist korrekt — der Homeserver sollte nur auf localhost lauschen, wenn ein Reverse-Proxy davor steht.

**Wenn nichts auf 443 lauscht:** Ihr Reverse-Proxy läuft nicht oder ist falsch konfiguriert.

## Schritt 3: Firewall prüfen

Ihre Firewall muss eingehende Verbindungen auf Port 443 (empfohlen) oder 8448 erlauben.

### UFW (Ubuntu/Debian)

```bash
sudo ufw status
sudo ufw allow 443/tcp
sudo ufw reload
```

### firewalld (Fedora/RHEL)

```bash
sudo firewall-cmd --list-all
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

### iptables

```bash
# Aktuelle Regeln prüfen
sudo iptables -L -n -v | grep -E '(443|8448)'

# Regel hinzufügen falls fehlend
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

## Schritt 4: Externe Erreichbarkeit testen

Von einem Gerät in einem anderen Netzwerk (oder den Verbindungstest verwenden):

```bash
# TCP-Verbindung testen
telnet matrix.beispiel.de 443

# Verbund-Endpunkt testen
curl https://matrix.beispiel.de/_matrix/federation/v1/version

# Client-Server-Endpunkt testen
curl https://matrix.beispiel.de/_matrix/client/versions
```

## Schritt 5: DNS überprüfen

```bash
# A-Record prüfen
dig +short beispiel.de

# Von einem externen DNS-Server prüfen
dig @8.8.8.8 beispiel.de

# SRV-Eintrag prüfen (falls verwendet)
dig +short _matrix-fed._tcp.beispiel.de SRV
```

Wenn Sie DNS-Einträge kürzlich geändert haben, warten Sie 24–48 Stunden für die Propagierung.

## Häufige Netzwerkprobleme

### Verbindung abgelehnt

Der Port ist nicht offen oder der Dienst lauscht nicht. Arbeiten Sie die Schritte 1–3 oben durch.

### Verbindungs-Timeout

Eine Firewall blockiert den Port. Prüfen Sie die Server-seitige Firewall (Schritt 3) und alle externen Firewalls oder Sicherheitsgruppen Ihres Hosting-Anbieters.

### DNS wird nicht aufgelöst

Prüfen Sie, ob der A-Record existiert und auf die öffentliche IP Ihres Servers zeigt. Verwenden Sie `dig @8.8.8.8`, um außerhalb Ihres lokalen DNS-Caches abzufragen.

### IPv6-Probleme

Wenn manche Nutzer sich verbinden können und andere nicht, prüfen Sie ob Ihr Server sowohl IPv4 als auch IPv6 korrekt konfiguriert hat:

```bash
# Beide testen
curl -4 https://matrix.beispiel.de/_matrix/federation/v1/version
curl -6 https://matrix.beispiel.de/_matrix/federation/v1/version
```

Wenn IPv6 nicht funktioniert, entweder reparieren oder den AAAA-Eintrag entfernen, damit der gesamte Datenverkehr IPv4 verwendet.

## Reverse-Proxy-Logs prüfen

Wenn der Server läuft und Ports offen sind, Anfragen aber immer noch fehlschlagen:

```bash
# Nginx
sudo tail -f /var/log/nginx/error.log

# Caddy
sudo journalctl -u caddy -f
```

Weitere Informationen zum Lesen von Server- und Proxy-Logs finden Sie unter [Server-Logs](/docs/troubleshooting/server-logs).
