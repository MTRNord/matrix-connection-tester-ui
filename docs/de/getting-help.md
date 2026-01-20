---
title: Hilfe erhalten
description: Wo du Hilfe und Unterstützung für die Matrix-Server-Administration findest
---

## Community-Support

Die Matrix-Community ist freundlich und hilfsbereit. Wenn du Probleme mit deinem Server hast, gibt es mehrere Anlaufstellen für Hilfe.

### Matrix-Community-Räume

Tritt diesen Matrix-Räumen bei, um Fragen zu stellen und Unterstützung von der Community zu erhalten:

| Raum                                                                                 | Zweck                                                        |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| [#synapse:matrix.org](https://matrix.to/#/#synapse:matrix.org)                       | Support für Synapse-Homeserver-Benutzer und -Administratoren |
| [#continuwuity:continuwuity.org](https://matrix.to/#/#continuwuity:continuwuity.org) | Support für Continuwuity-Homeserver                          |
| [#matrix:matrix.org](https://matrix.to/#/#matrix:matrix.org)                         | Allgemeine Matrix-Fragen und Diskussionen                    |
| [#matrix-spec:matrix.org](https://matrix.to/#/#matrix-spec:matrix.org)               | Fragen zur Matrix-Spezifikation                              |
| [#thisweekinmatrix:matrix.org](https://matrix.to/#/#thisweekinmatrix:matrix.org)     | Wöchentliche Matrix-Neuigkeiten und Updates                  |

:::inset
**Tipp:** Wenn du um Hilfe bittest, gib folgende Informationen an:

- Deine Matrix-Server-Software und Version
- Relevante Fehlermeldungen aus den Logs
- Was du bereits versucht hast
- Ergebnisse des Konnektivitätstests (falls zutreffend)
:::

## Offizielle Dokumentation

### Synapse

- [Synapse-Dokumentation](https://element-hq.github.io/synapse/latest/) - Offizielle Dokumentation für den Synapse-Homeserver
- [Synapse auf GitHub](https://github.com/element-hq/synapse) - Quellcode und Issue-Tracker
- [Synapse-Installationsanleitung](https://element-hq.github.io/synapse/latest/setup/installation.html)

### Continuwuity

- [Continuwuity-Website](https://continuwuity.org/) - Offizielle Continuwuity-Dokumentation
- [Continuwuity-Repository](https://forgejo.ellis.link/continuwuation/continuwuity) - Quellcode und Dokumentation

### Matrix-Spezifikation

- [Matrix-Spezifikation](https://spec.matrix.org/) - Offizielle Protokollspezifikation
- [Matrix.org](https://matrix.org/) - Informationen über das Matrix-Protokoll

## Bevor du um Hilfe bittest

### Führe den Konnektivitätstest durch

Verwende dieses Verbindungstest-Tool, um Probleme mit deinem Server zu diagnostizieren. Es überprüft:

- Server-Erreichbarkeit
- TLS-Zertifikatsgültigkeit
- `.well-known`-Delegation
- Federation-Konnektivität
- DNS-Konfiguration

Die Testergebnisse können dir helfen, Probleme zu identifizieren und liefern wertvolle Informationen, wenn du Hilfe suchst.

### Überprüfe die Server-Logs

Überprüfe deine [Server-Logs](/docs/server-logs) auf Fehlermeldungen. Häufige Probleme haben oft eindeutige Fehlermeldungen, die bei der Diagnose helfen können.

### Suche nach ähnlichen Problemen

Bevor du um Hilfe bittest:

1. Durchsuche den Verlauf des Matrix-Raums nach ähnlichen Problemen
2. Überprüfe GitHub-Issues für deine Homeserver-Software
3. Lies die offizielle Dokumentation zu deinem spezifischen Problem

## Wie man effektiv Fragen stellt

### Kontext bereitstellen

- **Servertyp und Version**: "Synapse 1.96.0" oder "Continuwuity latest"
- **Betriebssystem**: "Ubuntu 22.04" oder "Debian 12"
- **Reverse Proxy**: "Nginx 1.24" oder "Caddy 2.7"
- **Wann das Problem begann**: "Nach dem Update auf Version X" oder "Neuinstallation"

### Relevante Logs beifügen

Teile die spezifischen Fehlermeldungen aus deinen Logs, nicht die gesamte Log-Datei.

:::warning
Logs können sensible Informationen wie Benutzer-IDs, IP-Adressen oder Domainnamen enthalten. Überprüfe und schwärze sensible Daten, bevor du sie öffentlich teilst.
:::

### Beschreibe, was du bereits versucht hast

Lass andere wissen, welche Fehlerbehebungsschritte du bereits unternommen hast:

- Konfigurationsänderungen, die du vorgenommen hast
- Befehle, die du ausgeführt hast
- Fehlermeldungen, die du erhalten hast
- Dokumentation, die du konsultiert hast

### Sei geduldig und respektvoll

- Denke daran, dass Community-Mitglieder ihre Zeit freiwillig zur Verfügung stellen
- Warte auf Antworten - Menschen befinden sich in verschiedenen Zeitzonen
- Sei respektvoll und dankbar für angebotene Hilfe
- Teile deine Lösung mit, wenn du das Problem selbst löst

## Professioneller Support

### Synapse kommerzieller Support

Kommerzieller Support wird von verschiedenen Organisationen angeboten.
Für eine aktuelle Liste schau auf der [Hosting-Seite](https://matrix.org/ecosystem/hosting/) auf der Matrix.org-Website nach.

## Fehler melden

Wenn du einen Fehler in der Software gefunden hast:

### Synapse-Fehler

- [Synapse GitHub Issues](https://github.com/element-hq/synapse/issues)
- Suche zuerst nach bestehenden Issues
- Gib Reproduktionsschritte und Serverinformationen an

### Continuwuity-Fehler

- [Continuwuity-Repository](https://forgejo.ellis.link/continuwuation/continuwuity/issues)
- Füge Versionsinformationen und Konfigurationsdetails bei

## Zur Dokumentation beitragen

Hast du einen Fehler in dieser Dokumentation gefunden oder möchtest du sie verbessern? Beiträge sind willkommen! Schau im Projekt-Repository nach den Beitragsrichtlinien.

## Auf dem Laufenden bleiben

- Tritt [#thisweekinmatrix:matrix.org](https://matrix.to/#/#thisweekinmatrix:matrix.org) bei für wöchentliche Updates zum Matrix-Ökosystem
- Folge dem [Matrix.org-Blog](https://matrix.org/blog/) für Ankündigungen
- Überprüfe das Changelog deines Homeservers auf Updates und Sicherheitspatches

## Notfall-Support

### Sicherheitsprobleme

Wenn du eine Sicherheitslücke entdeckst:

- Veröffentliche sie **nicht** öffentlich
- Melde sie an die Sicherheitskontakte:
  - Synapse: [security@element.io](mailto:security@element.io)
  - Matrix-Protokoll: [security@matrix.org](mailto:security@matrix.org)
  - Continuwuity: [security@continuwuity.org](mailto:security@continuwuity.org) oder kontaktiere Mitglieder direkt per E2EE-Privatnachricht:
    - [@jade:ellis.link](https://matrix.to/#/@jade:ellis.link)
    - [@nex:nexy7574.co.uk](https://matrix.to/#/@nex:nexy7574.co.uk)

### Server-Kompromittierung

Wenn du glaubst, dass dein Server kompromittiert wurde:

1. Trenne den Server sofort vom Internet
2. Bewahre Logs für forensische Analysen auf
3. Kontaktiere Sicherheitsexperten
4. Bitte nicht in öffentlichen Räumen um Hilfe, bis das Problem behoben ist

## Zusätzliche Ressourcen

- [Matrix Community](https://matrix.to/#/#community:matrix.org) - Zentrale Anlaufstelle für Matrix-Community-Spaces
