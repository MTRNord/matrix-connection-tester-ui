import { useEffect, useState } from "preact/hooks";

interface RawDataSectionProps {
  serverName: string;
  locale: string;
  federationData: unknown;
}

interface WellKnownResponse {
  "m.server"?: string;
  "m.homeserver"?: {
    base_url: string;
  };
}

interface SupportResponse {
  contacts?: Array<{
    role: string;
    email_address?: string;
    matrix_id?: string;
  }>;
  support_page?: string;
}

export default function RawDataSection(props: RawDataSectionProps) {
  const { serverName, federationData } = props;
  const [clientServerData, setClientServerData] = useState<unknown>(null);
  const [wellKnownData, setWellKnownData] = useState<unknown>(null);
  const [supportData, setSupportData] = useState<unknown>(null);
  const [loadingClientServer, setLoadingClientServer] = useState(true);
  const [loadingWellKnown, setLoadingWellKnown] = useState(true);
  const [loadingSupport, setLoadingSupport] = useState(true);

  useEffect(() => {
    async function fetchWellKnownAndClientServer() {
      try {
        const versionsUrl = `https://${serverName}/.well-known/matrix/client`;
        const versionsResponse = await fetch(versionsUrl);

        if (versionsResponse.ok) {
          const wellKnown: WellKnownResponse = await versionsResponse.json();
          setWellKnownData(wellKnown);
          setLoadingWellKnown(false);

          // Try to fetch versions from discovered homeserver
          let homeserverBaseUrl = wellKnown["m.homeserver"]?.base_url;
          if (homeserverBaseUrl) {
            // Remove trailing slash from base URL to prevent double slashes
            homeserverBaseUrl = homeserverBaseUrl.replace(/\/$/, "");

            try {
              const versionsResp = await fetch(
                `${homeserverBaseUrl}/_matrix/client/versions`,
              );
              if (versionsResp.ok) {
                const versions = await versionsResp.json();
                setClientServerData(versions);
              }
            } catch (_e) {
              // Error fetching versions - don't set client server data
            }
          }
        }
      } catch (_e) {
        console.error("Error fetching client-server data:", _e);
      } finally {
        setLoadingWellKnown(false);
        setLoadingClientServer(false);
      }
    }

    async function fetchSupportData() {
      try {
        const supportUrl = `https://${serverName}/.well-known/matrix/support`;
        const supportResponse = await fetch(supportUrl);

        if (supportResponse.ok) {
          const support: SupportResponse = await supportResponse.json();
          setSupportData(support);
        }
      } catch (_e) {
        console.error("Error fetching support data:", _e);
      } finally {
        setLoadingSupport(false);
      }
    }

    fetchWellKnownAndClientServer();
    fetchSupportData();
  }, [serverName]);

  return (
    <div class="govuk-body">
      <div class="govuk-inset-text">
        Below are the raw JSON responses from the various API endpoints tested.
        These can be useful for debugging or for integration with other tools.
      </div>

      {/* Federation API Response */}
      <h3 class="govuk-heading-m">Federation API Response</h3>
      <p class="govuk-body">
        This is the complete response from the federation testing API endpoint.
      </p>
      <details class="govuk-details">
        <summary class="govuk-details__summary">
          <span class="govuk-details__summary-text">
            View Federation API JSON
          </span>
        </summary>
        <div class="govuk-details__text">
          <pre class="govuk-body raw-data-pre">
            <code>{JSON.stringify(federationData, null, 2)}</code>
          </pre>
        </div>
      </details>

      {/* Client-Server Well-Known */}
      <h3 class="govuk-heading-m">Client-Server Well-Known</h3>
      <p class="govuk-body">
        Response from <code>/.well-known/matrix/client</code>
      </p>
      {loadingWellKnown
        ? (
          <p class="govuk-body">
            <em>Loading well-known data...</em>
          </p>
        )
        : wellKnownData
        ? (
          <details class="govuk-details">
            <summary class="govuk-details__summary">
              <span class="govuk-details__summary-text">
                View Client Well-Known JSON
              </span>
            </summary>
            <div class="govuk-details__text">
              <pre class="govuk-body raw-data-pre">
                <code>{JSON.stringify(wellKnownData, null, 2)}</code>
              </pre>
            </div>
          </details>
        )
        : (
          <p class="govuk-body">
            <em>No well-known data available.</em>
          </p>
        )}

      {/* Client-Server API Versions */}
      <h3 class="govuk-heading-m">Client-Server API Versions</h3>
      <p class="govuk-body">
        Response from <code>/_matrix/client/versions</code>
      </p>
      {loadingClientServer
        ? (
          <p class="govuk-body">
            <em>Loading client-server API data...</em>
          </p>
        )
        : clientServerData
        ? (
          <details class="govuk-details">
            <summary class="govuk-details__summary">
              <span class="govuk-details__summary-text">
                View Client-Server API JSON
              </span>
            </summary>
            <div class="govuk-details__text">
              <pre class="govuk-body raw-data-pre">
                <code>{JSON.stringify(clientServerData, null, 2)}</code>
              </pre>
            </div>
          </details>
        )
        : (
          <p class="govuk-body">
            <em>No client-server API data available.</em>
          </p>
        )}

      {/* Support Well-Known */}
      <h3 class="govuk-heading-m">Support Well-Known</h3>
      <p class="govuk-body">
        Response from <code>/.well-known/matrix/support</code>
      </p>
      {loadingSupport
        ? (
          <p class="govuk-body">
            <em>Loading support data...</em>
          </p>
        )
        : supportData
        ? (
          <details class="govuk-details">
            <summary class="govuk-details__summary">
              <span class="govuk-details__summary-text">
                View Support Well-Known JSON
              </span>
            </summary>
            <div class="govuk-details__text">
              <pre class="govuk-body raw-data-pre">
                <code>{JSON.stringify(supportData, null, 2)}</code>
              </pre>
            </div>
          </details>
        )
        : (
          <p class="govuk-body">
            <em>No support data available.</em>
          </p>
        )}
    </div>
  );
}
