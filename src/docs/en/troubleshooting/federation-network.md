## Overview

Federation requires your server to be reachable from the internet on the right port with a valid TLS certificate. This page covers the network and DNS configuration specifically for federation. For general connectivity problems, see [Network Issues](/docs/troubleshooting/network-issues).

## Required ports

| Port | Purpose                              | Recommendation |
| ---- | ------------------------------------ | -------------- |
| 443  | Federation via well-known delegation | Recommended    |
| 8448 | Direct federation (legacy)           | Alternative    |

Port 443 with well-known delegation is preferred because port 8448 may be blocked by some firewalls and ISPs.

## Firewall configuration

Allow incoming connections on the port you are using:

### UFW (Ubuntu/Debian)

```bash
# For port 443 (delegation approach)
sudo ufw allow 443/tcp
sudo ufw reload
```

### firewalld (Fedora/RHEL)

```bash
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

## DNS configuration

### A/AAAA records

Your federation server needs a DNS record pointing to its IP:

```dns
matrix.example.com. 3600 IN A 203.0.113.10
```

### SRV records

SRV records are an alternative to well-known delegation. They tell other servers where to find your federation endpoint. Use them only if you are not already using well-known delegation.

:::banner{kind="warn" title="SRV records only affect federation"}
SRV records do not help clients find your server. Client discovery requires `/.well-known/matrix/client`. See [Well-Known Delegation](/docs/api-endpoints/well-known-delegation) for setup that covers both.
:::

The correct SRV record format (since Matrix spec v1.8):

```dns
_matrix-fed._tcp.example.com. 3600 IN SRV 10 0 8448 matrix.example.com.
```

:::banner{kind="info" title="Deprecated SRV record name"}
The old `_matrix._tcp` record name is deprecated since spec v1.8 and replaced by `_matrix-fed._tcp`. Most servers still recognize the old name for backwards compatibility, but new setups should use the current name.
:::

### Verify DNS

```bash
# Check A record
dig +short matrix.example.com

# Check SRV record
dig +short _matrix-fed._tcp.example.com SRV

# Check from an external DNS server
dig @8.8.8.8 matrix.example.com
```

## Testing federation connectivity

```bash
# Test the federation endpoint directly
curl https://matrix.example.com/_matrix/federation/v1/version

# Check the well-known federation file
curl https://example.com/.well-known/matrix/server

# Test the TLS handshake
openssl s_client -connect matrix.example.com:443 -servername matrix.example.com
```

Or run the [connectivity tester](/) which checks all of this automatically and reports which specific check is failing.

## Common federation network problems

### Other servers cannot connect (timeout)

1. Check your firewall allows inbound traffic on port 443 or 8448
2. If behind a hosting provider, check their network security groups too
3. Confirm the server is listening: `sudo ss -tlnp | grep 443`
4. Test from an external network with `telnet matrix.example.com 443`

### Well-known returns wrong address

```bash
curl https://example.com/.well-known/matrix/server
```

Should return `{"m.server": "matrix.example.com:443"}` (or your actual server address). If it returns wrong content or 404, see [Well-Known Delegation](/docs/api-endpoints/well-known-delegation).

### TLS errors during federation

Other servers will reject your TLS certificate if it is self-signed, expired, or covers the wrong domain. See [TLS Certificates](/docs/configuration/tls-certificates) for the full checklist.

### Asymmetric federation (you can reach others but they can't reach you)

Your outbound connections work but inbound are blocked. Check:

- Firewall INPUT chain (not just OUTPUT)
- Whether your public IP matches your DNS records
- Whether port forwarding is set up if you are behind a NAT
