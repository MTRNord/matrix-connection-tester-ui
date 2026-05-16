## Überblick

Wenn der Verbindungstest bestätigt, dass Ihr Server erreichbar ist, Nutzer aber von langsamer Leistung berichten, hilft Ihnen diese Seite, den Engpass zu identifizieren. Leistungsoptimierung sollte auf tatsächlichen Messungen basieren — prüfen Sie zuerst die Metriken, dann optimieren Sie.

## Server überwachen

### Systemressourcen

```bash
# CPU- und Arbeitsspeicherübersicht
htop

# Festplatten-I/O
iostat -x 1

# Welche Prozesse die meisten Ressourcen verbrauchen
ps aux --sort=-%cpu | head -10
ps aux --sort=-%mem | head -10
```

### Prometheus-Metriken (Synapse)

Synapse kann Metriken für Prometheus bereitstellen. Aktivieren Sie dies in `homeserver.yaml`:

```yaml
enable_metrics: true
metrics_port: 9000
```

Nützliche Metriken zum Beobachten:

```
synapse_http_server_request_count          — Anzahl der API-Anfragen
synapse_http_server_response_time_seconds  — API-Antwortlatenz
synapse_storage_transaction_time_seconds   — Datenbankabfragezeit
synapse_util_caches_cache_hits             — Cache-Effektivität
```

Ein Prometheus + Grafana Stack gibt Ihnen ein visuelles Dashboard. Synapse wird mit einem fertigen Grafana-Dashboard geliefert.

## Häufige Leistungsprobleme

### Langsame API-Antworten

Prüfen Sie, welcher Endpunkt langsam ist:

```bash
# Anfrage zeitlich messen
time curl https://matrix.beispiel.de/_matrix/client/versions
```

Wenn Datenbankabfragen langsam sind, ist die wirkungsvollste Änderung der Wechsel von SQLite zu PostgreSQL, falls noch nicht geschehen.

### Hohe CPU-Auslastung

Große Räume mit vielen Mitgliedern verursachen intensive Zustandsauflösung, die CPU-intensiv ist. Das ist erwartetes Verhalten beim Beitreten oder Synchronisieren großer Räume. Wenn Ihr Server dauerhaft bei hoher CPU-Auslastung ist (außerhalb von Raumbeitritten), prüfen Sie die Synapse-Metriken, welche Operationen am meisten Zeit benötigen.

### Hoher Speicherverbrauch

Synapse speichert Zustände im Arbeitsspeicher zwischen. Wenn Speicher ein Problem ist, prüfen Sie Ihre `caches.global_factor`-Einstellung in `homeserver.yaml` — der Standardwert ist `0.5`. Wenn Ihr Server viel RAM hat, kann eine Erhöhung die Leistung verbessern.

### Verbund-Verzögerung

Wenn Nachrichten von anderen Servern verzögert ankommen, prüfen Sie:

1. Antwortet Ihr eigener Server schnell? (`htop`, Antwortzeit-Metriken)
2. Gibt es Fehler in den Verbund-Logs? (`sudo journalctl -u matrix-synapse | grep federation`)
3. Ist der Remote-Server einfach langsam? (mehrere verschiedene Server testen)

## Weiterführende Ressourcen

- [Synapse-Dokumentation — Leistungsoptimierung](https://element-hq.github.io/synapse/latest/usage/configuration/config_documentation.html)
- [Server-Logs](/docs/troubleshooting/server-logs) — Logs lesen, um herauszufinden, was langsam ist
