---
title: Server Configuration
description: General Matrix server configuration guide
---

## Overview

This guide covers general configuration best practices for Matrix homeservers. Proper configuration ensures optimal performance, security, and compatibility with the Matrix ecosystem.

:::inset
**Note:** This guide provides general recommendations. Always consult your specific homeserver's documentation for detailed configuration options.
:::

## Basic Configuration

### Server Name

The server name is the domain portion of Matrix IDs (e.g., `@user:example.com`).

**Synapse (`homeserver.yaml`):**

```yaml
server_name: "example.com"
```

**Continuwuity:**

```toml
[global]
server_name = "example.com"
```

:::warning
The server name cannot be changed after users start registering. Choose carefully before going into production.
:::

### Listening Configuration

Configure which ports and interfaces your server listens on.

**Synapse:**

```yaml
listeners:
  - port: 8008
    type: http
    tls: false
    bind_addresses: ['127.0.0.1']
    x_forwarded: true
    resources:
      - names: [client, federation]
        compress: false
```

**For reverse proxy setup (recommended):**
- Listen on `127.0.0.1` (localhost only)
- Set `tls: false` (let reverse proxy handle TLS)
- Enable `x_forwarded: true` to trust proxy headers

**For direct exposure (not recommended):**
- Listen on `0.0.0.0` or `::`
- Set `tls: true` and configure certificate paths
- Bind to port 8448 for federation

## Database Configuration

### PostgreSQL (Recommended)

PostgreSQL is strongly recommended for production deployments.

**Synapse:**

```yaml
database:
  name: psycopg2
  args:
    user: synapse_user
    password: secretpassword
    database: synapse
    host: localhost
    port: 5432
    cp_min: 5
    cp_max: 10
```

**Create database:**

```sql
CREATE USER synapse_user WITH PASSWORD 'secretpassword';
CREATE DATABASE synapse
  ENCODING 'UTF8'
  LC_COLLATE 'C'
  LC_CTYPE 'C'
  TEMPLATE template0
  OWNER synapse_user;
```

### SQLite (Development Only)

SQLite is only suitable for testing and development.

```yaml
database:
  name: sqlite3
  args:
    database: /path/to/homeserver.db
```

:::warning
SQLite has severe performance limitations and is not suitable for production use. Always use PostgreSQL for production deployments.
:::

## Registration and User Management

### Open Registration

```yaml
enable_registration: true
enable_registration_without_verification: false
```

### Require Email Verification

```yaml
enable_registration: true
registrations_require_3pid:
  - email
email:
  smtp_host: smtp.example.com
  smtp_port: 587
  smtp_user: "notifications@example.com"
  smtp_pass: "password"
  notif_from: "Matrix <notifications@example.com>"
```

### Registration Shared Secret

Allow registration with a shared secret (for administrative user creation):

```yaml
registration_shared_secret: "your-secret-key-here"
```

Create users with:

```bash
register_new_matrix_user -c homeserver.yaml https://matrix.example.com
```

### Disable Public Registration

```yaml
enable_registration: false
```

## Federation Configuration

### Enable Federation

```yaml
# Federation is enabled by default
# To disable:
# federation_domain_whitelist:
#   - trusted-server.org
```

### Federation Sender

Configure how many federation requests to send simultaneously:

```yaml
federation_sender_instances: 1
# Increase for high-traffic servers
```

### Federation Rate Limiting

```yaml
federation_rr_transactions_per_room_per_second: 50
```

## Media Storage

### Local Media Store

```yaml
media_store_path: "/var/lib/matrix-synapse/media"
max_upload_size: "50M"
max_image_pixels: "32M"
```

### Media Retention

Automatically delete old media:

```yaml
media_retention:
  local_media_lifetime: 90d
  remote_media_lifetime: 14d
```

### URL Previews

```yaml
url_preview_enabled: true
url_preview_ip_range_blacklist:
  - '127.0.0.0/8'
  - '10.0.0.0/8'
  - '172.16.0.0/12'
  - '192.168.0.0/16'
  - '::1/128'
  - 'fe80::/10'
  - 'fc00::/7'
max_spider_size: "10M"
```

## Rate Limiting

Protect your server from abuse:

```yaml
rc_message:
  per_second: 0.2
  burst_count: 10

rc_registration:
  per_second: 0.17
  burst_count: 3

rc_login:
  address:
    per_second: 0.17
    burst_count: 3
  account:
    per_second: 0.17
    burst_count: 3
  failed_attempts:
    per_second: 0.17
    burst_count: 3
```

## Logging Configuration

### Synapse Logging

Configure logging in `log.yaml`:

```yaml
version: 1

formatters:
  precise:
    format: '%(asctime)s - %(name)s - %(lineno)d - %(levelname)s - %(message)s'

handlers:
  file:
    class: logging.handlers.TimedRotatingFileHandler
    formatter: precise
    filename: /var/log/matrix-synapse/homeserver.log
    when: midnight
    backupCount: 7
    encoding: utf8

  console:
    class: logging.StreamHandler
    formatter: precise

loggers:
  synapse:
    level: INFO
  synapse.storage.SQL:
    level: WARNING

root:
  level: INFO
  handlers: [file, console]
```

### Log to Systemd Journal

```yaml
handlers:
  journal:
    class: systemd.journal.JournalHandler
    formatter: precise
    SYSLOG_IDENTIFIER: matrix-synapse

root:
  level: INFO
  handlers: [journal]
```

## Performance Tuning

### Worker Configuration

For high-traffic servers, distribute load across multiple workers:

```yaml
# In main homeserver.yaml
worker_app: synapse.app.homeserver
worker_daemonize: false

# Create separate config for each worker
# See Synapse documentation for details
```

### Caching

```yaml
caches:
  global_factor: 2.0
  per_cache_factors:
    get_users_who_share_room_with_user: 5.0
```

### Event Cache Size

```yaml
event_cache_size: "100K"
```

## Security Best Practices

### Require Strong Passwords

```yaml
password_config:
  enabled: true
  policy:
    enabled: true
    minimum_length: 12
    require_digit: true
    require_symbol: true
    require_lowercase: true
    require_uppercase: true
```

### Disable Guest Access

```yaml
allow_guest_access: false
```

### Restrict Room Creation

```yaml
# Only allow users with specific power level to create rooms
# Or disable for all users except admins
```

### Enable Presence

```yaml
presence:
  enabled: true
```

Or disable for privacy/performance:

```yaml
presence:
  enabled: false
```

## Push Notifications

Configure push notification gateway:

```yaml
push:
  include_content: true
  group_unread_count_by_room: false
```

## Turn/STUN Configuration

For voice/video calls:

```yaml
turn_uris:
  - "turn:turn.example.com:3478?transport=udp"
  - "turn:turn.example.com:3478?transport=tcp"
turn_shared_secret: "your-turn-shared-secret"
turn_user_lifetime: 86400000
turn_allow_guests: true
```

## Metrics and Monitoring

### Prometheus Metrics

```yaml
enable_metrics: true
metrics_port: 9000
```

Access metrics at `http://localhost:9000/metrics`

### Resource Metrics

```yaml
report_stats: true
```

## Backup Configuration

### Important Files to Backup

- `homeserver.yaml` - Main configuration
- `signing.key` - Server signing key (critical!)
- Database - Full database backup
- Media store - `/var/lib/matrix-synapse/media`

### Backup Script Example

```bash
#!/bin/bash
BACKUP_DIR="/backup/matrix"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup database
pg_dump synapse > "$BACKUP_DIR/synapse_$DATE.sql"

# Backup config
cp /etc/matrix-synapse/homeserver.yaml "$BACKUP_DIR/homeserver_$DATE.yaml"
cp /etc/matrix-synapse/signing.key "$BACKUP_DIR/signing.key_$DATE"

# Backup media (optional, can be large)
# tar -czf "$BACKUP_DIR/media_$DATE.tar.gz" /var/lib/matrix-synapse/media

# Keep only last 7 days of backups
find "$BACKUP_DIR" -type f -mtime +7 -delete
```

## Configuration Validation

### Test Configuration

```bash
# Synapse
python -m synapse.app.homeserver \
  --config-path /etc/matrix-synapse/homeserver.yaml \
  --generate-keys

# Check for syntax errors
python -c "import yaml; yaml.safe_load(open('/etc/matrix-synapse/homeserver.yaml'))"
```

### Common Configuration Errors

**YAML Syntax Error:**
```
Check indentation - YAML is whitespace-sensitive
Use spaces, not tabs
```

**Invalid Server Name:**
```
Must be a valid domain name
Cannot include protocol (no https://)
```

**Database Connection Failed:**
```
Check credentials
Verify database exists
Ensure PostgreSQL is running
```

## Environment-Specific Configuration

### Development

```yaml
enable_registration: true
enable_registration_without_verification: true
suppress_key_server_warning: true
report_stats: false
```

### Production

```yaml
enable_registration: false  # Or with verification
report_stats: true
enable_metrics: true
# Use PostgreSQL
# Enable proper logging
# Configure backups
```

## Configuration Management

### Version Control

Store configuration in version control (Git):

```bash
git init /etc/matrix-synapse
cd /etc/matrix-synapse
git add homeserver.yaml log.yaml
git commit -m "Initial configuration"
```

:::warning
Never commit secrets (passwords, keys) to version control. Use environment variables or secret management tools.
:::

### Configuration Templates

Use templating tools for multiple servers:
- Ansible
- Terraform
- Jinja2 templates

## Upgrading Configuration

When upgrading your homeserver:

1. **Read release notes** for configuration changes
2. **Backup current configuration**
3. **Test in development** environment first
4. **Apply changes incrementally**
5. **Monitor logs** after upgrade

## Resource Requirements

### Minimum Requirements

- **CPU:** 2 cores
- **RAM:** 2 GB
- **Disk:** 10 GB + media storage
- **Database:** PostgreSQL 11+

### Recommended for Production

- **CPU:** 4+ cores
- **RAM:** 4-8 GB
- **Disk:** SSD with adequate space for media
- **Database:** PostgreSQL 13+ with regular backups

## Troubleshooting Configuration Issues

### Server Won't Start

```bash
# Check logs
sudo journalctl -u matrix-synapse -n 100

# Validate YAML syntax
python -c "import yaml; yaml.safe_load(open('homeserver.yaml'))"

# Check file permissions
ls -la /etc/matrix-synapse/
```

### Configuration Not Taking Effect

```bash
# Restart the service
sudo systemctl restart matrix-synapse

# Check you're editing the right file
sudo systemctl status matrix-synapse | grep "config"
```

## Next Steps

- Configure [Federation Setup](/docs/federation-setup)
- Set up [TLS Certificates](/docs/tls-certificates)
- Configure [CORS](/docs/cors-configuration)
- Review [Performance](/docs/performance) optimization
- Set up monitoring and [Server Logs](/docs/server-logs)

## Related Documentation

- [Federation Setup](/docs/federation-setup)
- [TLS Certificates](/docs/tls-certificates)
- [Performance](/docs/performance)
- [Server Logs](/docs/server-logs)
- [Troubleshooting](/docs/troubleshooting)
