---
title: Hilfe erhalten
description: Wo Sie Hilfe und Unterstützung für die Matrix-Serveradministration finden
---

## Community-Unterstützung

Die Matrix-Community ist freundlich und hilfsbereit. Wenn Sie Probleme mit Ihrem Server haben, gibt es mehrere Anlaufstellen für Hilfe.

### Matrix-Community-Räume

Treten Sie diesen Matrix-Räumen bei, um Fragen zu stellen und Unterstützung von der Community zu erhalten:

| Raum                                                                                 | Zweck                                                     |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| [#synapse:matrix.org](https://matrix.to/#/#synapse:matrix.org)                       | Unterstützung für Synapse-Homeserver-Benutzer und -Admins |
| [#continuwuity:continuwuity.org](https://matrix.to/#/#continuwuity:continuwuity.org) | Unterstützung für Continuwuity-Homeserver                 |
| [#matrix:matrix.org](https://matrix.to/#/#matrix:matrix.org)                         | Allgemeine Matrix-Fragen und Diskussionen                 |
| [#matrix-spec:matrix.org](https://matrix.to/#/#matrix-spec:matrix.org)               | Fragen zur Matrix-Spezifikation                           |
| [#thisweekinmatrix:matrix.org](https://matrix.to/#/#thisweekinmatrix:matrix.org)     | Wöchentliche Matrix-Neuigkeiten und Updates               |

:::inset
**Tipp:** Wenn Sie um Hilfe bitten, geben Sie an:

- Ihre Matrix-Server-Software und -Version
- Relevante Fehlermeldungen aus den Logs
- Was Sie bereits versucht haben
- Ergebnisse des Konnektivitätstests (falls zutreffend)
  :::

## Offizielle Dokumentation

### Synapse

- [Synapse-Dokumentation](https://element-hq.github.io/synapse/latest/) - Offizielle Dokumentation für Synapse-Homeserver
- [Synapse auf GitHub](https://github.com/element-hq/synapse) - Quellcode und Issue-Tracker
- [Synapse-Installationsanleitung](https://element-hq.github.io/synapse/latest/setup/installation.html)

### Continuwuity

- [Continuwuity-Website](https://continuwuity.org/) - Offizielle Continuwuity-Dokumentation
- [Continuwuity-Repository](https://forgejo.ellis.link/continuwuation/continuwuity) - Quellcode und Dokumentation

### Matrix-Spezifikation

- [Matrix-Spezifikation](https://spec.matrix.org/) - Offizielle Protokollspezifikation
- [Matrix.org](https://matrix.org/) - Informationen über das Matrix-Protokoll

## Bevor Sie um Hilfe bitten

### Führen Sie den Konnektivitätstest durch

Verwenden Sie dieses Verbindungstester-Tool, um Probleme mit Ihrem Server zu diagnostizieren. Es überprüft:

- Servererreichbarkeit
- Gültigkeit des TLS-Zertifikats
- `.well-known`-Delegierung
- Föderationskonnektivität
- DNS-Konfiguration

Die Testergebnisse können Ihnen helfen, Probleme zu identifizieren und wertvolle Informationen zu liefern, wenn Sie Hilfe suchen.

### Überprüfen Sie die Server-Logs

Überprüfen Sie Ihre [Server-Logs](/docs/server-logs) auf Fehlermeldungen. Häufige Probleme haben oft klare Fehlermeldungen, die bei der Diagnose helfen können.

### Suchen Sie nach ähnlichen Problemen

Bevor Sie um Hilfe bitten:

1. Durchsuchen Sie den Matrix-Raumverlauf nach ähnlichen Problemen
2. Überprüfen Sie GitHub-Issues für Ihre Homeserver-Software
3. Konsultieren Sie die offizielle Dokumentation für Ihr spezifisches Problem

## Wie Sie effektive Fragen stellen

### Kontext bereitstellen

- **Servertyp und -version**: "Synapse 1.96.0" oder "Continuwuity latest"
- **Betriebssystem**: "Ubuntu 22.04" oder "Debian 12"
- **Reverse-Proxy**: "Nginx 1.24" oder "Caddy 2.7"
- **Wann das Problem begann**: "Nach dem Update auf Version X" oder "Frische Installation"

### Relevante Logs einbeziehen

Teilen Sie die spezifischen Fehlermeldungen aus Ihren Logs, nicht die gesamte Log-Datei:

```bash
# Aktuelle Fehler von Synapse abrufen
sudo journalctl -u matrix-synapse -n 100 | grep -i error

# Föderationsbezogene Fehler abrufen
sudo journalctl -u matrix-synapse | grep -i federation
```

:::warning
Logs können sensible Informationen wie Benutzer-IDs, IP-Adressen oder Domainnamen enthalten. Überprüfen und schwärzen Sie sensible Daten, bevor Sie sie öffentlich teilen.
:::

### Beschreiben Sie, was Sie versucht haben

Lassen Sie andere wissen, welche Fehlerbehebungsschritte Sie bereits unternommen haben:

- Konfigurationsänderungen, die Sie vorgenommen haben
- Befehle, die Sie ausgeführt haben
- Fehlermeldungen, die Sie erhalten haben
- Dokumentation, die Sie konsultiert haben

### Seien Sie geduldig und respektvoll

- Denken Sie daran, dass Community-Mitglieder ihre Zeit freiwillig zur Verfügung stellen
- Warten Sie auf Antworten - Menschen befinden sich in verschiedenen Zeitzonen
- Seien Sie respektvoll und dankbar für angebotene Hilfe
- Teilen Sie Ihre Lösung, wenn Sie sie selbst herausfinden

## Professionelle Unterstützung

### Synapse kommerzielle Unterstützung

- [Element Enterprise](https://element.io/enterprise) - Professionelle Unterstützung für Synapse vom Kernentwicklungsteam

### Beratungsdienste

Viele Mitglieder der Matrix-Community bieten kostenpflichtige Beratungsdienste für:

- Server-Setup und -Konfiguration
- Leistungsoptimierung
- Benutzerdefinierte Integrationen
- Migrationshilfe

Fragen Sie in [#synapse:matrix.org](https://matrix.to/#/#synapse:matrix.org) oder [#matrix:matrix.org](https://matrix.to/#/#matrix:matrix.org), wenn Sie professionelle Hilfe suchen.

## Fehler melden

Wenn Sie einen Fehler in der Software gefunden haben:

### Synapse-Fehler

- [Synapse GitHub Issues](https://github.com/element-hq/synapse/issues)
- Durchsuchen Sie zuerst vorhandene Issues
- Geben Sie Reproduktionsschritte und Serverinformationen an

### Continuwuity-Fehler

- [Continuwuity-Repository](https://forgejo.ellis.link/continuwuation/continuwuity/issues)
- Geben Sie Versionsinformationen und Konfigurationsdetails an

### Verbindungstester-Fehler

Wenn Sie Probleme mit diesem Verbindungstester-Tool finden, melden Sie diese bitte über den entsprechenden Kanal (siehe Homepage des Tools für Fehlermeldungen).

## Zur Dokumentation beitragen

Haben Sie einen Fehler in dieser Dokumentation gefunden oder möchten Sie sie verbessern? Beiträge sind willkommen! Prüfen Sie das Projekt-Repository für Beitragsrichtlinien.

## Auf dem Laufenden bleiben

- Treten Sie [#thisweekinmatrix:matrix.org](https://matrix.to/#/#thisweekinmatrix:matrix.org) für wöchentliche Updates zum Matrix-Ökosystem bei
- Folgen Sie dem [Matrix.org Blog](https://matrix.org/blog/) für Ankündigungen
- Überprüfen Sie das Changelog Ihres Homeservers auf Updates und Sicherheitspatches

## Notfall-Unterstützung

### Sicherheitsprobleme

Wenn Sie eine Sicherheitslücke entdecken:

- Posten Sie **nicht** öffentlich
- Melden Sie an Sicherheitskontakte:
  - Synapse: [security@matrix.org](mailto:security@matrix.org)
  - Continuwuity: Überprüfen Sie das Projekt-Repository für Sicherheitsrichtlinien

### Server kompromittiert

Wenn Sie glauben, dass Ihr Server kompromittiert wurde:

1. Trennen Sie den Server sofort vom Internet
2. Bewahren Sie Logs für forensische Analysen auf
3. Kontaktieren Sie Sicherheitsexperten
4. Fragen Sie nicht in öffentlichen Räumen um Hilfe, bis das Problem behoben ist

## Zusätzliche Ressourcen

- [Matrix Community](https://matrix.to/#/#community:matrix.org) - Zentrale Anlaufstelle für Matrix-Community-Räume
- [Awesome Matrix](https://github.com/jryans/awesome-matrix) - Kuratierte Liste von Matrix-Ressourcen
- [Matrix FAQ](https://matrix.org/faq/) - Häufig gestellte Fragen zu Matrix
