---
title: Server Logs
description: Understanding and troubleshooting Matrix server logs
---

## Why Server Logs Matter

Server logs are your primary tool for diagnosing issues with your Matrix server. They record errors, warnings, and information about server operations, helping you understand what's happening when things go wrong.

:::inset
**Quick Tip:** When asking for help in community channels, always include relevant log excerpts. They help others understand and diagnose your problem much faster.
:::

## Finding Your Logs

### Synapse Logs

Synapse typically logs to systemd's journal when running as a service:

```bash
# View recent logs
sudo journalctl -u matrix-synapse -n 100

# Follow logs in real-time
sudo journalctl -u matrix-synapse -f

# View logs from a specific time
sudo journalctl -u matrix-synapse --since "2024-01-01" --until "2024-01-02"

# Search for specific errors
sudo journalctl -u matrix-synapse | grep -i error
```

If Synapse is configured to log to a file, check these locations:

- `/var/log/matrix-synapse/homeserver.log`
- Location specified in `homeserver.yaml` logging configuration

### Continuwuity Logs

```bash
# View Continuwuity logs
sudo journalctl -u continuwuity -n 100

# Follow logs in real-time
sudo journalctl -u continuwuity -f
```

### Nginx Logs

```bash
# Access logs (successful requests)
sudo tail -f /var/log/nginx/access.log

# Error logs (failed requests, configuration errors)
sudo tail -f /var/log/nginx/error.log

# Search for specific domain
sudo grep "matrix.example.com" /var/log/nginx/access.log
```

### Caddy Logs

```bash
# View Caddy logs
sudo journalctl -u caddy -n 100

# Follow logs in real-time
sudo journalctl -u caddy -f
```

## Understanding Log Levels

Matrix servers use different log levels to indicate severity:

| Level | Meaning | Action Required |
|-------|---------|----------------|
| **ERROR** | Something went wrong that needs attention | Investigate |
| **WARNING** | Potential issue or unusual situation | Review |
| **INFO** | Normal operational messages | Normal |
| **DEBUG** | Detailed technical information | Optional |

## Common Error Messages

### Federation Errors

:::details "SSL verification failed" or "certificate verify failed"

**What it means:** Your server cannot verify the TLS certificate of a remote server.

**Common causes:**

- Remote server has an expired certificate
- Remote server uses a self-signed certificate
- Your server's certificate bundle is outdated

**How to fix:**

- If it's a remote server: Contact that server's administrator
- If it's your server: Update your TLS certificate
- Update CA certificates: `sudo update-ca-certificates`

:::

:::details "Connection refused" or "Connection timed out"

**What it means:** Your server cannot reach a remote server.

**Common causes:**

- Remote server is down or unreachable
- Firewall blocking outbound connections
- DNS resolution issues

**How to test:**

```bash
# Test connectivity to remote server
curl https://remote-server.example.com/_matrix/federation/v1/version

# Test DNS resolution
nslookup remote-server.example.com
```

:::

### Database Errors

:::details "database is locked" (SQLite)

**What it means:** SQLite database cannot handle concurrent operations.

**How to fix:**

- Migrate to PostgreSQL (strongly recommended for production)
- Reduce server load
- Check for stuck database connections

:::

:::details "too many connections" (PostgreSQL)

**What it means:** PostgreSQL has reached its maximum connection limit.

**How to fix:**

- Increase `max_connections` in PostgreSQL configuration
- Configure connection pooling in Matrix server
- Check for connection leaks

:::

### Authentication Errors

:::details "Invalid access token"

**What it means:** Client is using an invalid or expired authentication token.

**This is usually normal:** Clients automatically re-authenticate when tokens expire. Only investigate if it happens frequently or causes problems.

:::

## Configuring Log Levels

### Synapse Log Configuration

Configure logging in `homeserver.yaml`:

```yaml
# homeserver.yaml

log_config: "/etc/matrix-synapse/log.yaml"
```

Then in `/etc/matrix-synapse/log.yaml`:

```yaml
# log.yaml

version: 1

formatters:
  precise:
    format: '%(asctime)s - %(name)s - %(lineno)d - %(levelname)s - %(message)s'

handlers:
  # Log to systemd journal
  journal:
    class: systemd.journal.JournalHandler
    formatter: precise
    SYSLOG_IDENTIFIER: matrix-synapse

  # Or log to file
  file:
    class: logging.handlers.TimedRotatingFileHandler
    formatter: precise
    filename: /var/log/matrix-synapse/homeserver.log
    when: midnight
    backupCount: 7
    encoding: utf8

loggers:
  synapse:
    level: INFO

  synapse.storage.SQL:
    level: WARNING

  synapse.federation:
    level: INFO

root:
  level: INFO
  handlers: [journal]  # or [file]
```

### Increasing Log Detail

For troubleshooting, temporarily increase log verbosity:

```yaml
# Set to DEBUG for more detail
loggers:
  synapse:
    level: DEBUG

  synapse.federation:
    level: DEBUG
```

:::warning
Debug logging generates large amounts of data. Only use it for troubleshooting, then return to INFO level.
:::

### Log Rotation

If logging to files, ensure log rotation is configured to prevent disk space issues:

```bash
# Example logrotate configuration
# /etc/logrotate.d/matrix-synapse

/var/log/matrix-synapse/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    missingok
    postrotate
        systemctl reload matrix-synapse
    endscript
}
```

## Best Practices

### Regular Log Monitoring

- Check logs regularly for errors and warnings
- Set up alerts for critical errors
- Monitor disk space used by logs

### When Seeking Help

When asking for help, always include:

1. **Relevant log excerpts** (not the entire log file)
2. **Timestamp** of when the problem occurred
3. **What you were trying to do** when the error happened
4. **Server software and version** (e.g., "Synapse 1.96.0")
5. **Any recent configuration changes**

### Log Analysis Tools

Consider using log analysis tools for better visibility:

- **Grafana + Loki** - Visual log exploration
- **grep/awk/sed** - Command-line log analysis
- **journalctl filters** - Systemd journal queries

### Privacy Considerations

:::warning
Server logs may contain sensitive information:

- User IDs and room IDs
- IP addresses
- Error messages that reveal configuration details

Be cautious when sharing logs publicly. Redact sensitive information before posting.
:::

## Next Steps

- Learn about [Server Configuration](/docs/server-configuration) to optimize your setup
- Use [Network Troubleshooting](/docs/network-troubleshooting) tools to diagnose connectivity issues
- Review [Federation Setup](/docs/federation-setup) if you have federation-related errors
