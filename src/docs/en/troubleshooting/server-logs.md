## Why logs matter

Server logs are your primary tool for diagnosing issues. When something goes wrong, the logs will usually tell you exactly what failed and why. When asking for help in community channels, always include relevant log excerpts.

## Finding your logs

### Synapse

```bash
# View recent logs
sudo journalctl -u matrix-synapse -n 100

# Follow logs in real-time
sudo journalctl -u matrix-synapse -f

# Search for errors
sudo journalctl -u matrix-synapse | grep -i error

# Logs since a specific time
sudo journalctl -u matrix-synapse --since "2024-01-01 12:00:00"
```

If Synapse is configured to write to a file, check `/var/log/matrix-synapse/homeserver.log` or the path in your `homeserver.yaml`.

### Continuwuity

```bash
sudo journalctl -u continuwuity -n 100
sudo journalctl -u continuwuity -f
sudo journalctl -u continuwuity | grep -i error
```

### Nginx

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Caddy

```bash
sudo journalctl -u caddy -n 100
sudo journalctl -u caddy -f
```

## Log levels

| Level   | Meaning                               | What to do                       |
| ------- | ------------------------------------- | -------------------------------- |
| ERROR   | Something failed that needs attention | Investigate                      |
| WARNING | Potential issue or unusual situation  | Review                           |
| INFO    | Normal operational messages           | No action                        |
| DEBUG   | Detailed technical information        | Only enable when troubleshooting |

## Common error messages

### "SSL verification failed" or "certificate verify failed"

Your server cannot verify the TLS certificate of a remote server it is trying to federate with. This is usually caused by the remote server having an expired or self-signed certificate — the problem is on their side, not yours. If it affects many servers, check whether your OS certificate store is up to date:

```bash
sudo update-ca-certificates
```

If the error is about your own server's certificate, see [TLS Certificates](/docs/configuration/tls-certificates).

### "Connection refused" or "Connection timed out" during federation

Your server cannot reach a remote server. This is usually a temporary network issue on the remote side. If you consistently cannot reach one specific server, test with:

```bash
curl https://remote-server.example.com/_matrix/federation/v1/version
```

### "Invalid access token"

A client is using a token that has been revoked — typically because the user logged out from another device or an admin removed the session. In traditional Matrix authentication, access tokens are long-lived and only become invalid when explicitly revoked. This error appearing in logs is not itself a problem unless accompanied by user reports.

If you are using [Matrix Authentication Service (MAS)](https://github.com/element-hq/matrix-authentication-service), tokens have shorter lifetimes by design and clients use refresh tokens.

### "database is locked" (SQLite only)

SQLite cannot handle concurrent database operations at the scale Matrix requires. Migrate to PostgreSQL — this is expected for any production server.

## Increasing log verbosity for troubleshooting

For Synapse, temporarily set a module to DEBUG in your log config file (usually `/etc/matrix-synapse/log.yaml`):

```yaml
loggers:
  synapse.federation:
    level: DEBUG
```

Then reload: `sudo systemctl reload matrix-synapse`

:::banner{kind="warn" title="Return to INFO after troubleshooting"}
DEBUG logging generates a large amount of data and can slow down your server. Set it back to INFO once you have found the issue.
:::

## Privacy when sharing logs

Logs contain Matrix user IDs, room IDs, and IP addresses. Before sharing log excerpts publicly:

- Redact usernames and room IDs you are not comfortable sharing
- Redact IP addresses if they are sensitive
- Share only the relevant section, not the entire log file
