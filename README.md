# Matrix Connection Tester UI

A web-based tool to check if a Matrix server is reachable and federates correctly with the wider Matrix network.  
Inspired by [federationtester.matrix.org](https://federationtester.matrix.org/), this UI provides clear feedback on federation status, server software, and detailed debug information.

It requires <https://github.com/MTRNord/rust-federation-tester> as a backend API, which can be run locally or pointed to an existing compatible service.

---

## Features

- **Federation Check:** See if a Matrix server federates successfully.
- **Server Software Detection:** Identifies common Matrix server implementations and their maturity.
- **Debug Information:** View DNS, well-known, and connection reports.
- **Accessible UI:** Built with the [govuk design-system](https://design-system.service.gov.uk) for clarity and accessibility.
- **Raw API Output:** Inspect the full API response for troubleshooting.

---

## Quick Start

### 1. Run with Docker

```sh
docker run --rm -p 8080:80 ghcr.io/MTRNord/matrix-connection-tester-ui:latest
```

### 2. Build & Run Locally

```sh
git clone https://github.com/MTRNord/matrix-connection-tester-ui.git
cd matrix-connection-tester-ui
deno install
deno task dev
```

Then open <http://localhost:5173> in your browser.

---

## Usage

1. Enter the Matrix server name (e.g. `matrix.org`) in the input field.
2. Click **Go**.
3. View federation status, server software, and detailed debug info.

---

## API

This UI expects <https://github.com/MTRNord/rust-federation-tester> to be running as a backend API.

---

## Sentry Integration

This project includes Sentry error tracking for monitoring application health.

### Features

- **Self-hosted Instance**: Uses a self-hosted Sentry instance at `sentry.mtrnord.blog` (hosted in the EU)
- **Privacy-First**: Session replays mask all text and media, sensitive headers are filtered
- **Client & Server Tracking**: Captures errors on both client-side (browser) and server-side (SSR)
- **Breadcrumb Support**: Track user actions and application flow to help debug issues
- **Global Error Boundary**: Automatically catches and reports unhandled errors

### Setup

Sentry is automatically initialized when the environment variables are set. No user consent is required as this is not a third-party setup.

**Set environment variables**:

```sh
# Used for both client and server
export FRESH_PUBLIC_SENTRY_DSN="<your_sentry_dsn_here>"
export FRESH_PUBLIC_ENVIRONMENT="production"  # or "stage" for staging
```

**In CI/CD**: The `.env` file is automatically generated during the build process:

- `main` branch builds use `FRESH_PUBLIC_ENVIRONMENT=stage`
- Tagged releases (v\*) use `FRESH_PUBLIC_ENVIRONMENT=production`

---

## Docker

A prebuilt Docker image is available via [GitHub Container Registry (ghcr.io)](https://ghcr.io/):

```sh
docker pull ghcr.io/MTRNord/matrix-connection-tester-ui:latest
```

---

## Roadmap

- [x] Add Internationalization (i18n) support
- [x] Improve error handling and user feedback
- [ ] Add guides explaining common issues and how to resolve them
- [x] Implement a way to attach the server name as a query parameter to the URL
- [x] Add GDPR-compliant Sentry integration with analytics consent

---

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.  
See [LICENSE](./LICENSE) for details.

---

## Contributing

Contributions are welcome! Please open issues or pull requests on GitHub.

---

## Credits

- [Matrix Federation Tester](https://federationtester.matrix.org/)
