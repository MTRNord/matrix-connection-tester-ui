import { useEffect, useMemo } from "preact/hooks";
import { useComputed } from "@preact/signals";
import { I18n, type Locale } from "../lib/i18n.ts";
import {
  clientServerLoading,
  clientServerState,
  fetchClientServerInfo,
  msc3266SupportedResult,
  rtcTransportsEndpointUrl,
  rtcTransportsResult,
} from "../lib/client-server-state.ts";

interface MatrixRtcTasksProps {
  serverName: string;
  locale: Locale;
}

export default function MatrixRtcTasks({
  serverName,
  locale,
}: MatrixRtcTasksProps) {
  const i18n = useMemo(() => new I18n(locale), [locale]);

  useEffect(() => {
    fetchClientServerInfo(serverName);
  }, [serverName]);

  const state = useComputed(() => clientServerState.value);
  const rtcTransports = useComputed(() => rtcTransportsResult.value);
  const rtcEndpoint = useComputed(() => rtcTransportsEndpointUrl.value);
  const msc3266Supported = useComputed(() => msc3266SupportedResult.value);

  // MSC4143 defines no unstable_features flag.
  // Detection: /rtc/transports endpoint OR legacy org.matrix.msc4143.* well-known keys.
  const hasTransportsEndpoint = useComputed(() => rtcTransports.value !== null);

  // Legacy focus configuration via /.well-known/matrix/client.
  // Not part of MSC4143 spec but widely used by servers like call.ems.host.
  const legacyFoci = useComputed(() => {
    const wk = state.value.clientWellKnown;
    if (!wk) return [];
    return Object.entries(wk)
      .filter(([key]) =>
        key.startsWith("org.matrix.msc4143.") || key.startsWith("m.rtc.")
      )
      .map(([key, value]) => ({ key, value }));
  });

  const hasLegacyFoci = useComputed(() => legacyFoci.value.length > 0);

  const hasFocusConfigured = useComputed(() =>
    hasTransportsEndpoint.value || hasLegacyFoci.value
  );

  // MSC4140 (delayed events) — still unstable, check the feature flag
  const hasMsc4140 = useComputed(() => {
    const features = state.value.versions?.unstable_features;
    return !!(features?.["org.matrix.msc4140"] === true);
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

  const featureTag = (enabled: boolean) => (
    <strong
      class={`govuk-tag ${enabled ? "govuk-tag--green" : "govuk-tag--grey"}`}
    >
      {enabled
        ? i18n.t("matrixrtc.supported")
        : i18n.t("matrixrtc.not_supported")}
    </strong>
  );

  const triStateTag = (supported: boolean | null) => {
    if (supported === null) {
      return (
        <strong class="govuk-tag govuk-tag--blue">
          {i18n.t("matrixrtc.unknown")}
        </strong>
      );
    }
    return featureTag(supported);
  };

  const StatusPanel = () => {
    if (hasFocusConfigured.value) {
      return (
        <div
          class="govuk-panel govuk-panel--confirmation"
          role="status"
          aria-live="polite"
        >
          <h2 class="govuk-panel__title">
            {i18n.t("matrixrtc.status_ready_title")}
          </h2>
          <div class="govuk-panel__body">
            {i18n.t("matrixrtc.status_ready_message")}
          </div>
        </div>
      );
    }

    return (
      <div
        class="govuk-notification-banner"
        role="region"
        aria-labelledby="matrixrtc-banner-title"
        data-module="govuk-notification-banner"
      >
        <div class="govuk-notification-banner__header">
          <h2
            class="govuk-notification-banner__title"
            id="matrixrtc-banner-title"
          >
            {i18n.t("matrixrtc.status_not_configured_title")}
          </h2>
        </div>
        <div class="govuk-notification-banner__content">
          <p class="govuk-body">
            {i18n.t("matrixrtc.status_not_configured_message")}
          </p>
        </div>
      </div>
    );
  };

  return (
    <>
      <p class="govuk-body">{i18n.t("matrixrtc.intro")}</p>

      <StatusPanel />

      <dl class="govuk-summary-list govuk-!-margin-top-4">
        {/* MSC4143: supported if the transports endpoint works OR legacy foci are present */}
        <div class="govuk-summary-list__row">
          <dt class="govuk-summary-list__key">
            <a
              class="govuk-link"
              href="https://github.com/matrix-org/matrix-spec-proposals/pull/4143"
              rel="noopener noreferrer"
            >
              MSC4143
            </a>{" "}
            {i18n.t("matrixrtc.msc4143_label")}
          </dt>
          <dd class="govuk-summary-list__value">
            {featureTag(hasFocusConfigured.value)}
          </dd>
        </div>

        {/* Transports endpoint — the spec-defined detection mechanism */}
        <div class="govuk-summary-list__row">
          <dt class="govuk-summary-list__key">
            {i18n.t("matrixrtc.rtc_transports_label")}
            <div class="govuk-hint">
              <code>/_matrix/client/v1/rtc/transports</code>
            </div>
          </dt>
          <dd class="govuk-summary-list__value">
            {rtcTransports.value
              ? (
                <>
                  <strong class="govuk-tag govuk-tag--green">
                    {i18n.t("matrixrtc.supported")}
                  </strong>
                  {rtcTransports.value.rtc_transports.length > 0 && (
                    <ul class="govuk-list govuk-list--bullet govuk-!-margin-top-2">
                      {rtcTransports.value.rtc_transports.map((t, i) => (
                        <li key={i}>
                          <code>{t.type}</code>
                        </li>
                      ))}
                    </ul>
                  )}
                  {rtcEndpoint.value && (
                    <div class="govuk-hint govuk-!-margin-top-1">
                      {i18n.t("matrixrtc.rtc_endpoint_label")}:{" "}
                      <code>{rtcEndpoint.value}</code>
                    </div>
                  )}
                </>
              )
              : (
                <strong class="govuk-tag govuk-tag--grey">
                  {i18n.t("matrixrtc.not_supported")}
                </strong>
              )}
          </dd>
        </div>

        {/* Legacy foci in /.well-known/matrix/client */}
        <div class="govuk-summary-list__row">
          <dt class="govuk-summary-list__key">
            {i18n.t("matrixrtc.foci_wellknown_label")}
            <div class="govuk-hint">
              <code>org.matrix.msc4143.*</code>{" "}
              {i18n.t("matrixrtc.foci_wellknown_hint")}
            </div>
          </dt>
          <dd class="govuk-summary-list__value">
            {hasLegacyFoci.value
              ? (
                <>
                  <strong class="govuk-tag govuk-tag--green">
                    {i18n.t("matrixrtc.configured")}
                  </strong>
                  <ul class="govuk-list govuk-!-margin-top-2">
                    {legacyFoci.value.map(({ key, value }) => (
                      <li>
                        <details class="govuk-details govuk-!-margin-bottom-1">
                          <summary class="govuk-details__summary">
                            <span class="govuk-details__summary-text">
                              <code>{key}</code>
                            </span>
                          </summary>
                          <div class="govuk-details__text">
                            <pre
                              class="govuk-body govuk-!-font-size-16"
                              style={{ margin: 0 }}
                            >
                              <code>{JSON.stringify(value, null, 2)}</code>
                            </pre>
                          </div>
                        </details>
                      </li>
                    ))}
                  </ul>
                </>
              )
              : (
                <strong class="govuk-tag govuk-tag--grey">
                  {i18n.t("matrixrtc.not_configured")}
                </strong>
              )}
          </dd>
        </div>

        {/* MSC4140 (delayed events) — still unstable */}
        <div class="govuk-summary-list__row">
          <dt class="govuk-summary-list__key">
            <a
              class="govuk-link"
              href="https://github.com/matrix-org/matrix-spec-proposals/pull/4140"
              rel="noopener noreferrer"
            >
              MSC4140
            </a>{" "}
            {i18n.t("matrixrtc.msc4140_label")}
          </dt>
          <dd class="govuk-summary-list__value">
            {featureTag(hasMsc4140.value)}
          </dd>
        </div>

        {/* MSC3266 (room summaries) — stable since v1.15, probed via endpoint */}
        <div class="govuk-summary-list__row">
          <dt class="govuk-summary-list__key">
            <a
              class="govuk-link"
              href="https://github.com/matrix-org/matrix-spec-proposals/pull/3266"
              rel="noopener noreferrer"
            >
              MSC3266
            </a>{" "}
            {i18n.t("matrixrtc.msc3266_label")}
          </dt>
          <dd class="govuk-summary-list__value">
            {triStateTag(msc3266Supported.value)}
          </dd>
        </div>
      </dl>
    </>
  );
}
