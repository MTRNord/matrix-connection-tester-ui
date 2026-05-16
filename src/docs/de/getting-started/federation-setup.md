## Was ist Matrix-Verbund (Federation)?

Der Verbund macht Matrix zu einem dezentralen Netzwerk. Wenn Ihr Server am Verbund teilnimmt, können Nutzer auf Ihrem Server mit Nutzern auf beliebigen anderen Matrix-Servern chatten — ähnlich wie E-Mail es ermöglicht, von Gmail an Outlook zu schreiben. Ohne Verbund können Ihre Nutzer nur untereinander kommunizieren.

:::banner{kind="warn" title="Dieser Tester erfordert einen öffentlich erreichbaren Server"}
Dieser Verbindungstest führt Prüfungen vom öffentlichen Internet aus durch. Wenn Ihr Server sich in einem privaten Netzwerk befindet oder hinter einer Firewall ohne öffentlichen Zugang, werden die Tests fehlschlagen — auch wenn Ihr Server innerhalb Ihres Netzwerks korrekt funktioniert. Ein VPS mit öffentlicher IP-Adresse ist die unkomplizierteste Lösung für einen öffentlich federierenden Server.
:::

## Was Sie vor dem Start benötigen

| Anforderung                        | Warum sie benötigt wird                                                                                  |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Eine Domain, die Sie kontrollieren | Ihre Nutzer erhalten IDs wie `@nutzer:beispiel.de` — dies kann nach dem Start nicht mehr geändert werden |
| Ein gültiges TLS-Zertifikat        | Andere Server lehnen Verbindungen von Servern ohne vertrauenswürdiges Zertifikat ab                      |
| Eine öffentliche IP-Adresse        | Andere Server müssen sich mit Ihnen verbinden können                                                     |
| Port 443 erreichbar                | Das empfohlene Setup betreibt den Verbund über den Standard-HTTPS-Port                                   |

:::banner{kind="warn" title="Ihr Servername ist dauerhaft"}
Die Domain, die Sie als Servernamen wählen, wird dauerhaft Teil jeder Nutzer-ID und Raum-ID. Sobald Nutzer beigetreten sind, ist eine Änderung ohne die Erstellung eines neuen Servers nicht möglich. Wählen Sie sorgfältig, bevor Sie in Produktion gehen.
:::

## Wie andere Server Sie finden

Wenn ein anderer Matrix-Server Ihnen eine Nachricht senden möchte, muss er Ihren Verbund-Endpunkt finden. Dazu geht er folgendermaßen vor:

1. Ruft `https://beispiel.de/.well-known/matrix/server` ab — wenn vorhanden und gültig, wird die Adresse in dieser Datei verwendet
2. Sucht nach einem DNS-SRV-Eintrag `_matrix-fed._tcp.beispiel.de` — wenn gefunden, wird dieser verwendet
3. Fällt auf direkte Verbindung zu `beispiel.de:8448` zurück

**Die Well-Known-Methode (Schritt 1) ist der empfohlene Ansatz**, da sie auf jedem Port funktioniert, einfach zu konfigurieren ist und keine DNS-Änderungen über grundlegende A/AAAA-Einträge hinaus erfordert.

## Einrichtungsschritte

### Schritt 1: Servernamen wählen

Ihr **Servername** ist die Domain, die in den Matrix-IDs Ihrer Nutzer erscheint — zum Beispiel `@alice:beispiel.de`. Dieser wird in der Homeserver-Konfiguration festgelegt und ist unabhängig davon, wo Ihr Server tatsächlich läuft.

Das häufigste Setup ist:

- **Servername:** `beispiel.de` → Nutzer erhalten `@alice:beispiel.de`
- **Homeserver-Adresse:** `matrix.beispiel.de` → wo die eigentliche Software läuft

Diese beiden werden durch die [Well-Known-Delegierung](/docs/api-endpoints/well-known-delegation) verknüpft. Die Well-Known-Datei unter `https://beispiel.de/.well-known/matrix/server` teilt anderen Servern mit, sich stattdessen mit `matrix.beispiel.de` zu verbinden. Dadurch können Nutzer kurze, saubere IDs (`@alice:beispiel.de`) haben, obwohl der Server auf einer Subdomain läuft.

Alternativ können Sie den Servernamen direkt auf `matrix.beispiel.de` setzen — das vereinfacht die Konfiguration (keine Delegierung notwendig), aber Nutzer erhalten längere IDs wie `@alice:matrix.beispiel.de`.

### Schritt 2: TLS-Zertifikat erhalten

Verwenden Sie [Let's Encrypt](https://letsencrypt.org/) mit Certbot für ein kostenloses, automatisch erneuerndes Zertifikat:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d matrix.beispiel.de
```

Oder verwenden Sie Caddy, das Zertifikate automatisch ohne zusätzliche Schritte verwaltet.

Weitere Details finden Sie unter [TLS-Zertifikate](/docs/configuration/tls-certificates).

### Schritt 3: Well-Known-Delegierung einrichten (empfohlen)

Erstellen Sie eine Datei unter `https://beispiel.de/.well-known/matrix/server`:

```json
{
  "m.server": "matrix.beispiel.de:443"
}
```

Dies teilt anderen Servern mit, sich für den Verbund mit `matrix.beispiel.de` auf Port 443 zu verbinden.

**Nginx-Beispiel** (für Ihre Basisdomain `beispiel.de`):

```nginx
location /.well-known/matrix/server {
    default_type application/json;
    add_header Access-Control-Allow-Origin *;
    return 200 '{"m.server": "matrix.beispiel.de:443"}';
}
```

**Caddy-Beispiel**:

```caddy
beispiel.de {
    header /.well-known/matrix/server Content-Type application/json
    header /.well-known/matrix/server Access-Control-Allow-Origin *
    respond /.well-known/matrix/server `{"m.server": "matrix.beispiel.de:443"}` 200
}
```

Die vollständige Anleitung einschließlich Client-Discovery finden Sie unter [Well-Known-Delegierung](/docs/api-endpoints/well-known-delegation).

### Schritt 4: Homeserver konfigurieren

Legen Sie Ihren Servernamen in der Homeserver-Konfiguration fest.

**Synapse (`homeserver.yaml`)**:

```yaml
server_name: 'beispiel.de'
```

**Continuwuity (`config.toml`)**:

```toml
[global]
server_name = "beispiel.de"
```

### Schritt 5: Konfiguration testen

Verwenden Sie den [Verbindungstest](/), um zu prüfen, ob alles funktioniert. Geben Sie Ihre Domain ein und führen Sie die Tests durch:

- Well-Known-Discovery
- Gültigkeit des TLS-Zertifikats
- Erreichbarkeit des Verbund-Endpunkts
- Erreichbarkeit des Client-Server-Endpunkts

## Alternative: SRV-Eintrag

:::banner{kind="warn" title="SRV-Einträge betreffen nur den Verbund"}
Ein SRV-Eintrag teilt anderen Matrix-**Servern** mit, wo sie Sie erreichen können. Er hilft Matrix-**Clients** jedoch **nicht**, Ihren Server zu finden — Clients nutzen für die Entdeckung ausschließlich `.well-known/matrix/client`. Bei reiner SRV-Delegierung können Clients Ihren Server nicht automatisch finden; Nutzer müssen die Homeserver-Adresse manuell eingeben.

Die Well-Known-Delegierung hingegen deckt sowohl Verbund als auch Client-Discovery ab.
:::

Falls Sie keine Well-Known-Datei auf Ihrer Domain bereitstellen können (zum Beispiel weil Sie keinen Webserver auf Port 443 für die Basisdomain kontrollieren), können Sie stattdessen einen DNS-SRV-Eintrag verwenden.

:::banner{kind="info" title="Aktuelles SRV-Eintragsformat"}
Der aktuelle SRV-Eintragsname lautet `_matrix-fed._tcp` (seit Matrix-Spec v1.8 bei der IANA registriert). Das ältere Format `_matrix._tcp` funktioniert noch als Fallback, ist aber veraltet und könnte in einer zukünftigen Spec-Version entfernt werden.
:::

Fügen Sie diesen DNS-Eintrag hinzu:

```
_matrix-fed._tcp.beispiel.de.  3600  IN  SRV  10  0  8448  matrix.beispiel.de.
```

Dies teilt anderen Servern mit, sich mit `matrix.beispiel.de` auf Port 8448 zu verbinden. Sie müssen außerdem Port 8448 in Ihrer Firewall öffnen.

## Alternative: Direkter Port 8448

Falls weder Well-Known noch SRV-Einträge möglich sind, versuchen Server, sich direkt mit `beispiel.de:8448` zu verbinden. Dies ist der unflexibelste Ansatz — Port 8448 wird manchmal von Firewalls blockiert — und sollte nur als letztes Mittel verwendet werden.

## Fehlerbehebung

Falls der Verbund nach der Einrichtung nicht funktioniert:

1. Führen Sie den [Verbindungstest](/) aus — er zeigt Ihnen, welche Prüfung genau fehlschlägt
2. Bestätigen Sie, dass Ihre Well-Known-Datei erreichbar ist: `curl https://beispiel.de/.well-known/matrix/server`
3. Prüfen Sie, ob Ihr TLS-Zertifikat für die Domain in der Well-Known-Datei gültig ist
4. Bestätigen Sie, dass Port 443 (oder 8448 bei SRV) vom Internet aus erreichbar ist
5. Prüfen Sie die [Server-Logs](/docs/troubleshooting/server-logs) auf Verbundfehler
