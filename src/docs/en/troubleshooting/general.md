## Overview

Start by running the [connectivity tester](/) against your server. It will identify which specific check is failing and give you a description of the problem. The sections below explain how to diagnose and fix the most common issues.

## Federation not working

### Other servers cannot find my server

**Symptoms:** Users on other servers cannot message your users. Rooms on other servers are not accessible.

**Check first:**

```bash
# Is your well-known file reachable?
curl https://example.com/.well-known/matrix/server

# Does it return valid JSON with an m.server field?
curl https://example.com/.well-known/matrix/server | jq .

# Can the federation endpoint be reached?
curl https://matrix.example.com/_matrix/federation/v1/version
```

**Common causes:**

- `.well-known/matrix/server` file missing or returning wrong content
- Reverse proxy not forwarding `/_matrix/federation/*` to your homeserver
- Port 443 (or 8448) not accessible from the internet
- TLS certificate doesn't match the domain in the well-known file

See [Federation Setup](/docs/getting-started/federation-setup) for the full setup guide.

### TLS certificate errors

**Symptoms:** Logs show `SSL verification failed` or `certificate verify failed` when federating with other servers.

**Check the certificate:**

```bash
openssl s_client -connect matrix.example.com:443 -servername matrix.example.com
```

**Common causes:**

- Expired certificate — renew with `sudo certbot renew`
- Self-signed certificate — obtain a Let's Encrypt certificate
- Certificate covers wrong domain — check it matches the address in your well-known file
- Using `cert.pem` instead of `fullchain.pem` — intermediate certificates missing

See [TLS Certificates](/docs/configuration/tls-certificates) for details.

### Federation works intermittently

**Symptoms:** Sometimes federation works, sometimes it doesn't.

**Common causes:**

- Your domain resolves to multiple IP addresses but not all of them point to your server (DNS misconfiguration)
- Well-known file returns different content from different servers (stale cache, CDN issues)
- Rate limiting blocking some remote servers

Run the connectivity tester multiple times. If you get inconsistent results, check your DNS records and make sure all IPs resolve to the same server.

## Client connection issues

### Clients cannot find the homeserver

**Symptoms:** Matrix apps say "homeserver not found" or cannot auto-discover your server.

**Check the client well-known file:**

```bash
curl https://example.com/.well-known/matrix/client
```

It should return valid JSON with the `m.homeserver.base_url` field. If it's missing or malformed, clients cannot auto-discover your server — users have to enter the full address manually.

See [Well-Known Delegation](/docs/api-endpoints/well-known-delegation) for setup.

### CORS errors in browser clients

**Symptoms:** Browser console shows CORS errors. Element Web or similar clients fail.

**Check CORS headers:**

```bash
curl -I https://matrix.example.com/_matrix/client/versions
```

The response must include `Access-Control-Allow-Origin: *`. See [CORS Configuration](/docs/configuration/cors) for setup.

## DNS issues

### Domain doesn't resolve

```bash
# Check A record
dig +short example.com

# Check from an external DNS server
dig @8.8.8.8 example.com

# Check for any SRV records
dig +short _matrix-fed._tcp.example.com SRV
```

If DNS records were recently changed, allow 24–48 hours for propagation.

### Port not accessible

**Symptoms:** Connection timeouts when trying to reach the server.

**Check from your server:**

```bash
sudo ss -tlnp | grep -E '(443|8448|8008)'
```

**Test from an external machine:**

```bash
telnet example.com 443
```

Check that your firewall allows incoming connections on port 443 (or 8448 if using SRV delegation).

## Performance issues

### Server responding slowly

If the connectivity tester succeeds but reports slow response times:

1. Check server resource usage: `htop` or `top`
2. Review [Server Logs](/docs/troubleshooting/server-logs) for errors or warnings
3. See [Performance](/docs/troubleshooting/performance) for optimization guidance

## Getting more help

If you can't resolve the issue with the above steps:

1. Note the results from the connectivity tester
2. Gather relevant log excerpts (see [Server Logs](/docs/troubleshooting/server-logs))
3. Ask in [#homeservers:matrix.org](https://matrix.to/#/#homeservers:matrix.org) or the relevant homeserver support room
4. See [Getting Help](/docs/getting-started/getting-help) for all support resources
