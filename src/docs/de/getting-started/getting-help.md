## Community-Support

Die Matrix-Community ist freundlich und hilfsbereit. Wenn du Probleme mit deinem
Server hast, gibt es mehrere Anlaufstellen für Hilfe.

### Matrix-Community-Räume

Tritt diesen Matrix-Räumen bei, um Fragen zu stellen und Unterstützung von der
Community zu erhalten:

| Raum | Zweck |
| ---- | ----- |
| [#synapse:matrix.org](https://matrix.to/#/#synapse:matrix.org) | Support für Synapse-Homeserver-Benutzer und -Administratoren |
| [#continuwuity:continuwuity.org](https://matrix.to/#/#continuwuity:continuwuity.org) | Support für Continuwuity-Homeserver |
| [#matrix:matrix.org](https://matrix.to/#/#matrix:matrix.org) | Allgemeine Matrix-Fragen und Diskussionen |
| [#matrix-spec:matrix.org](https://matrix.to/#/#matrix-spec:matrix.org) | Fragen zur Matrix-Spezifikation |
| [#thisweekinmatrix:matrix.org](https://matrix.to/#/#thisweekinmatrix:matrix.org) | Wöchentliche Matrix-Neuigkeiten und Updates |

:::banner{kind="info" title="Tipp"}
Wenn du um Hilfe bittest, gib folgende Informationen an:

- Deine Matrix-Server-Software und Version
- Relevante Fehlermeldungen aus den Logs
- Was du bereits versucht hast
- Ergebnisse des Konnektivitätstests (falls zutreffend)
:::

## Offizielle Dokumentation

### Synapse

- [Synapse-Dokumentation](https://element-hq.github.io/synapse/latest/) — Offizielle Dokumentation für den Synapse-Homeserver
- [Synapse auf GitHub](https://github.com/element-hq/synapse) — Quellcode und Issue-Tracker
- [Synapse-Installationsanleitung](https://element-hq.github.io/synapse/latest/setup/installation.html)

### Continuwuity

- [Continuwuity-Website](https://continuwuity.org/) — Offizielle Continuwuity-Dokumentation
- [Continuwuity-Repository](https://forgejo.ellis.link/continuwuation/continuwuity) — Quellcode und Dokumentation

### Matrix-Spezifikation

- [Matrix-Spezifikation](https://spec.matrix.org/) — Offizielle Protokollspezifikation
- [Matrix.org](https://matrix.org/) — Informationen zum Matrix-Protokoll

## Bevor du um Hilfe bittest

### Konnektivitätstester ausführen

Nutze dieses Tool, um Probleme mit deinem Server zu diagnostizieren. Es prüft:

- Servererreichbarkeit
- Gültigkeit des TLS-Zertifikats
- `.well-known`-Delegation
- Föderationskonnektivität
- DNS-Konfiguration

Die Testergebnisse helfen dir, Probleme zu identifizieren und liefern wertvolle
Informationen, wenn du Hilfe suchst.

### Server-Logs prüfen

Schau dir deine [Server-Logs](/docs/troubleshooting/server-logs) auf Fehlermeldungen an.
Häufige Probleme haben oft klare Fehlermeldungen, die bei der Diagnose helfen.

### Nach ähnlichen Problemen suchen

Bevor du um Hilfe bittest:

1. Suche im Verlauf der Matrix-Räume nach ähnlichen Problemen
2. Prüfe GitHub-Issues für deine Homeserver-Software
3. Schau dir die offizielle Dokumentation zu deinem spezifischen Problem an

## Wie man effektiv Fragen stellt

### Kontext angeben

- **Server-Typ und Version**: „Synapse 1.96.0" oder „Continuwuity latest"
- **Betriebssystem**: „Ubuntu 22.04" oder „Debian 12"
- **Reverse-Proxy**: „Nginx 1.24" oder „Caddy 2.7"
- **Wann das Problem auftrat**: „Nach dem Update auf Version X" oder „Neuinstallation"

### Relevante Logs einschließen

Teile die spezifischen Fehlermeldungen aus deinen Logs, nicht die gesamte Log-Datei.

:::banner{kind="warn" title="Datenschutz"}
Logs können sensible Informationen wie Benutzer-IDs, IP-Adressen oder Domainnamen
enthalten. Überprüfe und schwärze sensible Daten, bevor du sie öffentlich teilst.
:::

### Beschreibe, was du bereits versucht hast

Teile mit, welche Troubleshooting-Schritte du bereits unternommen hast:

- Konfigurationsänderungen, die du vorgenommen hast
- Befehle, die du ausgeführt hast
- Fehlermeldungen, die du erhalten hast
- Dokumentation, die du gelesen hast

### Sei geduldig und respektvoll

- Denke daran, dass Community-Mitglieder ihre Zeit freiwillig geben
- Warte auf Antworten — Menschen befinden sich in verschiedenen Zeitzonen
- Sei respektvoll und dankbar für angebotene Hilfe
- Teile deine Lösung, wenn du das Problem selbst herausgefunden hast

## Professioneller Support

### Synapse kommerzieller Support

Kommerzieller Support wird von verschiedenen Organisationen angeboten. Eine aktuelle
Liste findest du auf der [Hosting-Seite](https://matrix.org/ecosystem/hosting/) der
Matrix.org-Website.

## Bugs melden

Wenn du einen Bug in der Software gefunden hast:

### Synapse-Bugs

- [Synapse GitHub Issues](https://github.com/element-hq/synapse/issues)
- Suche zuerst nach bestehenden Issues
- Gib Reproduktionsschritte und Server-Informationen an

### Continuwuity-Bugs

- [Continuwuity-Repository](https://forgejo.ellis.link/continuwuation/continuwuity/issues)
- Füge Versionsinformationen und Konfigurationsdetails bei

## Zur Dokumentation beitragen

Hast du einen Fehler gefunden oder möchtest die Dokumentation verbessern? Beiträge sind willkommen!
Schau dir die Beitragsrichtlinien im Projekt-Repository an.

## Auf dem Laufenden bleiben

- Tritt [#thisweekinmatrix:matrix.org](https://matrix.to/#/#thisweekinmatrix:matrix.org) bei für wöchentliche Matrix-Neuigkeiten
- Folge dem [Matrix.org-Blog](https://matrix.org/blog/) für Ankündigungen
- Prüfe das Changelog deines Homeservers auf Updates und Sicherheitspatches

## Notfall-Support

### Sicherheitsprobleme

Wenn du eine Sicherheitslücke entdeckst:

- Veröffentliche sie **nicht** öffentlich
- Melde sie den Sicherheitskontakten:
  - Synapse: [security@element.io](mailto:security@element.io)
  - Matrix-Protokoll: [security@matrix.org](mailto:security@matrix.org)
  - Continuwuity: [security@continuwuity.org](mailto:security@continuwuity.org)
    oder kontaktiere Mitglieder direkt per verschlüsselter Nachricht:
    - [@jade:ellis.link](https://matrix.to/#/@jade:ellis.link)
    - [@nex:nexy7574.co.uk](https://matrix.to/#/@nex:nexy7574.co.uk)

### Server-Kompromittierung

Wenn du glaubst, dass dein Server kompromittiert wurde:

1. Trenne den Server sofort vom Internet
2. Bewahre Logs für die forensische Analyse auf
3. Kontaktiere Sicherheitsexperten
4. Frage nicht in öffentlichen Räumen um Hilfe, bis das Problem behoben ist

## Weitere Ressourcen

- [Matrix-Community](https://matrix.to/#/#community:matrix.org) — Zentrale Hub für Matrix-Community-Spaces
