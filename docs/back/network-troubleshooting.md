---
title: Network Troubleshooting
description: Diagnose and resolve network connectivity issues with your Matrix server
---

## Network Troubleshooting Guide

This guide helps you diagnose and fix network connectivity issues with your Matrix server. Network problems are the most common cause of federation failures, but they're usually straightforward to fix once identified.

:::warning
Always test from an external network, not from the same network as your server. Testing from inside your network can give misleading results.
:::

## Quick Diagnostic Steps

Follow these steps in order to identify where the problem is:

1. **Check if the server is running** - Verify your Matrix server process is active
2. **Verify the server is listening** - Ensure it's bound to the correct ports
3. **Test local connectivity** - Check if you can connect from the server itself
4. **Check firewall rules** - Verify nothing is blocking the ports
5. **Test from external network** - Confirm the server is accessible from the internet
6. **Verify DNS resolution** - Make sure DNS records are correct

## Step 1: Check Server Status

First, verify that your Matrix server is actually running:

### For Synapse

```bash
# Check if Synapse is running
sudo systemctl status matrix-synapse

# View recent logs
sudo journalctl -u matrix-synapse -n 50

# If not running, start it
sudo systemctl start matrix-synapse
```

### For Continuwuity

```bash
# Check if Continuwuity is running
sudo systemctl status continuwuity

# View recent logs
sudo journalctl -u continuwuity -n 50

# If not running, start it
sudo systemctl start continuwuity
```

## Step 2: Verify Port Listening

Confirm that your server is listening on the correct ports:

```bash
# Check what's listening on port 8448 (federation)
sudo netstat -tlnp | grep 8448

# Alternative using ss
sudo ss -tlnp | grep 8448

# Check all Matrix-related ports
sudo netstat -tlnp | grep -E '(8008|8448|443)'
```

You should see output like:

```text
tcp        0      0 0.0.0.0:8448            0.0.0.0:*               LISTEN      1234/python
tcp6       0      0 :::8448                 :::*                    LISTEN      1234/python
```

**If you see nothing:** Your server isn't listening on that port. Check your server configuration file.

**If it says 127.0.0.1:8448:** Your server is only listening on localhost. You need to configure it to listen on 0.0.0.0 or your public IP.

## Step 3: Test Local Connectivity

Test if you can connect to the server from the server itself:

```bash
# Test with curl (checks HTTP/HTTPS response)
curl -v https://localhost:8448/_matrix/federation/v1/version

# Test with OpenSSL (checks TLS handshake)
openssl s_client -connect localhost:8448 -servername example.com

# Simple port check
nc -zv localhost 8448
```

Expected output from curl should show a JSON response with server information.

If this works, your server is running and responding locally. The problem is likely with firewall or external access.

If this fails, the problem is with your server configuration or TLS certificates.

## Step 4: Check Firewall Rules

Verify that your firewall isn't blocking the required ports:

### UFW (Ubuntu/Debian)

```bash
# Check firewall status
sudo ufw status

# Allow port 443 (recommended)
sudo ufw allow 443/tcp

# Allow port 8448 (if using direct federation)
sudo ufw allow 8448/tcp

# Reload firewall
sudo ufw reload
```

### Firewalld (RHEL/CentOS/Fedora)

```bash
# Check firewall status
sudo firewall-cmd --list-all

# Allow port 443
sudo firewall-cmd --permanent --add-port=443/tcp

# Allow port 8448
sudo firewall-cmd --permanent --add-port=8448/tcp

# Reload firewall
sudo firewall-cmd --reload
```

### iptables

```bash
# Check current rules
sudo iptables -L -n -v

# Allow port 443
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT

# Allow port 8448
sudo iptables -A INPUT -p tcp --dport 8448 -j ACCEPT

# Save rules (Ubuntu/Debian)
sudo netfilter-persistent save

# Save rules (RHEL/CentOS)
sudo service iptables save
```

## Step 5: Test External Connectivity

Test if your server is reachable from the internet:

### Using telnet

```bash
# Test from an external machine or use a web-based tool
telnet matrix.example.com 443
telnet matrix.example.com 8448
```

Expected output:

```text
Trying 203.0.113.1...
Connected to matrix.example.com.
Escape character is '^]'.
```

If you get "Connection refused" or "Connection timed out", the port is not accessible from the internet.

### Using curl (from external machine)

```bash
# Test federation endpoint
curl https://matrix.example.com/_matrix/federation/v1/version

# Test with verbose output
curl -v https://matrix.example.com/_matrix/federation/v1/version

# Test well-known
curl https://example.com/.well-known/matrix/server
```

### Using online tools

Use online port checkers:

- [CanYouSeeMe.org](https://canyouseeme.org/)
- [YouGetSignal Port Check](https://www.yougetsignal.com/tools/open-ports/)

Enter your domain/IP and port (443 or 8448) to test.

## Step 6: Verify DNS Resolution

Check that DNS is configured correctly:

```bash
# Check A record
dig +short example.com

# Check AAAA record (IPv6)
dig +short example.com AAAA

# Check from external DNS server
dig @8.8.8.8 example.com

# Trace DNS resolution path
dig +trace example.com

# Check SRV records (if used)
dig +short _matrix._tcp.example.com SRV
```

Expected output for A record:

```text
203.0.113.1
```

### DNS Propagation

If you recently changed DNS:

- Wait 24-48 hours for full propagation
- Check propagation status at [WhatsMyDNS.net](https://www.whatsmydns.net/)
- Clear local DNS cache if needed

## Common Network Issues

### Issue: Connection Refused

**Symptoms:** `Connection refused` error when trying to connect.

**Causes:**

- Service not running
- Service listening on wrong port
- Service bound to localhost only

**Solutions:**

1. Verify service is running (Step 1)
2. Check port binding (Step 2)
3. Configure service to listen on 0.0.0.0

### Issue: Connection Timeout

**Symptoms:** Long delay then timeout error.

**Causes:**

- Firewall blocking port
- ISP blocking port
- Server not reachable from internet
- NAT/port forwarding not configured

**Solutions:**

1. Check firewall rules (Step 4)
2. Test port from external location
3. Configure NAT/port forwarding if behind router
4. Contact ISP if port 25, 80, or other common ports are blocked

### Issue: DNS Not Resolving

**Symptoms:** `Name or service not known`, `Could not resolve host`.

**Causes:**

- DNS records not configured
- DNS not propagated yet
- Typo in domain name
- DNS server issues

**Solutions:**

1. Verify DNS records exist
2. Wait for DNS propagation
3. Check domain spelling
4. Test with different DNS servers (`@8.8.8.8` or `@1.1.1.1`)

### Issue: TLS/SSL Errors

**Symptoms:** Certificate errors, handshake failures.

**Causes:**

- Expired certificate
- Wrong certificate for domain
- Self-signed certificate
- Intermediate certificates missing

**Solutions:**

1. Check certificate expiry: `openssl s_client -connect matrix.example.com:443 -servername matrix.example.com | openssl x509 -noout -dates`
2. Verify certificate matches domain
3. Use trusted CA (Let's Encrypt recommended)
4. Include full certificate chain

**See also:** [TLS Certificates](/docs/tls-certificates)

### Issue: IPv6 Problems

**Symptoms:** Some users can connect, others cannot.

**Causes:**

- IPv6 configured but not working
- IPv4 and IPv6 resolving to different servers
- Firewall only configured for IPv4

**Solutions:**

1. Test both IPv4 and IPv6 connectivity
2. Ensure both protocols work or disable IPv6
3. Configure firewall for both protocols
4. Test with: `curl -4` and `curl -6`

## Testing with This Tool

Use this connectivity tester to automate many of these checks:

1. Go to the [homepage](/)
2. Enter your domain name
3. Run the tests
4. Review any errors or warnings
5. Follow the specific guidance for each issue

The tool will automatically check:

- DNS resolution
- Well-known delegation
- Federation endpoint accessibility
- TLS certificate validity
- Server version and compatibility

## Advanced Diagnostics

### Packet Capture

If you're still having issues, capture network traffic:

```bash
# Capture traffic on port 8448
sudo tcpdump -i any -n port 8448 -w capture.pcap

# View capture
sudo tcpdump -r capture.pcap

# Or analyze with Wireshark
```

### Check Reverse Proxy Logs

If using Nginx or Caddy:

```bash
# Nginx access log
sudo tail -f /var/log/nginx/access.log

# Nginx error log
sudo tail -f /var/log/nginx/error.log

# Caddy logs
sudo journalctl -u caddy -f
```

### MTU Issues

In rare cases, MTU size can cause problems:

```bash
# Check MTU
ip link show

# Test with different MTU
ping -M do -s 1472 matrix.example.com
```

## Network Architecture Considerations

### Recommended Setup

```
Internet
   ↓
Firewall (allow 443, 8448)
   ↓
Reverse Proxy (Nginx/Caddy)
   ↓
Matrix Server (localhost:8008)
```

### What You Need

**Minimum requirements:**

- Public IP address (or port forwarding)
- Open port 443 or 8448
- Valid DNS pointing to your server
- TLS certificate

**Recommended:**

- Reverse proxy for SSL termination
- Firewall with only necessary ports open
- Monitoring and alerting
- Regular backups

## Getting Help

If you're still experiencing issues:

1. Gather diagnostic information:
   - Results from all the steps above
   - Server logs
   - Connectivity tester results
   - Your network setup description

2. Check [Server Logs](/docs/server-logs) for errors

3. Review [General Troubleshooting](/docs/troubleshooting) guide

4. Ask for help in Matrix community rooms (see [Getting Help](/docs/getting-help))

Include all diagnostic information when asking for help!

## Related Documentation

- [Federation Setup](/docs/federation-setup) - Configure federation
- [TLS Certificates](/docs/tls-certificates) - Certificate setup
- [Server Logs](/docs/server-logs) - Understanding logs
- [Troubleshooting](/docs/troubleshooting) - General issues
- [Getting Help](/docs/getting-help) - Where to find support
