import { page } from "fresh";
import { StatisticsView } from "../components/StatisticsView.tsx";
import type { StatisticsData } from "../components/StatisticsView.tsx";
import { getConfig } from "../lib/api.ts";
import type { PrometheusParseResult } from "../lib/prometheus-parser.ts";
import {
  getMetricSamples,
  parsePrometheusText,
} from "../lib/prometheus-parser.ts";
import { define } from "../utils.ts";
import { fetchWithTrace, getTracer } from "../lib/tracing.ts";
import { SpanStatusCode } from "@opentelemetry/api";

// Cache configuration
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let cachedStatistics: {
  data: StatisticsData;
  timestamp: number;
} | null = null;

async function fetchStatistics(apiUrl: string): Promise<StatisticsData | null> {
  const tracer = getTracer();
  return await tracer.startActiveSpan("fetchStatistics", async (parentSpan) => {
    try {
      const response = await fetchWithTrace(`${apiUrl}/metrics`);
      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.statusText}`);
      }

      const text = await response.text();
      // Only parse the metric we need for statistics
      const parsed = parsePrometheusText(text, ["federation_request_total"]);

      return extractStatistics(parsed);
    } catch (error) {
      console.error("Error fetching statistics:", error);

      if (error instanceof Error) {
        parentSpan.recordException(error);
      }
      parentSpan.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : String(error),
      });
      return null;
    } finally {
      parentSpan.end();
    }
  });
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
  const serverDistribution = [] as StatisticsData["serverDistribution"];

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

  serverDistribution.sort((a, b) => b.count - a.count);

  if (otherCount > 0) {
    serverDistribution.push({
      software: "Other",
      count: otherCount,
      percentage: totalTests > 0 ? (otherCount / totalTests) * 100 : 0,
    });
  }

  // Process version distribution: group single-test versions as "Other"
  let otherVersionCount = 0;
  const versionDistribution = [] as StatisticsData["versionDistribution"];

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

  versionDistribution.sort((a, b) => b.count - a.count);
  const topVersions = versionDistribution.slice(0, 15);

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
    const tracer = getTracer();
    return await tracer.startActiveSpan(
      "access federation report api",
      async (parentSpan) => {
        const { url } = ctx;

        try {
          // Check if we have valid cached data
          const now = Date.now();
          if (
            cachedStatistics &&
            (now - cachedStatistics.timestamp) < CACHE_TTL_MS
          ) {
            const age = Math.floor((now - cachedStatistics.timestamp) / 1000);
            const maxAge = Math.floor(CACHE_TTL_MS / 1000);

            parentSpan.addEvent("serving from cache");

            return page(
              { stats: cachedStatistics.data },
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

          parentSpan.addEvent("serving from API");

          const apiConfig = await getConfig(`${url.protocol}//${url.host}`);
          const stats = await fetchStatistics(apiConfig.api_server_url);
          parentSpan.addEvent("fetched statistics");

          if (stats) {
            parentSpan.addEvent("caching result");
            cachedStatistics = { data: stats, timestamp: Date.now() };
          }

          const maxAge = Math.floor(CACHE_TTL_MS / 1000);
          return page(
            { stats },
            {
              headers: {
                "Cache-Control":
                  `public, max-age=${maxAge}, stale-while-revalidate=60`,
              },
            },
          );
        } catch (error) {
          console.error("Error in statistics handler:", error);

          if (error instanceof Error) {
            parentSpan.recordException(error);
          }
          parentSpan.setStatus({
            code: SpanStatusCode.ERROR,
            message: error instanceof Error ? error.message : String(error),
          });

          if (cachedStatistics) {
            return page(
              { stats: cachedStatistics.data },
              {
                headers: {
                  "Cache-Control": "public, max-age=60, stale-if-error=3600",
                },
              },
            );
          }

          return page({ stats: null });
        } finally {
          parentSpan.end();
        }
      },
    );
  },
});

export default define.page<typeof handler>(function Statistics(ctx) {
  return (
    <StatisticsView stats={ctx.data?.stats ?? null} i18n={ctx.state.i18n} />
  );
});
