---
title: General Troubleshooting
description: Diagnose and resolve common Matrix server issues
---

## Overview

This guide helps you diagnose and fix common issues with your Matrix server. If you're experiencing problems, start by identifying the symptoms and work through the relevant sections below.

:::inset
**Quick Start:** Run the [connectivity tester](/) to automatically identify issues with your server configuration.
:::

## Common Issues and Solutions

### Federation Not Working

:::details Other servers cannot find my server

**Symptoms:** Users on other servers cannot send messages to your users, or your users cannot join rooms on other servers.

**Common causes:**

- Well-known files not accessible or misconfigured
- DNS records missing or incorrect
- Firewall blocking federation port
- TLS certificate issues

**How to fix:**

1. Test your well-known files: `curl https://yourdomain.com/.well-known/matrix/server`
2. Verify they return valid JSON with proper CORS headers
3. Check your TLS certificate is valid for the domain specified in well-known
4. Ensure port 443 (or 8448) is open and accessible from the internet
5. Test federation endpoint: `curl https://matrix.yourdomain.com/_matrix/federation/v1/version`

**See also:** [Federation Setup Guide](/docs/federation-setup), [Well-Known Delegation](/docs/wellknown-delegation)

:::

:::details TLS certificate errors in federation

**Symptoms:** Logs show SSL/TLS verification errors when federating with other servers.

**Common causes:**

- Expired certificate
- Certificate doesn't match domain name
- Self-signed certificate (not acceptable for federation)
- Intermediate certificates missing

**How to fix:**

1. Check certificate expiry: `openssl s_client -connect matrix.yourdomain.com:443 -servername matrix.yourdomain.com | openssl x509 -noout -dates`
2. Verify certificate matches your domain
3. Use Let's Encrypt or another trusted CA
4. Include full certificate chain

**See also:** [TLS Certificates](/docs/tls-certificates), [Federation TLS](/docs/federation-tls)

:::

:::details Federation works intermittently

**Symptoms:** Sometimes federation works, sometimes it doesn't.

**Common causes:**

- DNS caching issues
- Multiple A/AAAA records with some unreachable
- Load balancer or CDN issues
- Rate limiting

**How to fix:**

1. Check all IPs your domain resolves to are reachable
2. Test from multiple locations: `dig +short yourdomain.com`
3. Review rate limiting configuration
4. Check [server logs](/docs/server-logs) for patterns

:::

### Client Connection Issues

:::details Clients cannot connect to homeserver

**Symptoms:** Matrix clients show connection errors or cannot find the homeserver.

**Common causes:**

- Client well-known file missing or incorrect
- CORS headers not set properly
- Base URL incorrect in client well-known
- Network connectivity issues

**How to fix:**

1. Test client well-known: `curl https://yourdomain.com/.well-known/matrix/client`
2. Verify it returns valid JSON with CORS headers
3. Check the `base_url` points to your homeserver
4. Test the client-server API: `curl https://matrix.yourdomain.com/_matrix/client/versions`

**See also:** [CORS Configuration](/docs/cors-configuration), [Client-Server API](/docs/client-server-api)

:::

:::details CORS preflight errors

**Symptoms:** Browser console shows CORS errors, requests fail with OPTIONS method.

**Common causes:**

- OPTIONS requests not handled
- CORS headers missing on preflight responses
- Incorrect Access-Control-Allow-* headers

**How to fix:**

1. Ensure your reverse proxy handles OPTIONS requests
2. Return appropriate CORS headers on all responses
3. Include: `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`

**See also:** [CORS Preflight](/docs/cors-preflight)

:::

### DNS and Network Issues

:::details DNS not resolving correctly

**Symptoms:** Domain doesn't resolve, or resolves to wrong IP address.

**Common causes:**

- DNS records not propagated
- Incorrect A/AAAA records
- Missing SRV records (if used)
- DNS caching showing old values

**How to fix:**

```bash
# Check A records
dig +short yourdomain.com

# Check AAAA records (IPv6)
dig +short yourdomain.com AAAA

# Check SRV records
dig +short _matrix._tcp.yourdomain.com SRV

# Query specific DNS server
dig @8.8.8.8 yourdomain.com
```

Wait 24-48 hours for DNS propagation after changes.

:::

:::details Port not accessible

**Symptoms:** Connection timeouts, cannot reach server from outside.

**Common causes:**

- Firewall blocking port
- Service not listening on correct interface
- ISP blocking port
- Port forwarding not configured (if behind NAT)

**How to fix:**

1. Check service is listening: `sudo netstat -tlnp | grep LISTEN`
2. Test from outside: `telnet yourdomain.com 443`
3. Check firewall rules: `sudo ufw status` or `sudo iptables -L`
4. Open required ports (443 and/or 8448)

:::

### Performance Issues

:::details Server running slowly

**Symptoms:** High latency, slow responses, timeouts.

**Common causes:**

- Insufficient resources (RAM, CPU)
- Database performance issues
- Large rooms with many members
- Excessive logging

**How to fix:**

1. Check resource usage: `htop` or `top`
2. Review database performance
3. Consider upgrading server specs
4. Optimize logging level to INFO or WARNING

**See also:** [Performance](/docs/performance), [Server Configuration](/docs/server-configuration)

:::

:::details Database connection errors

**Symptoms:** Logs show database errors, connections refused.

**Common causes:**

- Database server not running
- Connection pool exhausted
- Wrong database credentials
- Database disk full

**How to fix:**

1. Check database service: `systemctl status postgresql`
2. Verify connection settings in homeserver config
3. Check disk space: `df -h`
4. Review connection pool settings

:::

### Configuration Issues

:::details Server won't start

**Symptoms:** Server fails to start, exits immediately.

**Common causes:**

- Syntax errors in configuration file
- Missing required configuration
- Port already in use
- File permission issues

**How to fix:**

1. Check [server logs](/docs/server-logs) for startup errors
2. Validate YAML syntax: `python -c "import yaml; yaml.safe_load(open('homeserver.yaml'))"`
3. Check port availability: `sudo lsof -i :8008`
4. Verify file permissions: `ls -la /path/to/homeserver.yaml`

:::

:::details Configuration changes not taking effect

**Symptoms:** Changed settings don't apply.

**Common causes:**

- Server not restarted after config change
- Editing wrong config file
- Config cached or overridden

**How to fix:**

1. Restart the homeserver: `sudo systemctl restart matrix-synapse`
2. Verify you're editing the correct config file
3. Check for override files or environment variables

:::

## Diagnostic Steps

### 1. Check Server Status

```bash
# Check if service is running
sudo systemctl status matrix-synapse

# Check process
ps aux | grep synapse
```

### 2. Review Logs

```bash
# View recent logs
sudo journalctl -u matrix-synapse -n 100

# Follow logs in real-time
sudo journalctl -u matrix-synapse -f

# Search for errors
sudo journalctl -u matrix-synapse | grep -i error
```

### 3. Test Endpoints

```bash
# Test client-server API
curl https://matrix.yourdomain.com/_matrix/client/versions

# Test federation API
curl https://matrix.yourdomain.com/_matrix/federation/v1/version

# Test well-known (server)
curl https://yourdomain.com/.well-known/matrix/server

# Test well-known (client)
curl https://yourdomain.com/.well-known/matrix/client
```

### 4. Verify DNS

```bash
# Check A record
dig +short yourdomain.com

# Check with trace
dig +trace yourdomain.com

# Check from external DNS
dig @8.8.8.8 yourdomain.com
```

### 5. Test Network Connectivity

```bash
# Test port reachability
telnet yourdomain.com 443

# Test TLS certificate
openssl s_client -connect matrix.yourdomain.com:443 -servername matrix.yourdomain.com

# Test with curl verbose
curl -v https://matrix.yourdomain.com/_matrix/federation/v1/version
```

## Getting Help

If you're still having issues after trying these troubleshooting steps:

1. **Gather information:**
   - Server software and version
   - Relevant log excerpts
   - Results from connectivity tester
   - What you've already tried

2. **Check documentation:**
   - [Server Logs](/docs/server-logs)
   - [Federation Setup](/docs/federation-setup)
   - [Network Troubleshooting](/docs/network-troubleshooting)

3. **Ask for help:**
   - Matrix community rooms (see [Getting Help](/docs/getting-help))
   - Include all relevant information
   - Be patient and respectful

## Prevention Best Practices

### Regular Maintenance

- Keep server software updated
- Monitor resource usage
- Review logs regularly
- Test federation periodically
- Backup configuration and data

### Monitoring

Set up monitoring for:

- Server uptime
- Federation connectivity
- Resource usage (CPU, RAM, disk)
- Certificate expiry
- Error rates in logs

### Documentation

- Document your setup
- Keep notes on configuration changes
- Record issue resolutions
- Maintain runbooks for common tasks

## Related Documentation

- [Server Logs](/docs/server-logs) - Understanding log files
- [Federation Setup](/docs/federation-setup) - Configure federation
- [Network Troubleshooting](/docs/network-troubleshooting) - Network-specific issues
- [Getting Help](/docs/getting-help) - Where to find support
- [Server Configuration](/docs/server-configuration) - Configuration best practices
