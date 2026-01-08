import { useComputed, useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
import { fetchWithTrace } from "../lib/tracing.ts";

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
  const clientServerData = useSignal<unknown>(null);
  const wellKnownData = useSignal<unknown>(null);
  const supportData = useSignal<unknown>(null);
  const loadingClientServer = useSignal(true);
  const loadingWellKnown = useSignal(true);
  const loadingSupport = useSignal(true);

  // Computed signals for JSON stringification
  const wellKnownJSON = useComputed(() =>
    wellKnownData.value ? JSON.stringify(wellKnownData.value, null, 2) : ""
  );
  const clientServerJSON = useComputed(() =>
    clientServerData.value
      ? JSON.stringify(clientServerData.value, null, 2)
      : ""
  );
  const supportJSON = useComputed(() =>
    supportData.value ? JSON.stringify(supportData.value, null, 2) : ""
  );

  useEffect(() => {
    async function fetchWellKnownAndClientServer() {
      try {
        const versionsUrl = `https://${serverName}/.well-known/matrix/client`;
        const versionsResponse = await fetchWithTrace(versionsUrl);

        if (versionsResponse.ok) {
          const wellKnown: WellKnownResponse = await versionsResponse.json();
          wellKnownData.value = wellKnown;
          loadingWellKnown.value = false;

          // Try to fetch versions from discovered homeserver
          let homeserverBaseUrl = wellKnown["m.homeserver"]?.base_url;
          if (homeserverBaseUrl) {
            // Remove trailing slash from base URL to prevent double slashes
            homeserverBaseUrl = homeserverBaseUrl.replace(/\/$/, "");

            try {
              const versionsResp = await fetchWithTrace(
                `${homeserverBaseUrl}/_matrix/client/versions`,
              );
              if (versionsResp.ok) {
                const versions = await versionsResp.json();
                clientServerData.value = versions;
              }
            } catch (_e) {
              // Error fetching versions - don't set client server data
            }
          }
        }
      } catch (_e) {
        console.error("Error fetching client-server data:", _e);
      } finally {
        loadingWellKnown.value = false;
        loadingClientServer.value = false;
      }
    }

    async function fetchSupportData() {
      try {
        const supportUrl = `https://${serverName}/.well-known/matrix/support`;
        const supportResponse = await fetchWithTrace(supportUrl);

        if (supportResponse.ok) {
          const support: SupportResponse = await supportResponse.json();
          supportData.value = support;
        }
      } catch (_e) {
        console.error("Error fetching support data:", _e);
      } finally {
        loadingSupport.value = false;
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
          <pre class="govuk-body">
            <code>{JSON.stringify(federationData, null, 2)}</code>
          </pre>
        </div>
      </details>

      {/* Client-Server Well-Known */}
      <h3 class="govuk-heading-m">Client-Server Well-Known</h3>
      <p class="govuk-body">
        Response from <code>/.well-known/matrix/client</code>
      </p>
      {loadingWellKnown.value
        ? (
          <p class="govuk-body">
            <em>Loading well-known data...</em>
          </p>
        )
        : wellKnownData.value
        ? (
          <details class="govuk-details">
            <summary class="govuk-details__summary">
              <span class="govuk-details__summary-text">
                View Client Well-Known JSON
              </span>
            </summary>
            <div class="govuk-details__text">
              <pre class="govuk-body">
                <code>{wellKnownJSON}</code>
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
      {loadingClientServer.value
        ? (
          <p class="govuk-body">
            <em>Loading client-server API data...</em>
          </p>
        )
        : clientServerData.value
        ? (
          <details class="govuk-details">
            <summary class="govuk-details__summary">
              <span class="govuk-details__summary-text">
                View Client-Server API JSON
              </span>
            </summary>
            <div class="govuk-details__text">
              <pre class="govuk-body">
                <code>{clientServerJSON}</code>
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
      {loadingSupport.value
        ? (
          <p class="govuk-body">
            <em>Loading support data...</em>
          </p>
        )
        : supportData.value
        ? (
          <details class="govuk-details">
            <summary class="govuk-details__summary">
              <span class="govuk-details__summary-text">
                View Support Well-Known JSON
              </span>
            </summary>
            <div class="govuk-details__text">
              <pre class="govuk-body">
                <code>{supportJSON}</code>
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
