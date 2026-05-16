## What is Matrix Federation?

Federation is what makes Matrix a distributed network. When your server is federated, users on your server can chat with users on any other Matrix server — just like email lets you send from Gmail to Outlook. Without federation, your users can only talk to each other.

:::banner{kind="warn" title="This tester requires a publicly reachable server"}
This connectivity tester runs checks from the public internet. If your server is on a private network or behind a firewall without public access, the tests will fail even if your server works correctly within your network. A VPS with a public IP address is the most straightforward setup for a publicly federated server.
:::

## What you need before you start

| Requirement               | Why it's needed                                                                    |
| ------------------------- | ---------------------------------------------------------------------------------- |
| A domain name you control | Your users will have IDs like `@user:example.com` — this cannot change after setup |
| A valid TLS certificate   | Other servers reject connections from servers without a trusted certificate        |
| A public IP address       | Other servers need to be able to connect to you                                    |
| Port 443 accessible       | The recommended setup runs federation on the standard HTTPS port                   |

:::banner{kind="warn" title="Your server name is permanent"}
The domain you choose as your server name becomes part of every user ID and room ID forever. Once users start joining, changing it is not possible without effectively creating a new server. Choose carefully before going into production.
:::

## How other servers find you

When another Matrix server wants to send you a message, it needs to find your federation endpoint. It does this in order:

1. Fetches `https://example.com/.well-known/matrix/server` — if found and valid, uses the address in that file
2. Looks up a DNS SRV record `_matrix-fed._tcp.example.com` — if found, uses that
3. Falls back to connecting directly to `example.com:8448`

**The well-known method (step 1) is the recommended approach** because it works on any port, is easy to configure, and doesn't require DNS changes beyond basic A/AAAA records.

## Setup steps

### Step 1: Choose your server name

Your **server name** is the domain that appears in your users' Matrix IDs — for example, `@alice:example.com`. This is set in your homeserver configuration and is separate from where your server actually runs.

The most common setup is:

- **Server name:** `example.com` → users get `@alice:example.com`
- **Homeserver address:** `matrix.example.com` → where the actual software runs

These two are linked by [well-known delegation](/docs/api-endpoints/well-known-delegation). The well-known file at `https://example.com/.well-known/matrix/server` tells other servers to connect to `matrix.example.com` instead. This is why you can have clean short IDs (`@alice:example.com`) even though your server runs on a subdomain.

Alternatively, you can set the server name to `matrix.example.com` directly — this simplifies the configuration (no delegation needed) but users get longer IDs like `@alice:matrix.example.com`.

### Step 2: Obtain a TLS certificate

Use [Let's Encrypt](https://letsencrypt.org/) with Certbot for a free, automatically-renewing certificate:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d matrix.example.com
```

Or use Caddy, which handles certificates automatically with no extra steps.

See [TLS Certificates](/docs/configuration/tls-certificates) for full details.

### Step 3: Set up well-known delegation (recommended)

Create a file at `https://example.com/.well-known/matrix/server`:

```json
{
  "m.server": "matrix.example.com:443"
}
```

This tells other servers to connect to `matrix.example.com` on port 443 for federation.

**Nginx example** (on your base domain `example.com`):

```nginx
location /.well-known/matrix/server {
    default_type application/json;
    add_header Access-Control-Allow-Origin *;
    return 200 '{"m.server": "matrix.example.com:443"}';
}
```

**Caddy example**:

```caddy
example.com {
    header /.well-known/matrix/server Content-Type application/json
    header /.well-known/matrix/server Access-Control-Allow-Origin *
    respond /.well-known/matrix/server `{"m.server": "matrix.example.com:443"}` 200
}
```

See [Well-Known Delegation](/docs/api-endpoints/well-known-delegation) for the full guide including client discovery.

### Step 4: Configure your homeserver

Set your server name in your homeserver configuration.

**Synapse (`homeserver.yaml`)**:

```yaml
server_name: 'example.com'
```

**Continuwuity (`config.toml`)**:

```toml
[global]
server_name = "example.com"
```

### Step 5: Test your configuration

Use the [connectivity tester](/) to verify everything is working. Enter your domain and run the tests to check:

- Well-known discovery
- TLS certificate validity
- Federation endpoint reachability
- Client-server endpoint reachability

## Alternative: SRV record

:::banner{kind="warn" title="SRV records only affect federation"}
An SRV record tells other Matrix **servers** where to reach you. It does **not** help Matrix **clients** find your server — clients only use `.well-known/matrix/client` for discovery. If you use SRV-only delegation, clients will not be able to auto-discover your server; users will have to enter the homeserver address manually.

Well-known delegation, on the other hand, covers both federation and client discovery.
:::

If you cannot serve a well-known file on your domain (for example you don't control the web server on port 443 for the base domain), you can use a DNS SRV record instead.

:::banner{kind="info" title="Current SRV record format"}
The current SRV record name is `_matrix-fed._tcp` (registered with IANA since Matrix spec v1.8). The older `_matrix._tcp` format still works as a fallback but is deprecated and may be removed in a future spec version.
:::

Add this DNS record:

```
_matrix-fed._tcp.example.com.  3600  IN  SRV  10  0  8448  matrix.example.com.
```

This tells other servers to connect to `matrix.example.com` on port 8448. You will also need port 8448 open on your firewall.

## Alternative: Direct port 8448

If neither well-known nor SRV records are an option, servers will try connecting directly to `example.com:8448`. This is the least flexible approach — port 8448 is sometimes blocked by firewalls — and should only be used as a last resort.

## Troubleshooting

If federation isn't working after setup:

1. Run the [connectivity tester](/) — it will tell you which specific check is failing
2. Confirm your well-known file is reachable: `curl https://example.com/.well-known/matrix/server`
3. Check your TLS certificate is valid for the domain in the well-known file
4. Confirm port 443 (or 8448 if using SRV) is open to the internet
5. Check [Server Logs](/docs/troubleshooting/server-logs) for federation errors
