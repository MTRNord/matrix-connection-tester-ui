import { I18n } from "../../lib/i18n.ts";
import { APIResponseType } from "../../routes/results.tsx";

export function ServerResolutionResultsSection(props: {
  i18n: I18n;
  apiData: APIResponseType;
}) {
  const { i18n } = props;

  const srv_records = props.apiData.DNSResult.SrvTargets;
  const srv_wellknown_results = props.apiData.WellKnownResult;

  // Check if there's any data to display
  const hasSrvRecords = srv_records && Object.keys(srv_records).length > 0;
  const hasWellKnownResults = srv_wellknown_results &&
    Object.keys(srv_wellknown_results).length > 0;

  // If no data available, show message
  if (!hasSrvRecords && !hasWellKnownResults) {
    return (
      <p class="govuk-body">
        {i18n.t("server-resolution.no_data")}
      </p>
    );
  }

  // Detect a split-brain: the well-known results are inconsistent across IPs.
  // This happens when some IPs return a different m.server than others, or when
  // some IPs succeed and others fail.  We only flag this if there are at least
  // two IPs to compare.
  let isSplitBrain = false;
  if (hasWellKnownResults) {
    const entries = Object.values(srv_wellknown_results!);
    if (entries.length > 1) {
      // Normalise each IP's outcome to a single comparable string:
      // use the m.server value on success, or a sentinel on error.
      const outcomes = entries.map((r) =>
        r.Error?.Error ? "__error__" : (r["m.server"] ?? "__empty__")
      );
      isSplitBrain = outcomes.some((o) => o !== outcomes[0]);
    }
  }

  // Only show the ConnectionAddresses column when there is a split-brain,
  // because in the normal case (all IPs agree) it would just repeat the same
  // information for every row and add noise.
  const showConnectionAddresses = isSplitBrain;

  return (
    <>
      {hasSrvRecords && (
        <>
          <p class="govuk-body">
            {i18n.t("server-resolution.srv_found_description")}{" "}
            <code>/.well-known/matrix/server</code>{" "}
            {i18n.t("server-resolution.srv_found_description_suffix")}
          </p>

          <div class="table-wrapper">
            <div class="table-scroll">
              <table class="govuk-table">
                <caption class="govuk-table__caption govuk-table__caption--m">
                  {i18n.t("server-resolution.srv_records_caption")}
                </caption>
                <thead class="govuk-table__head">
                  <tr class="govuk-table__row">
                    <th scope="col" class="govuk-table__header">
                      {i18n.t("server-resolution.target_column")}
                    </th>
                    <th scope="col" class="govuk-table__header">
                      {i18n.t("server-resolution.port_column")}
                    </th>
                    <th scope="col" class="govuk-table__header">
                      {i18n.t("server-resolution.priority_column")}
                    </th>
                    <th scope="col" class="govuk-table__header">
                      {i18n.t("server-resolution.weight_column")}
                    </th>
                    <th scope="col" class="govuk-table__header">
                      {i18n.t("server-resolution.addresses_column")}
                    </th>
                    <th scope="col" class="govuk-table__header">
                      {i18n.t("server-resolution.status_column")}
                    </th>
                  </tr>
                </thead>
                <tbody class="govuk-table__body">
                  {Object.entries(srv_records).map(([target, records]) =>
                    records.map((record) => (
                      <tr class="govuk-table__row">
                        <td class="govuk-table__cell">
                          {target}
                        </td>
                        <td class="govuk-table__cell">
                          {record.Port}
                        </td>
                        <td class="govuk-table__cell">
                          {record.Priority}
                        </td>
                        <td class="govuk-table__cell">
                          {record.Weight}
                        </td>
                        <td class="govuk-table__cell">
                          {record.Addrs && record.Addrs.length > 0
                            ? (
                              <ul class="govuk-list">
                                {record.Addrs.map((addr) => (
                                  <li>
                                    <code>{addr}</code>
                                  </li>
                                ))}
                              </ul>
                            )
                            : <span class="govuk-hint">—</span>}
                        </td>
                        <td class="govuk-table__cell">
                          {/* TODO Fix */}
                          OK
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {hasWellKnownResults && (
        <>
          {
            /* Warn the user prominently if the well-known results are inconsistent
              across IPs — this is a split-brain and means the server behaves
              differently depending on which IP a connecting server happens to
              reach, which will cause intermittent federation failures. */
          }
          {isSplitBrain && (
            <div
              class="govuk-error-summary govuk-error-summary--warning"
              data-module="govuk-error-summary"
            >
              <div role="alert">
                <h2 class="govuk-error-summary__title">
                  {i18n.t("server-resolution.split_brain_warning_title")}
                </h2>
                <div class="govuk-error-summary__body">
                  <p class="govuk-body">
                    {i18n.t(
                      "server-resolution.split_brain_warning_description",
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          <p class="govuk-body">
            {i18n.t("server-resolution.wellknown_description")}{" "}
            <code>/.well-known/matrix/server</code>{" "}
            {i18n.t("server-resolution.wellknown_description_suffix")}
          </p>

          <div class="table-wrapper">
            <div class="table-scroll">
              <table class="govuk-table">
                <caption class="govuk-table__caption govuk-table__caption--m">
                  {i18n.t("server-resolution.wellknown_caption")}
                </caption>
                <thead class="govuk-table__head">
                  <tr class="govuk-table__row">
                    <th scope="col" class="govuk-table__header">
                      {i18n.t("server-resolution.ip_column")}
                    </th>
                    <th
                      scope="col"
                      class="govuk-table__header"
                      style={{ minWidth: "12rem" }}
                    >
                      {i18n.t("server-resolution.wellknown_status_column")}
                    </th>
                    <th scope="col" class="govuk-table__header">
                      {i18n.t("server-resolution.wellknown_m_server_column")}
                    </th>
                    {showConnectionAddresses && (
                      <th scope="col" class="govuk-table__header">
                        {i18n.t(
                          "server-resolution.wellknown_connection_target_column",
                        )}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody class="govuk-table__body">
                  {Object.entries(srv_wellknown_results).map(([ip, result]) => {
                    const hasError = !!result.Error?.Error;

                    return (
                      <tr class="govuk-table__row">
                        <td class="govuk-table__cell">
                          <code aria-label="IP address">{ip}</code>
                        </td>
                        <td class="govuk-table__cell">
                          {hasError
                            ? (
                              <>
                                <strong class="govuk-tag govuk-tag--red">
                                  {i18n.t("common.error")}
                                </strong>
                                <br />
                                <span
                                  class="govuk-hint"
                                  style={{
                                    fontSize: "0.875rem",
                                    wordBreak: "break-word",
                                  }}
                                >
                                  {result.Error!.Error}
                                </span>
                              </>
                            )
                            : (
                              <strong class="govuk-tag govuk-tag--green">
                                {i18n.t("common.ok")}
                              </strong>
                            )}
                        </td>
                        <td class="govuk-table__cell">
                          {result["m.server"]
                            ? <code>{result["m.server"]}</code>
                            : <span class="govuk-hint">—</span>}
                        </td>
                        {showConnectionAddresses && (
                          <td class="govuk-table__cell">
                            {result.ConnectionAddresses &&
                                result.ConnectionAddresses.length > 0
                              ? (
                                <ul class="govuk-list">
                                  {result.ConnectionAddresses.map((addr) => (
                                    <li>
                                      <code>{addr}</code>
                                    </li>
                                  ))}
                                </ul>
                              )
                              : <span class="govuk-hint">—</span>}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}
