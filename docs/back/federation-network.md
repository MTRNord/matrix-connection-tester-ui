---
title: Understanding Federation Network
description: Configure network settings, DNS, and firewall rules for Matrix federation
---

# Understanding Federation Network

Matrix federation allows different Matrix servers to communicate with each other, creating a decentralized network where users on one server can chat with users on another server. Think of it like email - you can send messages from Gmail to Outlook because they use compatible protocols.

:::inset
**Recommended approach:** Use .well-known delegation to serve federation on port 443. This is easier to configure, more reliable, and works better with firewalls and network infrastructure than the legacy port 8448 approach.
:::

:::warning
Running a Matrix homeserver behind residential NAT/router setups is not recommended. Matrix federation is complex and works best on VPS or dedicated hosting with a static public IP. Residential setups with port forwarding often encounter issues with ISP blocks, dynamic IPs, and network complexity.
:::

:::warning
Federation requires specific network ports to be open and properly configured. Incorrect network settings are the most common cause of federation problems.
:::

## Network Requirements

### Required Ports

For Matrix federation to work, your server needs to be accessible on specific ports. We recommend using port 443 with .well-known delegation:

| Port | Protocol | Purpose | Recommendation |
|------|----------|---------|----------------|
| 443 | HTTPS | Federation API and .well-known | ✓ Recommended |
| 8448 | HTTPS | Federation API (legacy direct) | Alternative |

**Setup options in order of preference:**

1. **Port 443 with .well-known delegation** (Best) - Works with all networks and firewalls
2. **SRV record with custom port** (Good) - Flexible but requires DNS management
3. **Port 8448 direct** (Legacy) - May be blocked by some networks and firewalls

### Firewall Configuration

Your firewall must allow incoming connections to your Matrix server. Here's how to configure common Linux firewalls:

#### UFW (Ubuntu/Debian)

```bash
# Allow HTTPS (recommended for federation with delegation)
sudo ufw allow 443/tcp

# Optional: Allow port 8448 only if not using delegation
# sudo ufw allow 8448/tcp

# Reload firewall
sudo ufw reload
```

#### firewalld (RHEL/CentOS/Fedora)

```bash
# Allow HTTPS (recommended for federation with delegation)
sudo firewall-cmd --permanent --add-port=443/tcp

# Optional: Allow port 8448 only if not using delegation
# sudo firewall-cmd --permanent --add-port=8448/tcp

# Reload firewall
sudo firewall-cmd --reload
```

### NAT and Port Forwarding (Not Recommended)

:::warning
Running a Matrix homeserver behind NAT (home/residential setups) is strongly discouraged. Use a VPS or dedicated server with a public IP instead. NAT setups are complex, unreliable for federation, and often blocked by ISPs.
:::

If you must run behind a router or NAT gateway despite the strong recommendation against it, you need to configure port forwarding:

1. Access your router's admin panel (usually at 192.168.1.1 or 192.168.0.1)
2. Find the "Port Forwarding" or "NAT" section
3. Forward external port 443 to your server's internal IP on port 443
4. Optional: Only forward port 8448 if not using .well-known delegation

:::inset
**Example:** If your server's internal IP is 192.168.1.100, forward:

- External 443 → 192.168.1.100:443 (required)
- External 8448 → 192.168.1.100:8448 (only if not using delegation)

**Note:** Again, this NAT setup is not recommended. Consider using a VPS with a public IP instead for better reliability and federation compatibility.
:::

## DNS Configuration

Proper DNS configuration is essential for federation. Other servers need to find your federation endpoint.

### SRV Records (Alternative Method)

SRV records tell other servers where to find your federation API. This is an alternative to .well-known delegation and allows flexible port and hostname configuration. Only use this if you're not using .well-known delegation on port 443.

```dns
_matrix._tcp.example.com. 3600 IN SRV 10 0 8448 matrix.example.com.
```

Breaking down this record:

- `_matrix._tcp.example.com` - The service name (always this format)
- `3600` - Time to live (TTL) in seconds
- `10` - Priority (lower is preferred)
- `0` - Weight (for load balancing)
- `8448` - Port number where federation is available
- `matrix.example.com` - Hostname of your Matrix server

### A/AAAA Records

You need DNS records pointing to your server's IP address:

```dns
# IPv4 (A record)
matrix.example.com. 3600 IN A 203.0.113.10

# IPv6 (AAAA record) - optional but recommended
matrix.example.com. 3600 IN AAAA 2001:db8::10
```

### Delegated Configuration (Recommended)

When using .well-known delegation (the recommended approach), you serve federation on port 443 and only need basic A/AAAA DNS records pointing to your server. You don't need an SRV record. See the [.well-known Delegation](/docs/wellknown-delegation) guide for complete setup instructions.

## Testing Network Connectivity

### Check Port Accessibility

Use these commands to verify your ports are accessible from the internet:

```bash
# Test from your server (checks if the port is listening)
sudo netstat -tlnp | grep 8448

# Test from an external machine
telnet example.com 8448

# Or use nc (netcat)
nc -zv example.com 8448

# Check with OpenSSL (verifies TLS/SSL)
openssl s_client -connect example.com:8448 -servername example.com
```

### Verify DNS Records

Check that your DNS records are correctly configured:

```bash
# Check SRV record
dig SRV _matrix._tcp.example.com

# Check A record
dig A matrix.example.com

# Check AAAA record (IPv6)
dig AAAA matrix.example.com

# Query specific nameserver
dig @8.8.8.8 SRV _matrix._tcp.example.com
```

### Use This Connection Tester

**This is the recommended first step for testing your setup.** Use the connection tester on the homepage of this site to automatically check your federation network configuration. It will:

- Verify DNS SRV records are properly configured
- Test network connectivity to federation ports
- Check TLS certificate validity
- Validate .well-known delegation if configured
- Provide detailed diagnostics for any issues found
- Give you specific recommendations for fixing problems

Simply enter your Matrix server's domain name on the [homepage](/) to run a comprehensive test.

## Common Network Issues

### Connection Timeout

:::warning
**Problem:** Other servers cannot connect to your federation port
:::

Possible causes:

- Firewall blocking incoming connections
- Port forwarding not configured on your router
- ISP blocking the port
- Server not actually listening on the port

**Solutions:**

1. Verify your firewall rules allow incoming traffic
2. Check port forwarding configuration on your router
3. Test from an external network (not from your local network)
4. Contact your ISP if port 8448 is blocked
5. Consider using port 443 with .well-known delegation

### DNS Resolution Failures

Possible causes:

- DNS records not yet propagated (can take up to 48 hours)
- Incorrect SRV record format
- Missing A/AAAA records
- DNS caching showing old records

**Solutions:**

1. Wait for DNS propagation to complete
2. Use `dig` to verify your records from multiple locations
3. Check your DNS provider's interface for syntax errors
4. Lower TTL values before making changes to speed up propagation
5. Test your setup using the connection tester on the [homepage](/)

### Asymmetric Federation

You can contact other servers, but they cannot contact you (or vice versa).

Possible causes:

- Outbound connections work but inbound are blocked
- Your server's DNS records point to a different IP
- NAT/firewall allows outbound but blocks inbound

**Solutions:**

1. Test connectivity in both directions
2. Verify DNS records point to your public IP
3. Check that port forwarding is bidirectional
4. Review firewall rules for both INPUT and OUTPUT chains

## Advanced Network Configuration

### IPv6 Support

Enabling IPv6 improves connectivity with IPv6-only servers and is increasingly important:

1. Ensure your server has an IPv6 address
2. Add AAAA DNS records
3. Configure your firewall to allow IPv6 traffic
4. Update your Matrix server to listen on IPv6
5. Test IPv6 connectivity using the connection tester on the [homepage](/)

### Load Balancers and Reverse Proxies

If using a load balancer or reverse proxy:

- Ensure it preserves the original IP address (X-Forwarded-For header)
- Configure health checks appropriately
- Use multiple SRV records with different priorities for redundancy
- Ensure TLS termination is handled correctly

### CDN and DDoS Protection

Matrix federation requires direct server-to-server connections, so traditional CDNs that proxy all traffic won't work. However, you can:

- Use CDN for client-server API (port 443) only
- Keep federation API (port 8448) direct to your server
- Implement rate limiting at the application level
- Use firewall rules to block abusive IPs

## Security Considerations

While opening ports for federation, maintain security:

- Only open the specific ports needed (443, or 8448 if not using delegation)
- Use TLS certificates from a trusted CA
- Keep your Matrix server software up to date
- Monitor server logs for suspicious activity
- Implement rate limiting to prevent abuse
- Consider using fail2ban to block repeated failed attempts

## Monitoring Federation Network

Regular monitoring helps catch issues early:

- Monitor port availability with tools like Nagios or Zabbix
- Set up alerts for DNS record changes
- Track connection success rates to other servers
- Monitor network bandwidth usage
- Check certificate expiration dates

## Related Documentation

- [Federation TLS Configuration](/docs/federation-tls) - Configure TLS certificates for federation
- [.well-known Delegation](/docs/wellknown-delegation) - Set up delegation to use port 443
- [Server Configuration](/docs/server-configuration) - Configure your Matrix server
- [Troubleshooting Guide](/docs/troubleshooting) - Fix common federation problems

## External Resources

- [Matrix Server-Server API Specification](https://spec.matrix.org/latest/server-server-api/)
- [Matrix.org Federation Guide](https://matrix.org/docs/guides/federation)
