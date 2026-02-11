import { useEffect, useMemo } from "preact/hooks";
import { useComputed } from "@preact/signals";
import { I18n, type Locale } from "../lib/i18n.ts";
import { ClientServerStatusPanel } from "../components/client-server-api/panel.tsx";
import {
  clientServerLoading,
  clientServerState,
  clientServerStatus,
  fetchClientServerInfo,
} from "../lib/client-server-state.ts";

interface ClientServerAPITasksProps {
  serverName: string;
  locale: Locale;
  unstableFeatures: Record<string, {
    title: string;
    description?: string;
    msc?: string;
  }>;
  baseUrl?: string;
}

export default function ClientServerApiTasks({
  serverName,
  locale,
  unstableFeatures,
}: ClientServerAPITasksProps) {
  const i18n = useMemo(() => new I18n(locale), [locale]);

  useEffect(() => {
    fetchClientServerInfo(serverName);
  }, [serverName]);

  // Computed signals for derived state
  const state = useComputed(() => clientServerState.value);
  const latestVersion = useComputed(() => {
    const versions = state.value.versions;
    return versions?.versions ? getLatestVersion(versions.versions) : null;
  });
  const enabledExperimentalFeatures = useComputed(() => {
    const versions = state.value.versions;
    return versions?.unstable_features
      ? Object.entries(versions.unstable_features)
        .filter(([_, enabled]) => enabled)
        .map(([feature, _]) => feature)
      : [];
  });

  if (clientServerLoading.value) {
    return (
      <div
        class="govuk-body loading-container"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <p>{i18n.t("results.loading")}</p>
      </div>
    );
  }

  // If there are hard errors (not warnings), show message pointing to Problems section
  const status = clientServerStatus.value;
  if (status === "error") {
    return (
      <div class="govuk-body">
        <p>{i18n.t("results.client_server_api_see_problems")}</p>
      </div>
    );
  }

  // For success or warning, show the info section
  const { clientWellKnown, discoveredEndpoint } = state.value;

  return (
    <>
      <ClientServerStatusPanel
        i18n={i18n}
        status={status}
      />

      <dl class="govuk-summary-list">
        {latestVersion.value && (
          <div class="govuk-summary-list__row">
            <dt class="govuk-summary-list__key">
              {i18n.t("results.client_server_api_latest_version")}
            </dt>
            <dd class="govuk-summary-list__value">
              {latestVersion}
            </dd>
          </div>
        )}
        {discoveredEndpoint && (
          <div class="govuk-summary-list__row">
            <dt class="govuk-summary-list__key">
              {i18n.t("results.client_server_api_endpoint")}
            </dt>
            <dd class="govuk-summary-list__value">
              {discoveredEndpoint}
            </dd>
          </div>
        )}
      </dl>

      {enabledExperimentalFeatures.value.length > 0 && (
        <div class="table-wrapper">
          <div class="table-scroll">
            <table class="govuk-table">
              <caption class="govuk-table__caption govuk-table__caption--m">
                {i18n.t("results.experimental_features_title")}
              </caption>
              <thead class="govuk-table__head">
                <tr class="govuk-table__row">
                  <th scope="col" class="govuk-table__header">
                    {i18n.t("results.experimental_features_feature")}
                  </th>
                  <th scope="col" class="govuk-table__header">
                    {i18n.t("results.experimental_features_description")}
                  </th>
                  <th scope="col" class="govuk-table__header">
                    {i18n.t("results.experimental_features_msc")}
                  </th>
                </tr>
              </thead>
              <tbody class="govuk-table__body">
                {enabledExperimentalFeatures.value.map((featureName) => {
                  const featureInfo = unstableFeatures[featureName];
                  if (!featureInfo) {
                    return (
                      <tr class="govuk-table__row">
                        <th scope="row" class="govuk-table__header">
                          <code aria-label="Feature flag name">
                            {featureName}
                          </code>
                        </th>
                        <td class="govuk-table__cell">
                          {i18n.t(
                            "results.experimental_features_no_description",
                          )}
                        </td>
                        <td class="govuk-table__cell">
                          {i18n.t("results.experimental_features_unknown")}
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr class="govuk-table__row">
                      <th scope="row" class="govuk-table__header">
                        {featureInfo.title}
                        <div class="govuk-hint">
                          <code aria-label="Feature flag name">
                            {featureName}
                          </code>
                        </div>
                      </th>
                      <td class="govuk-table__cell">
                        {featureInfo.description ||
                          i18n.t(
                            "results.experimental_features_no_description",
                          )}
                      </td>
                      <td class="govuk-table__cell">
                        {featureInfo.msc
                          ? (
                            <a
                              class="govuk-link"
                              href={`https://github.com/matrix-org/matrix-spec-proposals/pull/${
                                featureInfo.msc.replace("MSC", "")
                              }`}
                              rel="noopener noreferrer"
                            >
                              {featureInfo.msc}
                            </a>
                          )
                          : i18n.t("results.experimental_features_unknown")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {clientWellKnown && (
        <div class="table-wrapper table-wrapper-with-margin">
          <div class="table-scroll">
            <table class="govuk-table">
              <caption class="govuk-table__caption govuk-table__caption--m">
                {i18n.t("results.client_discovery_title")}
              </caption>
              <thead class="govuk-table__head">
                <tr class="govuk-table__row">
                  <th scope="col" class="govuk-table__header">
                    {i18n.t("results.client_discovery_property")}
                  </th>
                  <th scope="col" class="govuk-table__header">
                    {i18n.t("results.client_discovery_value")}
                  </th>
                </tr>
              </thead>
              <tbody class="govuk-table__body">
                {Object.entries(clientWellKnown).map(([key, value]) => (
                  <tr class="govuk-table__row">
                    <th scope="row" class="govuk-table__header">
                      <code>{key}</code>
                    </th>
                    <td class="govuk-table__cell">
                      {typeof value === "object" && value !== null
                        ? (
                          Object.prototype.hasOwnProperty.call(
                              value,
                              "base_url",
                            )
                            ? (value as { base_url: string }).base_url
                            : <code>{JSON.stringify(value, null, 2)}</code>
                        )
                        : String(value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

function getLatestVersion(versions: string[]): string {
  return versions.reduce((latest, current) => {
    // Handle r0.x.x versions
    const latestParts = latest.startsWith("r0")
      ? latest.slice(2).split(".").map(Number)
      : latest.slice(1).split(".").map(Number);

    const currentParts = current.startsWith("r0")
      ? current.slice(2).split(".").map(Number)
      : current.slice(1).split(".").map(Number);

    // v1.x comes after r0.x
    if (latest.startsWith("r0") && current.startsWith("v")) {
      return current;
    }
    if (latest.startsWith("v") && current.startsWith("r0")) {
      return latest;
    }

    // Compare version numbers
    for (
      let i = 0;
      i < Math.max(latestParts.length, currentParts.length);
      i++
    ) {
      const latestPart = latestParts[i] || 0;
      const currentPart = currentParts[i] || 0;

      if (currentPart > latestPart) {
        return current;
      } else if (currentPart < latestPart) {
        return latest;
      }
    }
    return latest;
  }, versions[0]);
}
