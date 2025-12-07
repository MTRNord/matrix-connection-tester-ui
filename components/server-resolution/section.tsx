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
                          <code>{record.Addrs}</code>
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
                      {i18n.t("server-resolution.key_column")}
                    </th>
                    <th scope="col" class="govuk-table__header">
                      {i18n.t("server-resolution.value_column")}
                    </th>
                  </tr>
                </thead>
                <tbody class="govuk-table__body">
                  {Object.entries(srv_wellknown_results).map((
                    [key, value],
                  ) => (
                    <tr class="govuk-table__row">
                      <td class="govuk-table__cell">
                        <code>{key}</code>
                      </td>
                      <td class="govuk-table__cell">
                        {typeof value === "object"
                          ? <code>{JSON.stringify(value, null, 2)}</code>
                          : value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}
