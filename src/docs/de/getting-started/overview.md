## Was prüft der Verbindungstest?

Wenn Sie einen Matrix-Homeserver betreiben, müssen zwei Dinge funktionieren:

- **Verbund (Federation)** — andere Matrix-Server müssen Ihren Server erreichen können, um Nachrichten von ihren Nutzern in Ihre Räume zu übermitteln und umgekehrt.
- **Client-Verbindungen** — Matrix-Apps (Element, FluffyChat, Cinny, …) müssen Ihren Server finden und sich verbinden können, damit Ihre Nutzer sich einloggen können.

Dieses Tool prüft beides von außerhalb Ihres Netzwerks und teilt Ihnen genau mit, welche Schicht fehlerhaft ist und warum.

## Die drei häufigsten Fehlerursachen

Fast jeder Verbindungsfehler hat eine von drei Ursachen:

1. **DNS oder Discovery ist nicht eingerichtet.** Andere Server können Ihren Server nicht finden, weil die `.well-known`-Delegierungsdatei fehlt oder auf die falsche Adresse zeigt.
2. **Reverse-Proxy oder Server ist falsch konfiguriert.** Nginx oder Caddy läuft, aber `/_matrix/…`-Anfragen werden nicht korrekt weitergeleitet, oder der Homeserver selbst ist falsch konfiguriert. Dies ist mit Abstand die häufigste Fehlerursache.
3. **TLS-Zertifikat ist nicht vertrauenswürdig.** Das Zertifikat wurde von einer Zertifizierungsstelle ausgestellt, der das breitere Internet nicht vertraut (zum Beispiel ein selbst signiertes Zertifikat), oder es ist abgelaufen.

## So funktioniert der Test

Wenn Sie Ihre Domain auf der [Startseite](/) eingeben und **Tests starten** drücken, führt das Tool folgende Prüfungen der Reihe nach durch:

:::card

### 1. DNS und Well-Known-Discovery

Sucht nach `/.well-known/matrix/server` (für den Verbund) und `/.well-known/matrix/client` (für Clients) auf Ihrer Domain. Dies teilt dem Tool mit, wo Ihr eigentlicher Homeserver läuft.

### 2. TLS-Zertifikat

Verbindet sich mit der Adresse aus den Well-Known-Dateien und prüft, ob das Zertifikat gültig, von einer bekannten Zertifizierungsstelle ausgestellt und nicht abgelaufen ist.

### 3. Verbund-Endpunkt (Federation)

Ruft `/_matrix/federation/v1/version` auf, um zu bestätigen, dass Ihr Homeserver auf Server-zu-Server-Datenverkehr antwortet.

### 4. Client-Server-Endpunkt

Ruft `/_matrix/client/versions` auf, um zu bestätigen, dass Matrix-Clients sich verbinden können, und zeigt, welche API-Versionen Ihr Server unterstützt.

:::

## Ergebnisse verstehen

Das Tool zeigt ein Gesamtergebnis sowie Details zu den einzelnen Prüfungen:

| Zustand        | Bedeutung                                                                                                                                                                                                               |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OK             | Alle Prüfungen sind ohne Probleme bestanden.                                                                                                                                                                            |
| Warnung        | Der Verbund antwortet, aber etwas stimmt nicht — zum Beispiel liefert die Well-Known-Datei von verschiedenen IP-Adressen unterschiedliche Ergebnisse (Split-Brain), oder einige Verbindungen mussten wiederholt werden. |
| Fehlgeschlagen | Verbundprüfungen sind fehlgeschlagen. Der Abschnitt **Probleme** unterhalb des Ergebnisses erklärt, was schiefgelaufen ist.                                                                                             |
| N/A            | Eine bestimmte Prüfung konnte nicht abgeschlossen werden — zum Beispiel ist die Client-Server-API nicht erreichbar.                                                                                                     |

Wenn Sie einen Fehler sehen, folgen Sie dem Link in der Fehlermeldung zur entsprechenden Anleitung. Wenn Sie zum ersten Mal einrichten, ist die [Verbund-Einrichtung](/docs/getting-started/federation-setup) der beste Ausgangspunkt.

## Hilfe benötigt?

- Führen Sie den [Verbindungstest](/) gegen Ihren Server aus und teilen Sie die Ergebnisse
- Prüfen Sie die Logs Ihres Homeservers auf relevante Fehler — siehe [Server-Logs](/docs/troubleshooting/server-logs)
- Lesen Sie die [Fehlerbehebungsanleitung](/docs/troubleshooting/general) für häufige Probleme
- Fragen Sie in [#homeservers:matrix.org](https://matrix.to/#/#homeservers:matrix.org)
- Posten Sie im [Forum](https://forum.mtrnord.blog/c/matrix-connectivity-tester/support/6)
