## What does the Connectivity Tester check?

When you run a Matrix homeserver, two things need to work for people to actually use it:

- **Federation** — other Matrix servers need to reach yours to deliver messages from their users into your rooms, and vice versa.
- **Client connections** — Matrix apps (Element, FluffyChat, Cinny, …) need to find and connect to your server so your users can log in.

This tool tests both from outside your network and tells you exactly which layer is broken and why.

## The three things that most commonly go wrong

Nearly every connectivity failure is caused by one of three problems:

1. **DNS or discovery is not set up.** Other servers can't find your server because the `.well-known` delegation file is missing or pointing to the wrong address.
2. **Reverse proxy or server is misconfigured.** Nginx or Caddy is running, but `/_matrix/…` requests are not forwarded correctly, or the homeserver itself is misconfigured. This is by far the most common cause of failures.
3. **TLS certificate is not trusted.** Your certificate was issued by an authority the broader internet doesn't trust (such as a self-signed certificate), or it has expired.

## How the test works

When you enter your domain on the [homepage](/) and press **Run Tests**, the tool goes through these checks in order:

:::card

### 1. DNS and well-known discovery

Looks up `/.well-known/matrix/server` (for federation) and `/.well-known/matrix/client` (for clients) on your domain. This tells the tool where your actual homeserver is running.

### 2. TLS certificate

Connects to the address from the well-known files and checks that the certificate is valid, trusted by major certificate authorities, and not expired.

### 3. Federation endpoint

Calls `/_matrix/federation/v1/version` to confirm your homeserver responds to server-to-server traffic.

### 4. Client-server endpoint

Calls `/_matrix/client/versions` to confirm Matrix clients can connect and to show which API versions your server supports.

:::

## Reading the results

The tool shows an overall verdict and per-check details:

| State   | Meaning                                                                                                                                                                                    |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| OK      | All checks passed with no issues.                                                                                                                                                          |
| Warning | Federation is responding, but something is off — for example, the well-known file returns different results from different IP addresses (split-brain), or some connections needed a retry. |
| Failed  | Federation checks failed. The **Problems** section below the verdict explains what went wrong.                                                                                             |
| N/A     | A specific check could not be completed — for example, the client-server API is not reachable.                                                                                             |

If you see a failure, follow the link in the error message to the relevant guide. If you are setting up for the first time, the [Federation Setup](/docs/getting-started/federation-setup) guide is the best place to start.

## Need help?

- Run the [connectivity tester](/) against your server and share the results
- Check your homeserver's logs for relevant errors — see [Server Logs](/docs/troubleshooting/server-logs)
- Read the [Troubleshooting Guide](/docs/troubleshooting/general) for common problems
- Ask in [#homeservers:matrix.org](https://matrix.to/#/#homeservers:matrix.org)
- Post on the [forum](https://forum.mtrnord.blog/c/matrix-connectivity-tester/support/6)
