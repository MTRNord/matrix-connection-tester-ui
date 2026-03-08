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

## Configuration

The UI reads `static/config.json` at runtime. Copy `static/config.json.example` to `static/config.json` and adjust as needed.

| Key | Default | Description |
|-----|---------|-------------|
| `api_server_url` | `"http://localhost:8080"` | Base URL of the backend API server. |
| `oauth2_client_id` | `"federation-tester-frontend"` | OAuth2 client ID registered with the backend. Only relevant when the backend has `oauth2.enabled = true`. |
| `allow_http` | `false` | When `true`, the client-server API prober falls back to plain `http://` if the `https://` probe fails. HTTPS is required by the Matrix spec; only enable this for **intranet or lab deployments** where the target server does not have a valid TLS certificate. |

---

## API

This UI expects <https://github.com/MTRNord/rust-federation-tester> to be running as a backend API.

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
