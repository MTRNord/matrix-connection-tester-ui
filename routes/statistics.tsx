import { define } from "../utils.ts";
import { page } from "fresh";
import StatCard from "../components/StatCard.tsx";
import {
  getMetricSamples,
  parsePrometheusText,
} from "../lib/prometheus-parser.ts";
import type { PrometheusParseResult } from "../lib/prometheus-parser.ts";
import { getConfig } from "../lib/api.ts";

interface ServerDistribution {
  software: string;
  count: number;
  percentage: number;
}

interface VersionDistribution {
  software: string;
  version: string;
  count: number;
  percentage: number;
}

interface StatisticsData {
  totalTests: number;
  successfulTests: number;
  failedTests: number;
  successRate: number;
  uniqueServers: number;
  serverDistribution: ServerDistribution[];
  versionDistribution: VersionDistribution[];
  lastUpdated: string;
}

async function fetchStatistics(apiUrl: string): Promise<StatisticsData | null> {
  try {
    const response = await fetch(`${apiUrl}/metrics`);
    if (!response.ok) {
      throw new Error(`Failed to fetch metrics: ${response.statusText}`);
    }

    const text = await response.text();
    const parsed = parsePrometheusText(text);

    return extractStatistics(parsed);
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return null;
  }
}

function extractStatistics(parsed: PrometheusParseResult): StatisticsData {
  // Extract federation request metrics
  const federationRequestSamples = getMetricSamples(
    parsed,
    "federation_request_total",
  );

  // Filter out unknown servers and failing servers
  const validSamples = federationRequestSamples.filter((s) => {
    const family = s.labels.software_family?.toLowerCase() || "";

    // Exclude unknown software
    if (family === "unknown" || family === "" || !family) {
      return false;
    }

    // Only include samples with actual server information
    return s.labels.server && s.value > 0;
  });

  // Calculate successful vs failed tests
  const successfulTests = validSamples
    .filter((s) => s.labels.result === "success")
    .reduce((sum, s) => sum + s.value, 0);

  const failedTests = validSamples
    .filter((s) => s.labels.result === "failure")
    .reduce((sum, s) => sum + s.value, 0);

  const totalTests = successfulTests + failedTests;
  const successRate = totalTests > 0 ? (successfulTests / totalTests) * 100 : 0;

  // Count unique servers (only successful tests to avoid counting failing servers)
  const successfulServers = new Set(
    validSamples
      .filter((s) => s.labels.result === "success")
      .map((s) => s.labels.server),
  );
  const uniqueServers = successfulServers.size;

  // Calculate server software distribution (by family)
  const softwareMap = new Map<string, number>();
  validSamples
    .filter((s) => s.labels.result === "success")
    .forEach((s) => {
      const family = s.labels.software_family || "Unknown";
      if (family !== "Unknown" && family !== "unknown") {
        softwareMap.set(family, (softwareMap.get(family) || 0) + s.value);
      }
    });

  // Group software with only 1 test as "Other" to prevent identification
  let otherCount = 0;
  const filteredSoftware = new Map<string, number>();

  softwareMap.forEach((count, software) => {
    if (count === 1) {
      otherCount += count;
    } else {
      filteredSoftware.set(software, count);
    }
  });

  const serverDistribution: ServerDistribution[] = Array.from(
    filteredSoftware.entries(),
  )
    .map(([software, count]) => ({
      software,
      count,
      percentage: totalTests > 0 ? (count / totalTests) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Add "Other" category if there are any single-test servers
  if (otherCount > 0) {
    serverDistribution.push({
      software: "Other",
      count: otherCount,
      percentage: totalTests > 0 ? (otherCount / totalTests) * 100 : 0,
    });
  }

  // Calculate version distribution (software family + version)
  const versionMap = new Map<
    string,
    { family: string; version: string; count: number }
  >();
  validSamples
    .filter((s) => s.labels.result === "success")
    .forEach((s) => {
      const family = s.labels.software_family || "Unknown";
      const version = s.labels.software_version || "Unknown";

      if (
        family !== "Unknown" && family !== "unknown" && version !== "Unknown" &&
        version !== "unknown"
      ) {
        const key = `${family}|${version}`;
        const existing = versionMap.get(key);
        if (existing) {
          existing.count += s.value;
        } else {
          versionMap.set(key, { family, version, count: s.value });
        }
      }
    });

  // Group versions with only 1 test as "Other" to prevent identification
  let otherVersionCount = 0;
  const filteredVersions: Array<
    { family: string; version: string; count: number }
  > = [];

  versionMap.forEach((v) => {
    if (v.count === 1) {
      otherVersionCount += v.count;
    } else {
      filteredVersions.push(v);
    }
  });

  const versionDistribution: VersionDistribution[] = filteredVersions
    .map((v) => ({
      software: v.family,
      version: v.version,
      count: v.count,
      percentage: totalTests > 0 ? (v.count / totalTests) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15); // Top 15 versions

  // Add "Other" category if there are any single-test versions
  if (otherVersionCount > 0 && versionDistribution.length < 15) {
    versionDistribution.push({
      software: "Other",
      version: "-",
      count: otherVersionCount,
      percentage: totalTests > 0 ? (otherVersionCount / totalTests) * 100 : 0,
    });
  }

  return {
    totalTests,
    successfulTests,
    failedTests,
    successRate,
    uniqueServers,
    serverDistribution,
    versionDistribution,
    lastUpdated: new Date().toISOString(),
  };
}

export const handler = define.handlers({
  async GET(ctx) {
    const { url } = ctx;

    try {
      // Fetch API configuration
      const apiConfig = await getConfig(
        `${url.protocol}//${url.host}`,
      );

      const apiUrl = apiConfig.api_server_url;

      // Fetch statistics from the API
      const stats = await fetchStatistics(apiUrl);

      return page({
        stats,
      });
    } catch (error) {
      console.error("Error in statistics handler:", error);
      return page({
        stats: null,
      });
    }
  },
});

export default define.page<typeof handler>(function Statistics(ctx) {
  const { i18n } = ctx.state;
  const stats = ctx.data?.stats;

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
                  {i18n.tString("statistics.version_distribution_description")}
                </p>

                <div class="table-wrapper">
                  <div class="table-scroll">
                    <table class="govuk-table">
                      <caption class="govuk-table__caption govuk-table__caption--m govuk-visually-hidden">
                        {i18n.tString("statistics.version_distribution_title")}
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
});
