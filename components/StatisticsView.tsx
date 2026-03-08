import StatCard from "./StatCard.tsx";
import type { I18n } from "../lib/i18n.ts";

export interface ServerDistribution {
  software: string;
  count: number;
  percentage: number;
}

export interface VersionDistribution {
  software: string;
  version: string;
  count: number;
  percentage: number;
}

export interface StatisticsData {
  totalTests: number;
  successfulTests: number;
  failedTests: number;
  successRate: number;
  uniqueServers: number;
  serverDistribution: ServerDistribution[];
  versionDistribution: VersionDistribution[];
  lastUpdated: string;
}

interface StatisticsViewProps {
  stats: StatisticsData | null;
  i18n: I18n;
}

export function StatisticsView({ stats, i18n }: StatisticsViewProps) {
  return (
    <>
      <h1 class="govuk-heading-xl">{i18n.tString("statistics.title")}</h1>
      <p class="govuk-body-l">{i18n.tString("statistics.description")}</p>

      {!stats
        ? (
          <div class="stats-error">
            <h2 class="govuk-heading-m">
              {i18n.tString("statistics.error_title")}
            </h2>
            <p class="govuk-body">
              {i18n.tString("statistics.error_message")}
            </p>
          </div>
        )
        : (
          <>
            {/* Overview Section */}
            <div class="stats-section">
              <h2 class="govuk-heading-l stats-section__title">
                {i18n.tString("statistics.overview_title")}
              </h2>
              <p class="govuk-body stats-section__description">
                {i18n.tString("statistics.overview_description")}
              </p>

              <div class="stats-grid">
                <StatCard
                  title={i18n.tString("statistics.total_tests")}
                  value={stats.totalTests}
                  description={i18n.tString(
                    "statistics.total_tests_description",
                  )}
                  highlight
                />

                <StatCard
                  title={i18n.tString("statistics.unique_servers")}
                  value={stats.uniqueServers}
                  description={i18n.tString(
                    "statistics.unique_servers_description",
                  )}
                  highlight
                />

                <StatCard
                  title={i18n.tString("statistics.success_rate")}
                  value={`${stats.successRate.toFixed(1)}%`}
                  description={i18n.tString(
                    "statistics.success_rate_description",
                  )}
                  highlight
                />
              </div>

              <div class="stats-grid stats-grid--two-col">
                <StatCard
                  title={i18n.tString("statistics.successful_tests")}
                  value={stats.successfulTests}
                  description={i18n.tString(
                    "statistics.successful_tests_description",
                  )}
                />

                <StatCard
                  title={i18n.tString("statistics.failed_tests")}
                  value={stats.failedTests}
                  description={i18n.tString(
                    "statistics.failed_tests_description",
                  )}
                />
              </div>
            </div>

            {/* Server Software Distribution */}
            {stats.serverDistribution.length > 0 && (
              <div class="stats-section">
                <h2 class="govuk-heading-l stats-section__title">
                  {i18n.tString("statistics.server_distribution_title")}
                </h2>
                <p class="govuk-body stats-section__description">
                  {i18n.tString("statistics.server_distribution_description")}
                </p>

                <div class="table-wrapper">
                  <div class="table-scroll">
                    <table class="govuk-table">
                      <caption class="govuk-table__caption govuk-table__caption--m govuk-visually-hidden">
                        {i18n.tString("statistics.server_distribution_title")}
                      </caption>
                      <thead class="govuk-table__head">
                        <tr class="govuk-table__row">
                          <th scope="col" class="govuk-table__header">
                            {i18n.tString("statistics.server_software")}
                          </th>
                          <th
                            scope="col"
                            class="govuk-table__header govuk-table__header--numeric"
                          >
                            {i18n.tString("statistics.test_count")}
                          </th>
                          <th
                            scope="col"
                            class="govuk-table__header govuk-table__header--numeric"
                          >
                            {i18n.tString("statistics.percentage")}
                          </th>
                        </tr>
                      </thead>
                      <tbody class="govuk-table__body">
                        {stats.serverDistribution.map((item) => (
                          <tr class="govuk-table__row" key={item.software}>
                            <th scope="row" class="govuk-table__header">
                              {item.software === "Other"
                                ? i18n.tString("statistics.other")
                                : item.software}
                            </th>
                            <td class="govuk-table__cell govuk-table__cell--numeric">
                              {item.count.toLocaleString("en-GB")}
                            </td>
                            <td class="govuk-table__cell govuk-table__cell--numeric">
                              {item.percentage.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Version Distribution */}
            {stats.versionDistribution.length > 0 && (
              <div class="stats-section">
                <h2 class="govuk-heading-l stats-section__title">
                  {i18n.tString("statistics.version_distribution_title")}
                </h2>
                <p class="govuk-body stats-section__description">
                  {i18n.tString(
                    "statistics.version_distribution_description",
                  )}
                </p>

                <div class="table-wrapper">
                  <div class="table-scroll">
                    <table class="govuk-table">
                      <caption class="govuk-table__caption govuk-table__caption--m govuk-visually-hidden">
                        {i18n.tString(
                          "statistics.version_distribution_title",
                        )}
                      </caption>
                      <thead class="govuk-table__head">
                        <tr class="govuk-table__row">
                          <th scope="col" class="govuk-table__header">
                            {i18n.tString("statistics.server_software")}
                          </th>
                          <th scope="col" class="govuk-table__header">
                            {i18n.tString("statistics.version")}
                          </th>
                          <th
                            scope="col"
                            class="govuk-table__header govuk-table__header--numeric"
                          >
                            {i18n.tString("statistics.test_count")}
                          </th>
                          <th
                            scope="col"
                            class="govuk-table__header govuk-table__header--numeric"
                          >
                            {i18n.tString("statistics.percentage")}
                          </th>
                        </tr>
                      </thead>
                      <tbody class="govuk-table__body">
                        {stats.versionDistribution.map((item) => (
                          <tr
                            class="govuk-table__row"
                            key={`${item.software}-${item.version}`}
                          >
                            <th scope="row" class="govuk-table__header">
                              {item.software === "Other"
                                ? i18n.tString("statistics.other")
                                : item.software}
                            </th>
                            <td class="govuk-table__cell">
                              {item.version}
                            </td>
                            <td class="govuk-table__cell govuk-table__cell--numeric">
                              {item.count.toLocaleString("en-GB")}
                            </td>
                            <td class="govuk-table__cell govuk-table__cell--numeric">
                              {item.percentage.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Information Section */}
            <div class="govuk-inset-text">
              <p class="govuk-body">
                {i18n.tString("statistics.privacy_note")}
              </p>
            </div>

            <p class="stats-updated">
              {i18n.tString("statistics.last_updated")}:{" "}
              {new Date(stats.lastUpdated).toLocaleString(i18n.getLocale())}
            </p>
          </>
        )}
    </>
  );
}
