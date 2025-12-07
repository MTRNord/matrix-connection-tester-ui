import { I18n } from "../../lib/i18n.ts";
import { APIResponseType } from "../../routes/results.tsx";

export function ConnectivityReportsSection(props: {
  i18n: I18n;
  apiData: APIResponseType;
}) {
  const { i18n } = props;

  const reports = props.apiData.ConnectionReports;

  if (!reports || Object.keys(reports).length === 0) {
    return null;
  }

  return (
    <>
      {Object.entries(reports).map(([ip, report]) => (
        <>
          <div class="table-wrapper">
            <div class="table-scroll">
              <table class="govuk-table">
                <caption class="govuk-table__caption govuk-table__caption--m">
                  {i18n.t("connectivity-reports.report_for")}{" "}
                  <code aria-label="IP address">{ip}</code>
                </caption>
                <thead class="govuk-table__head">
                  <tr class="govuk-table__row">
                    <th scope="col" class="govuk-table__header">
                      {i18n.t("connectivity-reports.check_column")}
                    </th>
                    <th scope="col" class="govuk-table__header">
                      {i18n.t("connectivity-reports.result_column")}
                    </th>
                  </tr>
                </thead>
                <tbody class="govuk-table__body">
                  {Object.entries(report.Checks).map(([check, result]) => (
                    (typeof result) === "boolean"
                      ? (
                        <tr class="govuk-table__row">
                          <th scope="row" class="govuk-table__header">
                            {i18n.t(`connectivity-reports.titles.${check}`)}
                          </th>
                          <td class="govuk-table__cell">
                            <strong
                              class={"govuk-tag govuk-tag--" +
                                (result ? "green" : "red")}
                            >
                              {result
                                ? i18n.t("connectivity-reports.ok")
                                : i18n.t("connectivity-reports.error")}
                            </strong>
                          </td>
                        </tr>
                      )
                      : null
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <details class="govuk-details">
            <summary class="govuk-details__summary">
              <span class="govuk-details__summary-text">
                {i18n.t("connectivity-reports.details_summary")}
              </span>
            </summary>
            <div class="govuk-details__text">
              <div class="table-wrapper">
                <div class="table-scroll">
                  <table class="govuk-table">
                    <caption class="govuk-table__caption govuk-table__caption--m">
                      {i18n.t("connectivity-reports.keys_caption")}
                    </caption>
                    <thead class="govuk-table__head">
                      <tr class="govuk-table__row">
                        <th scope="col" class="govuk-table__header">
                          {i18n.t("connectivity-reports.key_id_column")}
                        </th>
                        <th scope="col" class="govuk-table__header">
                          {i18n.t("connectivity-reports.key_column")}
                        </th>
                      </tr>
                    </thead>
                    <tbody class="govuk-table__body">
                      {Object.entries(report.Ed25519VerifyKeys).map((
                        [id, key],
                      ) => (
                        <tr class="govuk-table__row">
                          <td class="govuk-table__cell">
                            <code aria-label="Key ID">{id}</code>
                          </td>
                          <td class="govuk-table__cell">
                            <code aria-label="Key value">{key}</code>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div class="table-wrapper">
                <div class="table-scroll">
                  <table class="govuk-table">
                    <caption class="govuk-table__caption govuk-table__caption--m">
                      {i18n.t("connectivity-reports.certificates_caption")}
                    </caption>
                    <thead class="govuk-table__head">
                      <tr class="govuk-table__row">
                        <th scope="col" class="govuk-table__header">
                          {i18n.t("connectivity-reports.issuer_column")}
                        </th>
                        <th scope="col" class="govuk-table__header">
                          {i18n.t("connectivity-reports.subject_column")}
                        </th>
                        <th scope="col" class="govuk-table__header">
                          {i18n.t("connectivity-reports.fingerprint_column")}
                        </th>
                      </tr>
                    </thead>
                    <tbody class="govuk-table__body">
                      {report.Certificates.map((
                        certificate,
                      ) => (
                        <tr class="govuk-table__row">
                          <td class="govuk-table__cell">
                            <code aria-label="Certificate issuer">
                              {certificate.IssuerCommonName}
                            </code>
                          </td>
                          <td class="govuk-table__cell">
                            <code aria-label="Certificate subject">
                              {certificate.SubjectCommonName}
                            </code>
                          </td>
                          <td class="govuk-table__cell">
                            <code aria-label="Certificate fingerprint">
                              {certificate.SHA256Fingerprint}
                            </code>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </details>
        </>
      ))}
    </>
  );
}
