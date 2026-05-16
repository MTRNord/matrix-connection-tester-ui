## Overview

Network problems are among the most common causes of connectivity test failures. This guide walks you through diagnosing them step by step — from confirming the server is running to verifying it is reachable from the internet.

:::banner{kind="info" title="Test from outside your network"}
Always test from an external network or use the connectivity tester here. Testing from the same network as your server can give misleading results because local traffic bypasses your firewall and public DNS.
:::

## Step 1: Confirm the server is running

### Synapse

```bash
sudo systemctl status matrix-synapse
sudo journalctl -u matrix-synapse -n 50
```

### Continuwuity

```bash
sudo systemctl status continuwuity
sudo journalctl -u continuwuity -n 50
```

If the service is not running, start it and check the logs for the reason it stopped.

## Step 2: Confirm the server is listening on the right port

```bash
# Check what is listening
sudo ss -tlnp | grep -E '(443|8448|8008)'
```

You should see your homeserver or reverse proxy listening on port 8008 (internal), and Nginx/Caddy on port 443 or 8448.

**If port 8008 shows `127.0.0.1`:** That is correct — the homeserver should only listen on localhost when a reverse proxy is in front.

**If nothing is listening on 443:** Your reverse proxy is not running or misconfigured.

## Step 3: Check your firewall

Your firewall must allow incoming connections on port 443 (recommended) or 8448.

### UFW (Ubuntu/Debian)

```bash
sudo ufw status
sudo ufw allow 443/tcp
sudo ufw reload
```

### firewalld (Fedora/RHEL)

```bash
sudo firewall-cmd --list-all
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

### iptables

```bash
# Check current rules
sudo iptables -L -n -v | grep -E '(443|8448)'

# Add rule if missing
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

## Step 4: Test external reachability

From a machine on a different network (or use the connectivity tester):

```bash
# Test TCP connection
telnet matrix.example.com 443

# Test the federation endpoint
curl https://matrix.example.com/_matrix/federation/v1/version

# Test the client-server endpoint
curl https://matrix.example.com/_matrix/client/versions
```

## Step 5: Verify DNS

```bash
# Check A record
dig +short example.com

# Check from an external DNS server
dig @8.8.8.8 example.com

# Check SRV record (if used)
dig +short _matrix-fed._tcp.example.com SRV
```

If you recently changed DNS records, allow 24–48 hours for propagation.

## Common network problems

### Connection refused

The port is not open or the service is not listening. Work through steps 1–3 above.

### Connection timeout

A firewall is blocking the port. Check your server-level firewall (step 3) and any external firewall or security group your hosting provider may have.

### DNS not resolving

Check the A record exists and points to your server's public IP. Use `dig @8.8.8.8` to query outside your local DNS cache.

### IPv6 issues

If some users can connect and others cannot, check whether your server has both IPv4 and IPv6 configured correctly:

```bash
# Test both
curl -4 https://matrix.example.com/_matrix/federation/v1/version
curl -6 https://matrix.example.com/_matrix/federation/v1/version
```

If IPv6 does not work, either fix it or remove the AAAA record so all traffic uses IPv4.

## Checking reverse proxy logs

If the server is running and ports are open but requests are still failing:

```bash
# Nginx
sudo tail -f /var/log/nginx/error.log

# Caddy
sudo journalctl -u caddy -f
```

See [Server Logs](/docs/troubleshooting/server-logs) for more on reading server and proxy logs.
