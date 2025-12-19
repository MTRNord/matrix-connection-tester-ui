---
title: Performance
description: Matrix server performance optimization
---

## Overview

This guide covers performance optimization for Matrix homeservers. Proper optimization ensures your server can handle user load efficiently and provides a good user experience.

:::inset
**Note:** Performance tuning should be based on actual metrics and monitoring data, not assumptions. Always measure before and after optimization changes.
:::

## Understanding Matrix Performance

Matrix servers have several key performance characteristics:

- **Real-time messaging** - Low latency is critical
- **Federation traffic** - Network I/O intensive
- **Database operations** - Query performance matters
- **Media handling** - Storage and bandwidth intensive
- **State resolution** - CPU intensive for large rooms

## Monitoring Performance

Before optimizing, establish baseline metrics.

### Key Metrics to Monitor

- **Response time** - API endpoint latency
- **CPU usage** - Per-core utilization
- **Memory usage** - RAM consumption and swap usage
- **Database performance** - Query times and connection pool usage
- **Federation lag** - Delay in receiving remote events
- **Event processing rate** - Events per second

### Prometheus Metrics

Enable Prometheus metrics in Synapse:

```yaml
enable_metrics: true
metrics_port: 9000
```

Key metrics to watch:

```
synapse_http_server_request_count
synapse_federation_client_sent_transactions
synapse_storage_transaction_time_count
synapse_util_caches_cache_hits
synapse_replication_tcp_resource_connections
```

### System Monitoring

```bash
# CPU usage
htop

# Memory usage
free -h

# Disk I/O
iostat -x 1

# Network usage
iftop
```

## Database Optimization

The database is often the primary bottleneck.

### Use PostgreSQL

Always use PostgreSQL for production. SQLite has severe performance limitations.

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

### Connection Pooling

Configure appropriate connection pool size:

```yaml
database:
  args:
    cp_min: 5      # Minimum connections
    cp_max: 10     # Maximum connections
```

For busy servers, increase `cp_max` to 20-50.

### Database Tuning

PostgreSQL configuration (`postgresql.conf`):

```conf
# Memory settings
shared_buffers = 2GB                    # 25% of RAM
effective_cache_size = 6GB              # 75% of RAM
work_mem = 50MB
maintenance_work_mem = 512MB

# Connection settings
max_connections = 100

# WAL settings
wal_buffers = 16MB
checkpoint_completion_target = 0.9

# Query planner
random_page_cost = 1.1                  # For SSD
effective_io_concurrency = 200          # For SSD

# Logging
log_min_duration_statement = 1000       # Log slow queries
```

Restart PostgreSQL after changes:

```bash
sudo systemctl restart postgresql
```

### Vacuum and Analyze

Regular maintenance:

```bash
# Analyze database statistics
psql -U synapse_user -d synapse -c "ANALYZE;"

# Vacuum to reclaim space
psql -U synapse_user -d synapse -c "VACUUM ANALYZE;"
```

Enable autovacuum in PostgreSQL:

```conf
autovacuum = on
autovacuum_max_workers = 3
```

### Database Indexes

Synapse automatically creates necessary indexes. Check for missing indexes:

```sql
-- Find tables with sequential scans
SELECT schemaname, tablename, seq_scan, seq_tup_read, idx_scan
FROM pg_stat_user_tables
WHERE seq_scan > 0
ORDER BY seq_tup_read DESC
LIMIT 20;
```

## Caching Configuration

Increase cache sizes for better performance:

```yaml
caches:
  global_factor: 2.0
  per_cache_factors:
    get_users_who_share_room_with_user: 5.0
    get_state_for_auth_event: 5.0
    
event_cache_size: "100K"
```

For servers with more RAM, increase `global_factor` to 3.0 or 4.0.

## Worker Configuration

Distribute load across multiple processes.

### Enable Workers

Split processing across multiple worker processes:

```yaml
# Main process configuration
worker_app: synapse.app.homeserver
worker_name: main

# Enable Redis for worker communication
redis:
  enabled: true
  host: localhost
  port: 6379
```

### Worker Types

Create separate workers for:

- **Client API** - Handle client requests
- **Federation sender** - Send outgoing federation
- **Federation receiver** - Receive incoming federation
- **Media repository** - Handle media uploads/downloads
- **Event persister** - Write events to database

Example worker configuration:

```yaml
# federation_sender1.yaml
worker_app: synapse.app.federation_sender
worker_name: federation_sender1

worker_listeners:
  - type: http
    port: 8034
    resources:
      - names: [replication]

worker_daemonize: true
```

### Load Balancing

Use Nginx to load balance across workers:

```nginx
upstream matrix_client {
    server 127.0.0.1:8081;
    server 127.0.0.1:8082;
    server 127.0.0.1:8083;
}

server {
    listen 443 ssl;
    server_name matrix.example.com;
    
    location /_matrix/client {
        proxy_pass http://matrix_client;
    }
}
```

## Storage Optimization

### Media Storage

Media files can consume significant space:

```yaml
media_store_path: "/var/lib/matrix-synapse/media"
max_upload_size: "50M"

# Enable media retention
media_retention:
  local_media_lifetime: 90d
  remote_media_lifetime: 14d
```

### Compress Old Media

Script to compress old media:

```bash
#!/bin/bash
# compress-old-media.sh

MEDIA_DIR="/var/lib/matrix-synapse/media"
DAYS_OLD=30

find "$MEDIA_DIR" -type f -mtime +$DAYS_OLD -name "*.jpg" -o -name "*.png" | while read file; do
    if [[ ! -f "${file}.gz" ]]; then
        gzip "$file"
    fi
done
```

### Deduplicate Media

Synapse automatically deduplicates identical media files by content hash.

## CPU Optimization

### Event Processing

For large rooms, state resolution is CPU intensive:

```yaml
# Increase state resolution timeout
state_resolution_timeout: 60s
```

### Disable Unused Features

Disable features you don't need:

```yaml
# Disable presence if not needed
presence:
  enabled: false

# Disable URL previews
url_preview_enabled: false

# Disable typing notifications
use_presence: false
```

## Memory Optimization

### Monitor Memory Usage

```bash
# Check Synapse memory usage
ps aux | grep synapse

# Detailed memory breakdown
systemd-cgtop
```

### Reduce Memory Footprint

```yaml
# Lower cache sizes for low-memory servers
caches:
  global_factor: 0.5
  
event_cache_size: "10K"
```

### Enable Swap

Add swap space for memory spikes:

```bash
# Create 2GB swap file
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## Network Optimization

### Federation Tuning

```yaml
# Increase concurrent federation requests
federation_sender_instances: 2

# Adjust rate limits
federation_rr_transactions_per_room_per_second: 100
```

### HTTP Connection Pooling

Synapse uses connection pooling by default. For high-traffic servers:

```yaml
# In federation sender configuration
federation_client_maximum_requests: 20
```

## Rate Limiting

Balance security and performance:

```yaml
rc_message:
  per_second: 10    # Increase for busy servers
  burst_count: 20

rc_registration:
  per_second: 0.17
  burst_count: 3
```

## Large Room Performance

Large rooms (>1000 users) require special attention:

### Join Performance

Consider restricting room sizes:

```yaml
# Limit room size (optional)
max_room_size: 1000
```

### State Resolution

State resolution in large rooms is expensive. Monitor:

```
synapse_state_resolution_delta_seconds
```

## Resource Requirements by Scale

### Small Server (10-50 users)

- **CPU:** 2 cores
- **RAM:** 2-4 GB
- **Disk:** 20 GB SSD
- **Database:** PostgreSQL with default settings

### Medium Server (50-500 users)

- **CPU:** 4 cores
- **RAM:** 8 GB
- **Disk:** 100 GB SSD
- **Database:** PostgreSQL with tuning

### Large Server (500+ users)

- **CPU:** 8+ cores
- **RAM:** 16+ GB
- **Disk:** 500+ GB SSD (separate media storage)
- **Database:** PostgreSQL with workers
- **Architecture:** Multiple workers with Redis

## Performance Testing

### Load Testing

Use tools to simulate load:

```bash
# Example: Test registration endpoint
ab -n 100 -c 10 https://matrix.example.com/_matrix/client/versions
```

### Benchmark Tools

- **Apache Bench (ab)** - HTTP load testing
- **wrk** - Modern HTTP benchmarking
- **Prometheus** - Metric collection and analysis

## Troubleshooting Performance Issues

### High CPU Usage

**Symptoms:** CPU at 100%, slow response times

**Common causes:**
- Large room state resolution
- Inefficient database queries
- Too many concurrent operations

**Solutions:**
1. Check for problematic large rooms
2. Review slow query logs
3. Increase worker count
4. Optimize database

### High Memory Usage

**Symptoms:** Out of memory errors, OOM killer

**Common causes:**
- Cache sizes too large
- Memory leaks
- Insufficient RAM for load

**Solutions:**
1. Reduce cache sizes
2. Check for memory leaks (restart service)
3. Add more RAM or enable swap
4. Enable workers to distribute load

### Slow Database Queries

**Symptoms:** Long API response times

**Solutions:**
1. Run VACUUM ANALYZE
2. Check for missing indexes
3. Tune PostgreSQL configuration
4. Consider read replicas for large deployments

### Federation Lag

**Symptoms:** Delayed messages from federated servers

**Common causes:**
- Network issues
- Overloaded server
- Database bottleneck

**Solutions:**
1. Increase federation workers
2. Check network connectivity
3. Optimize database
4. Monitor federation metrics

## Best Practices

### Regular Maintenance

- **Weekly:** Check resource usage trends
- **Monthly:** Review slow query logs
- **Quarterly:** Database vacuum and optimization
- **Annually:** Hardware upgrade evaluation

### Monitoring Alerts

Set up alerts for:
- CPU usage > 80%
- Memory usage > 90%
- Disk usage > 85%
- Database connection pool exhausted
- Federation lag > 60 seconds

### Capacity Planning

Monitor growth trends:
- User registration rate
- Message volume
- Media storage growth
- Federation server count

Plan upgrades before hitting limits.

## Next Steps

- Set up [Server Logs](/docs/server-logs) monitoring
- Configure [Server Configuration](/docs/server-configuration) optimally
- Review [Troubleshooting](/docs/troubleshooting) guide
- Implement monitoring with Prometheus + Grafana

## Related Documentation

- [Server Configuration](/docs/server-configuration)
- [Server Logs](/docs/server-logs)
- [Troubleshooting](/docs/troubleshooting)
- [Federation Setup](/docs/federation-setup)
