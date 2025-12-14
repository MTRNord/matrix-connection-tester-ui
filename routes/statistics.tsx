import { define } from "../utils.ts";
import { page } from "fresh";
import StatCard from "../components/StatCard.tsx";
import {
  getMetricSamples,
  parsePrometheusText,
} from "../lib/prometheus-parser.ts";
import type { PrometheusParseResult } from "../lib/prometheus-parser.ts";
import { getConfig } from "../lib/api.ts";

// Cache configuration
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let cachedStatistics: {
  data: StatisticsData;
  timestamp: number;
} | null = null;

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
    // Only parse the metric we need for statistics
    const parsed = parsePrometheusText(text, ["federation_request_total"]);

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

  // Process all samples in a single pass for efficiency
  let successfulTests = 0;
  let failedTests = 0;
  const successfulServers = new Set<string>();
  const softwareMap = new Map<string, number>();
  const versionMap = new Map<
    string,
    { family: string; version: string; count: number }
  >();

  for (const sample of federationRequestSamples) {
    const family = sample.labels.software_family?.toLowerCase() || "";
    const result = sample.labels.result;
    const server = sample.labels.server;
    const value = sample.value;

    // Skip invalid samples
    if (!family || family === "unknown" || !server || value <= 0) {
      continue;
    }

    // Count tests by result
    if (result === "success") {
      successfulTests += value;
      successfulServers.add(server);

      // Build software distribution (only for successful tests)
      const familyOriginal = sample.labels.software_family || "Unknown";
      if (familyOriginal !== "Unknown" && familyOriginal !== "unknown") {
        softwareMap.set(
          familyOriginal,
          (softwareMap.get(familyOriginal) || 0) + value,
        );
      }

      // Build version distribution (only for successful tests)
      const version = sample.labels.software_version || "Unknown";
      if (
        familyOriginal !== "Unknown" && familyOriginal !== "unknown" &&
        version !== "Unknown" && version !== "unknown"
      ) {
        const key = `${familyOriginal}|${version}`;
        const existing = versionMap.get(key);
        if (existing) {
          existing.count += value;
        } else {
          versionMap.set(key, {
            family: familyOriginal,
            version,
            count: value,
          });
        }
      }
    } else if (result === "failure") {
      failedTests += value;
    }
  }

  const totalTests = successfulTests + failedTests;
  const successRate = totalTests > 0 ? (successfulTests / totalTests) * 100 : 0;
  const uniqueServers = successfulServers.size;

  // Process software distribution: group single-test servers as "Other"
  let otherCount = 0;
  const serverDistribution: ServerDistribution[] = [];

  softwareMap.forEach((count, software) => {
    if (count === 1) {
      otherCount += count;
    } else {
      serverDistribution.push({
        software,
        count,
        percentage: totalTests > 0 ? (count / totalTests) * 100 : 0,
      });
    }
  });

  // Sort by count descending
  serverDistribution.sort((a, b) => b.count - a.count);

  // Add "Other" category if applicable
  if (otherCount > 0) {
    serverDistribution.push({
      software: "Other",
      count: otherCount,
      percentage: totalTests > 0 ? (otherCount / totalTests) * 100 : 0,
    });
  }

  // Process version distribution: group single-test versions as "Other"
  let otherVersionCount = 0;
  const versionDistribution: VersionDistribution[] = [];

  versionMap.forEach((v) => {
    if (v.count === 1) {
      otherVersionCount += v.count;
    } else {
      versionDistribution.push({
        software: v.family,
        version: v.version,
        count: v.count,
        percentage: totalTests > 0 ? (v.count / totalTests) * 100 : 0,
      });
    }
  });

  // Sort by count descending and take top 15
  versionDistribution.sort((a, b) => b.count - a.count);
  const topVersions = versionDistribution.slice(0, 15);

  // Add "Other" category if applicable
  if (otherVersionCount > 0 && topVersions.length < 15) {
    topVersions.push({
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
    versionDistribution: topVersions,
    lastUpdated: new Date().toISOString(),
  };
}

export const handler = define.handlers({
  async GET(ctx) {
    const { url } = ctx;

    try {
      // Check if we have valid cached data
      const now = Date.now();
      if (
        cachedStatistics && (now - cachedStatistics.timestamp) < CACHE_TTL_MS
      ) {
        // Serve from cache with appropriate headers
        const age = Math.floor((now - cachedStatistics.timestamp) / 1000);
        const maxAge = Math.floor(CACHE_TTL_MS / 1000);

        return page(
          {
            stats: cachedStatistics.data,
          },
          {
            headers: {
              "Cache-Control": `public, max-age=${
                maxAge - age
              }, stale-while-revalidate=60`,
              "Age": age.toString(),
            },
          },
        );
      }

      // Fetch API configuration
      const apiConfig = await getConfig(
        `${url.protocol}//${url.host}`,
      );

      const apiUrl = apiConfig.api_server_url;

      // Fetch statistics from the API
      const stats = await fetchStatistics(apiUrl);

      // Cache the result if successful
      if (stats) {
        cachedStatistics = {
          data: stats,
          timestamp: Date.now(),
        };
      }

      // Set cache headers for fresh response
      const maxAge = Math.floor(CACHE_TTL_MS / 1000);
      return page(
        {
          stats,
        },
        {
          headers: {
            "Cache-Control":
              `public, max-age=${maxAge}, stale-while-revalidate=60`,
          },
        },
      );
    } catch (error) {
      console.error("Error in statistics handler:", error);

      // If we have stale cached data, serve it on error
      if (cachedStatistics) {
        return page(
          {
            stats: cachedStatistics.data,
          },
          {
            headers: {
              "Cache-Control": "public, max-age=60, stale-if-error=3600",
            },
          },
        );
      }

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
