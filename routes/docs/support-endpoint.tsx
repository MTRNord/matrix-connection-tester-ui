import { define } from "../../utils.ts";
import DocsLayout from "../../components/docs/DocsLayout.tsx";
import CodeBlock from "../../components/CodeBlock.tsx";

export default define.page(function SupportEndpoint(ctx) {
  const { i18n } = ctx.state;
  const currentPath = ctx.url.pathname;

  return (
    <DocsLayout
      currentPath={currentPath}
      i18n={i18n}
      title={i18n.tString("docs.support_endpoint.title")}
      description={i18n.tString("docs.support_endpoint.description")}
    >
      <h2 class="govuk-heading-l">Overview</h2>
      <p class="govuk-body">
        The Matrix support endpoint provides contact information for your
        server, allowing users and administrators to find help and report
        issues. This endpoint is defined in{" "}
        <a
          href="https://spec.matrix.org/v1.16/client-server-api/#getwell-knownmatrixsupport"
          class="govuk-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          MSC1929
        </a>{" "}
        and serves standardized contact information.
      </p>

      <div class="govuk-inset-text">
        <strong>Technical Reference:</strong>{" "}
        For complete technical specifications, see the{" "}
        <a
          href="https://spec.matrix.org/v1.16/client-server-api/#getwell-knownmatrixsupport"
          class="govuk-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          Matrix Specification - Support Endpoint
        </a>
      </div>

      <h2 class="govuk-heading-l">Setting Up the Support Endpoint</h2>

      <h3 class="govuk-heading-m">1. Create the Support File</h3>
      <p class="govuk-body">
        Create a file at{" "}
        <code class="code-inline">.well-known/matrix/support</code>{" "}
        on your server with the following JSON structure:
      </p>

      <CodeBlock language="json">
        {`{
  "contacts": [
    {
      "matrix_id": "@admin:example.com",
      "email_address": "admin@example.com",
      "role": "m.role.admin"
    }
  ],
  "support_page": "https://example.com/support"
}`}
      </CodeBlock>

      <details class="govuk-details">
        <summary class="govuk-details__summary">
          <span class="govuk-details__summary-text">
            Available fields explained
          </span>
        </summary>
        <div class="govuk-details__text">
          <dl class="govuk-summary-list">
            <div class="govuk-summary-list__row">
              <dt class="govuk-summary-list__key">
                <code class="code-inline">contacts</code>
              </dt>
              <dd class="govuk-summary-list__value">
                An array of contact objects. Each contact can include a Matrix
                ID, email address, and role.
              </dd>
            </div>
            <div class="govuk-summary-list__row">
              <dt class="govuk-summary-list__key">
                <code class="code-inline">role</code>
              </dt>
              <dd class="govuk-summary-list__value">
                Typically <code class="code-inline">m.role.admin</code> or{" "}
                <code class="code-inline">m.role.security</code>
              </dd>
            </div>
            <div class="govuk-summary-list__row">
              <dt class="govuk-summary-list__key">
                <code class="code-inline">support_page</code>
              </dt>
              <dd class="govuk-summary-list__value">
                Optional URL to a support or help page for your server
              </dd>
            </div>
          </dl>
        </div>
      </details>

      <h3 class="govuk-heading-m">2. Configure CORS Headers</h3>
      <p class="govuk-body">
        The support endpoint must be accessible via cross-origin requests.
        Configure your web server to send appropriate CORS headers.
      </p>

      <div
        class="govuk-warning-text"
        style="margin-top: 20px; margin-bottom: 30px;"
      >
        <span class="govuk-warning-text__icon" aria-hidden="true">!</span>
        <strong class="govuk-warning-text__text">
          <span class="govuk-visually-hidden">Warning</span>
          CORS headers are required for the support endpoint to work correctly
          with web-based Matrix clients.
        </strong>
      </div>

      <h4 class="govuk-heading-s">Nginx Configuration</h4>
      <p class="govuk-body">
        Add the following to your Nginx configuration:
      </p>

      <CodeBlock language="nginx">
        {`location /.well-known/matrix/support {
    default_type application/json;
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, OPTIONS";
    add_header Access-Control-Allow-Headers "Content-Type";

    # Handle preflight requests
    if ($request_method = 'OPTIONS') {
        return 204;
    }
}`}
      </CodeBlock>

      <h4 class="govuk-heading-s">Caddy Configuration</h4>
      <p class="govuk-body">
        Add the following to your Caddyfile:
      </p>

      <CodeBlock language="caddy">
        {`handle /.well-known/matrix/support {
    header Access-Control-Allow-Origin *
    header Access-Control-Allow-Methods "GET, OPTIONS"
    header Access-Control-Allow-Headers "Content-Type"
    header Content-Type application/json
    respond 200
}`}
      </CodeBlock>

      <h2 class="govuk-heading-l">
        Alternative: Server-Specific Configuration
      </h2>

      <p class="govuk-body">
        Some Matrix server implementations provide built-in support endpoint
        configuration, eliminating the need for manual file creation and web
        server configuration.
      </p>

      <h3 class="govuk-heading-m">Conduwuit Server</h3>
      <p class="govuk-body">
        If you're using Conduwuit, you can configure the support endpoint
        directly in your <code class="code-inline">conduwuit.toml</code>{" "}
        configuration file:
      </p>

      <CodeBlock language="toml">
        {`[global.well_known]

# URL to a support page for the server, which will be served as part of
# the MSC1929 server support endpoint at /.well-known/matrix/support.
# Will be included alongside any contact information
#
#support_page = "https://example.com/support"

# Role string for server support contacts, to be served as part of the
# MSC1929 server support endpoint at /.well-known/matrix/support.
#
#support_role = "m.role.admin"

# Email address for server support contacts, to be served as part of the
# MSC1929 server support endpoint.
# This will be used along with support_mxid if specified.
#
#support_email = "admin@example.com"

# Matrix ID for server support contacts, to be served as part of the
# MSC1929 server support endpoint.
# This will be used along with support_email if specified.
#
# If no email or mxid is specified, all of the server's admins will be
# listed.
#
#support_mxid = "@admin:example.com"`}
      </CodeBlock>

      <p class="govuk-body">
        Uncomment and configure the relevant fields. Conduwuit will
        automatically serve this information at the correct endpoint.
      </p>

      <div class="govuk-inset-text">
        <strong>Note:</strong>{" "}
        If you configure the support endpoint in Conduwuit, you don't need to
        create a separate{" "}
        <code class="code-inline">.well-known/matrix/support</code>{" "}
        file or configure CORS separately—the server handles this automatically.
      </div>

      <h2 class="govuk-heading-l">Testing Your Configuration</h2>
      <p class="govuk-body">
        After setting up your support endpoint, test it by visiting:
      </p>
      <p class="govuk-body">
        <code class="code-inline">
          https://your-domain.com/.well-known/matrix/support
        </code>
      </p>

      <p class="govuk-body">You should see a JSON response like:</p>

      <CodeBlock language="json">
        {`{
  "contacts": [
    {
      "matrix_id": "@admin:example.com",
      "email_address": "admin@example.com",
      "role": "m.role.admin"
    }
  ],
  "support_page": "https://example.com/support"
}`}
      </CodeBlock>

      <p class="govuk-body">
        You can also use the Matrix Connection Tester to verify your
        configuration is working correctly.
      </p>

      <h2 class="govuk-heading-l">Common Issues</h2>

      <details class="govuk-details">
        <summary class="govuk-details__summary">
          <span class="govuk-details__summary-text">
            CORS errors in browser console
          </span>
        </summary>
        <div class="govuk-details__text">
          <p class="govuk-body">
            If you see CORS errors, ensure your web server is configured to send
            the correct CORS headers. Check that:
          </p>
          <ul class="govuk-list govuk-list--bullet">
            <li>
              The <code class="code-inline">Access-Control-Allow-Origin</code>
              {" "}
              header is set to <code class="code-inline">*</code>
            </li>
            <li>
              Your server responds to <code class="code-inline">OPTIONS</code>
              {" "}
              requests (preflight)
            </li>
            <li>
              The <code class="code-inline">Content-Type</code> header is set to
              {" "}
              <code class="code-inline">application/json</code>
            </li>
          </ul>
          <p class="govuk-body">
            See the{" "}
            <a href="/docs/cors-configuration" class="govuk-link">
              CORS Configuration
            </a>{" "}
            documentation for more details.
          </p>
        </div>
      </details>

      <details class="govuk-details">
        <summary class="govuk-details__summary">
          <span class="govuk-details__summary-text">
            404 Not Found error
          </span>
        </summary>
        <div class="govuk-details__text">
          <p class="govuk-body">
            Make sure the file exists at the correct location and your web
            server is configured to serve files from the{" "}
            <code class="code-inline">.well-known</code> directory.
          </p>
        </div>
      </details>

      <details class="govuk-details">
        <summary class="govuk-details__summary">
          <span class="govuk-details__summary-text">
            Invalid JSON error
          </span>
        </summary>
        <div class="govuk-details__text">
          <p class="govuk-body">
            Validate your JSON using a local tool like{" "}
            <code class="code-inline">jq</code>:
          </p>
          <CodeBlock language="bash">
            {`jq . .well-known/matrix/support`}
          </CodeBlock>
          <p class="govuk-body">
            Common issues include:
          </p>
          <ul class="govuk-list govuk-list--bullet">
            <li>Missing or extra commas</li>
            <li>Unquoted keys or values</li>
            <li>Trailing commas in objects or arrays</li>
          </ul>
        </div>
      </details>

      <h2 class="govuk-heading-l">Related Documentation</h2>
      <ul class="govuk-list">
        <li>
          <a href="/docs/cors-configuration" class="govuk-link">
            CORS Configuration Guide
          </a>
        </li>
        <li>
          <a href="/docs/wellknown-delegation" class="govuk-link">
            Well-Known Delegation
          </a>
        </li>
        <li>
          <a href="/docs/troubleshooting" class="govuk-link">
            Troubleshooting Guide
          </a>
        </li>
        <li>
          <a
            href="https://spec.matrix.org/v1.16/client-server-api/#getwell-knownmatrixsupport"
            class="govuk-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            Matrix Specification - Support Endpoint
          </a>
        </li>
      </ul>
    </DocsLayout>
  );
});
