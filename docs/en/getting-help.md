---
title: Getting Help
description: Where to find help and support for Matrix server administration
---

## Community Support

The Matrix community is friendly and helpful. If you're having issues with your server, there are several places to get help.

### Matrix Community Rooms

Join these Matrix rooms to ask questions and get support from the community:

| Room                                                                                 | Purpose                                                 |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| [#synapse:matrix.org](https://matrix.to/#/#synapse:matrix.org)                       | Support for Synapse homeserver users and administrators |
| [#continuwuity:continuwuity.org](https://matrix.to/#/#continuwuity:continuwuity.org) | Support for Continuwuity homeserver                     |
| [#matrix:matrix.org](https://matrix.to/#/#matrix:matrix.org)                         | General Matrix questions and discussion                 |
| [#matrix-spec:matrix.org](https://matrix.to/#/#matrix-spec:matrix.org)               | Questions about the Matrix specification                |
| [#thisweekinmatrix:matrix.org](https://matrix.to/#/#thisweekinmatrix:matrix.org)     | Weekly Matrix news and updates                          |

:::inset
**Tip:** When asking for help, include:

- Your Matrix server software and version
- Relevant error messages from logs
- What you've already tried
- Results from the connectivity tester (if applicable)
  :::

## Official Documentation

### Synapse

- [Synapse Documentation](https://element-hq.github.io/synapse/latest/) - Official documentation for Synapse homeserver
- [Synapse on GitHub](https://github.com/element-hq/synapse) - Source code and issue tracker
- [Synapse Installation Guide](https://element-hq.github.io/synapse/latest/setup/installation.html)

### Continuwuity

- [Continuwuity Website](https://continuwuity.org/) - Official Continuwuity documentation
- [Continuwuity Repository](https://forgejo.ellis.link/continuwuation/continuwuity) - Source code and documentation

### Matrix Specification

- [Matrix Specification](https://spec.matrix.org/) - Official protocol specification
- [Matrix.org](https://matrix.org/) - Information about the Matrix protocol

## Before Asking for Help

### Run the Connectivity Tester

Use this connection tester tool to diagnose issues with your server. It will check:

- Server accessibility
- TLS certificate validity
- `.well-known` delegation
- Federation connectivity
- DNS configuration

The test results can help you identify problems and provide valuable information when seeking help.

### Check Server Logs

Review your [server logs](/docs/server-logs) for error messages. Common issues often have clear error messages that can help diagnose the problem.

### Search for Similar Issues

Before asking for help:

1. Search the Matrix room history for similar problems
2. Check GitHub issues for your homeserver software
3. Review the official documentation for your specific issue

## How to Ask Effective Questions

### Provide Context

- **Server type and version**: "Synapse 1.96.0" or "Continuwuity latest"
- **Operating system**: "Ubuntu 22.04" or "Debian 12"
- **Reverse proxy**: "Nginx 1.24" or "Caddy 2.7"
- **When the problem started**: "After updating to version X" or "Fresh installation"

### Include Relevant Logs

Share the specific error messages from your logs, not the entire log file:

```bash
# Get recent errors from Synapse
sudo journalctl -u matrix-synapse -n 100 | grep -i error

# Get federation-related errors
sudo journalctl -u matrix-synapse | grep -i federation
```

:::warning
Logs may contain sensitive information like user IDs, IP addresses, or domain names. Review and redact sensitive data before sharing publicly.
:::

### Describe What You've Tried

Let others know what troubleshooting steps you've already taken:

- Configuration changes you've made
- Commands you've run
- Error messages you've received
- Documentation you've consulted

### Be Patient and Respectful

- Remember that community members volunteer their time
- Wait for responses - people are in different time zones
- Be respectful and appreciative of help offered
- Share your solution if you figure it out yourself

## Professional Support

### Synapse Commercial Support

- [Element Enterprise](https://element.io/enterprise) - Professional support for Synapse from the core development team

### Consulting Services

Many members of the Matrix community offer paid consulting services for:

- Server setup and configuration
- Performance optimization
- Custom integrations
- Migration assistance

Ask in [#synapse:matrix.org](https://matrix.to/#/#synapse:matrix.org) or [#matrix:matrix.org](https://matrix.to/#/#matrix:matrix.org) if you're looking for professional help.

## Report Bugs

If you've found a bug in the software:

### Synapse Bugs

- [Synapse GitHub Issues](https://github.com/element-hq/synapse/issues)
- Search existing issues first
- Provide reproduction steps and server information

### Continuwuity Bugs

- [Continuwuity Repository](https://forgejo.ellis.link/continuwuation/continuwuity/issues)
- Include version information and configuration details

### Connection Tester Bugs

If you find issues with this connection tester tool, please report them through the appropriate channel (check the tool's homepage for issue reporting).

## Contributing to Documentation

Found an error in these docs or want to improve them? Contributions are welcome! Check the project repository for contribution guidelines.

## Stay Updated

- Join [#thisweekinmatrix:matrix.org](https://matrix.to/#/#thisweekinmatrix:matrix.org) for weekly Matrix ecosystem updates
- Follow [Matrix.org blog](https://matrix.org/blog/) for announcements
- Check your homeserver's changelog for updates and security patches

## Emergency Support

### Security Issues

If you discover a security vulnerability:

- **Do not** post publicly
- Report to security contacts:
  - Synapse: [security@matrix.org](mailto:security@matrix.org)
  - Continuwuity: Check the project repository for security policy

### Server Compromise

If you believe your server has been compromised:

1. Immediately disconnect the server from the internet
2. Preserve logs for forensic analysis
3. Contact security experts
4. Do not ask for help in public rooms until the issue is resolved

## Additional Resources

- [Matrix Community](https://matrix.to/#/#community:matrix.org) - Central hub for Matrix community spaces
- [Awesome Matrix](https://github.com/jryans/awesome-matrix) - Curated list of Matrix resources
- [Matrix FAQ](https://matrix.org/faq/) - Frequently asked questions about Matrix
