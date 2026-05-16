## Überblick

Der Verbund erfordert, dass Ihr Server vom Internet aus auf dem richtigen Port mit einem gültigen TLS-Zertifikat erreichbar ist. Diese Seite behandelt die Netzwerk- und DNS-Konfiguration speziell für den Verbund. Bei allgemeinen Verbindungsproblemen lesen Sie [Netzwerkprobleme](/docs/troubleshooting/network-issues).

## Erforderliche Ports

| Port | Zweck                               | Empfehlung  |
| ---- | ----------------------------------- | ----------- |
| 443  | Verbund über Well-Known-Delegierung | Empfohlen   |
| 8448 | Direkter Verbund (Legacy)           | Alternative |

Port 443 mit Well-Known-Delegierung wird bevorzugt, da Port 8448 von manchen Firewalls und Internetanbietern blockiert werden kann.

## Firewall-Konfiguration

Erlauben Sie eingehende Verbindungen auf dem von Ihnen verwendeten Port:

### UFW (Ubuntu/Debian)

```bash
# Für Port 443 (Delegierungs-Ansatz)
sudo ufw allow 443/tcp
sudo ufw reload
```

### firewalld (Fedora/RHEL)

```bash
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

## DNS-Konfiguration

### A/AAAA-Einträge

Ihr Verbund-Server benötigt einen DNS-Eintrag, der auf seine IP-Adresse zeigt:

```dns
matrix.beispiel.de. 3600 IN A 203.0.113.10
```

### SRV-Einträge

SRV-Einträge sind eine Alternative zur Well-Known-Delegierung. Sie teilen anderen Servern mit, wo Ihr Verbund-Endpunkt zu finden ist. Verwenden Sie sie nur, wenn Sie nicht bereits Well-Known-Delegierung nutzen.

:::banner{kind="warn" title="SRV-Einträge betreffen nur den Verbund"}
SRV-Einträge helfen Clients nicht dabei, Ihren Server zu finden. Für die Client-Erkennung ist `/.well-known/matrix/client` erforderlich. Unter [Well-Known-Delegierung](/docs/api-endpoints/well-known-delegation) finden Sie eine Einrichtung, die beide abdeckt.
:::

Das korrekte SRV-Eintragsformat (seit Matrix-Spezifikation v1.8):

```dns
_matrix-fed._tcp.beispiel.de. 3600 IN SRV 10 0 8448 matrix.beispiel.de.
```

:::banner{kind="info" title="Veralteter SRV-Eintragsname"}
Der alte `_matrix._tcp`-Eintragsname ist seit Spezifikation v1.8 veraltet und wurde durch `_matrix-fed._tcp` ersetzt. Die meisten Server erkennen den alten Namen noch für Rückwärtskompatibilität, aber neue Einrichtungen sollten den aktuellen Namen verwenden.
:::

### DNS überprüfen

```bash
# A-Record prüfen
dig +short matrix.beispiel.de

# SRV-Eintrag prüfen
dig +short _matrix-fed._tcp.beispiel.de SRV

# Von einem externen DNS-Server prüfen
dig @8.8.8.8 matrix.beispiel.de
```

## Verbundverbindung testen

```bash
# Verbund-Endpunkt direkt testen
curl https://matrix.beispiel.de/_matrix/federation/v1/version

# Well-Known-Verbunddatei prüfen
curl https://beispiel.de/.well-known/matrix/server

# TLS-Handshake testen
openssl s_client -connect matrix.beispiel.de:443 -servername matrix.beispiel.de
```

Oder führen Sie den [Verbindungstest](/) aus, der all das automatisch prüft und meldet, welche spezifische Prüfung fehlschlägt.

## Häufige Verbund-Netzwerkprobleme

### Andere Server können sich nicht verbinden (Timeout)

1. Prüfen Sie, ob Ihre Firewall eingehenden Datenverkehr auf Port 443 oder 8448 erlaubt
2. Prüfen Sie bei Ihrem Hosting-Anbieter auch deren Netzwerksicherheitsgruppen
3. Bestätigen Sie, dass der Server lauscht: `sudo ss -tlnp | grep 443`
4. Testen Sie von einem externen Netzwerk mit `telnet matrix.beispiel.de 443`

### Well-Known gibt falsche Adresse zurück

```bash
curl https://beispiel.de/.well-known/matrix/server
```

Sollte `{"m.server": "matrix.beispiel.de:443"}` zurückgeben (oder Ihre tatsächliche Server-Adresse). Falls falscher Inhalt oder 404 zurückgegeben wird, lesen Sie [Well-Known-Delegierung](/docs/api-endpoints/well-known-delegation).

### TLS-Fehler beim Verbund

Andere Server lehnen Ihr TLS-Zertifikat ab, wenn es selbst signiert, abgelaufen ist oder die falsche Domain abdeckt. Den vollständigen Prüfliste finden Sie unter [TLS-Zertifikate](/docs/configuration/tls-certificates).

### Asymmetrischer Verbund (Sie erreichen andere, aber nicht umgekehrt)

Ihre ausgehenden Verbindungen funktionieren, aber eingehende werden blockiert. Prüfen Sie:

- Firewall INPUT-Kette (nicht nur OUTPUT)
- Ob Ihre öffentliche IP mit Ihren DNS-Einträgen übereinstimmt
- Ob Port-Weiterleitung eingerichtet ist, wenn Sie sich hinter einem NAT befinden
