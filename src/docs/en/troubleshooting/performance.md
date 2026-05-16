## Overview

If the connectivity tester confirms your server is reachable but users report slow performance, this page helps you identify the bottleneck. Performance tuning should be based on actual measurements — check metrics first, then optimize.

## Monitoring your server

### System resources

```bash
# CPU and memory overview
htop

# Disk I/O
iostat -x 1

# What processes are using the most resources
ps aux --sort=-%cpu | head -10
ps aux --sort=-%mem | head -10
```

### Prometheus metrics (Synapse)

Synapse can expose metrics for Prometheus. Enable it in `homeserver.yaml`:

```yaml
enable_metrics: true
metrics_port: 9000
```

Useful metrics to watch:

```
synapse_http_server_request_count          — number of API requests
synapse_http_server_response_time_seconds  — API response latency
synapse_storage_transaction_time_seconds   — database query time
synapse_util_caches_cache_hits             — cache effectiveness
```

A Prometheus + Grafana stack gives you a visual dashboard. Synapse ships with a ready-made Grafana dashboard.

## Common performance problems

### Slow API responses

Check which endpoint is slow:

```bash
# Time a request
time curl https://matrix.example.com/_matrix/client/versions
```

If database queries are slow, the most impactful change is switching from SQLite to PostgreSQL if you have not already done so.

### High CPU usage

Large rooms with many members cause heavy state resolution, which is CPU-intensive. This is expected behaviour when joining or syncing large rooms. If your server is consistently at high CPU outside of room joins, check the Synapse metrics for which operations are taking the most time.

### High memory usage

Synapse caches state in memory. If memory is a concern, check your `caches.global_factor` setting in `homeserver.yaml` — the default is `0.5`. If your server has plenty of RAM, increasing this can improve performance.

### Federation lag

If messages from other servers arrive with a delay, check:

1. Is your own server responding quickly? (`htop`, response time metrics)
2. Are there errors in the federation logs? (`sudo journalctl -u matrix-synapse | grep federation`)
3. Is the remote server simply slow? (test a few different servers)

## Useful references

- [Synapse documentation — Performance tuning](https://element-hq.github.io/synapse/latest/usage/configuration/config_documentation.html)
- [Server Logs](/docs/troubleshooting/server-logs) — read logs to identify what is slow
