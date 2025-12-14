// Utility to parse Prometheus text exposition format into structured objects
// This is intentionally lightweight and only supports the subset we need
// for counters/gauges with HELP/TYPE metadata.

export interface PrometheusSample {
  metric: string;
  labels: Record<string, string>;
  value: number;
}

export interface PrometheusMetric {
  name: string;
  help?: string;
  type?: string;
  samples: PrometheusSample[];
}

export interface PrometheusParseResult {
  metrics: Record<string, PrometheusMetric>;
}

const METRIC_LINE_REGEX =
  /^(?<name>[a-zA-Z_:][a-zA-Z0-9_:]*)(?:\{(?<labels>.*)\})?\s+(?<value>[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?)$/;

export function parsePrometheusText(
  text: string,
  targetMetrics?: string[],
): PrometheusParseResult {
  const metrics: Record<string, PrometheusMetric> = {};
  const targetSet = targetMetrics ? new Set(targetMetrics) : null;

  // Process line by line without creating array of all lines
  let lineStart = 0;
  const textLength = text.length;

  while (lineStart < textLength) {
    let lineEnd = text.indexOf("\n", lineStart);
    if (lineEnd === -1) lineEnd = textLength;

    const line = text.slice(lineStart, lineEnd).trim();
    lineStart = lineEnd + 1;

    if (!line) continue;
    if (line.startsWith("#")) {
      // Comment / metadata
      const parts = line.split(/\s+/);
      if (parts.length >= 4 && parts[1] === "HELP") {
        const name = parts[2];
        // Skip if we're filtering and this isn't a target metric
        if (targetSet && !targetSet.has(name)) continue;

        const help = line
          .substring(line.indexOf(name) + name.length)
          .replace(/^\s+/, "")
          .replace(/^HELP\s+/, "");
        metrics[name] = metrics[name] || { name, samples: [] };
        metrics[name].help = help.replace(/^#\s*HELP\s+[^\s]+\s+/, "").trim();
      } else if (parts.length >= 4 && parts[1] === "TYPE") {
        const name = parts[2];
        // Skip if we're filtering and this isn't a target metric
        if (targetSet && !targetSet.has(name)) continue;

        const type = parts[3];
        metrics[name] = metrics[name] || { name, samples: [] };
        metrics[name].type = type;
      }
      continue;
    }

    const match = METRIC_LINE_REGEX.exec(line);
    if (!match || !match.groups) continue; // skip unrecognized lines
    const { name, labels: labelsRaw, value } = match.groups as {
      name: string;
      labels?: string;
      value: string;
    };

    // Skip if we're filtering and this isn't a target metric
    if (targetSet && !targetSet.has(name)) continue;

    const labels: Record<string, string> = {};
    if (labelsRaw) {
      // Parse labels more efficiently without regex split
      let pos = 0;
      const len = labelsRaw.length;

      while (pos < len) {
        // Skip whitespace and commas
        while (
          pos < len && (labelsRaw[pos] === " " || labelsRaw[pos] === ",")
        ) pos++;
        if (pos >= len) break;

        // Find key
        const keyStart = pos;
        while (pos < len && labelsRaw[pos] !== "=") pos++;
        if (pos >= len) break;
        const k = labelsRaw.slice(keyStart, pos).trim();
        pos++; // skip '='

        // Find value
        while (pos < len && labelsRaw[pos] === " ") pos++;
        if (pos >= len) break;

        let v: string;
        if (labelsRaw[pos] === '"') {
          pos++; // skip opening quote
          const valueStart = pos;
          while (pos < len && labelsRaw[pos] !== '"') {
            if (labelsRaw[pos] === "\\") pos++; // skip escaped char
            pos++;
          }
          v = labelsRaw.slice(valueStart, pos).replace(/\\"/g, '"');
          pos++; // skip closing quote
        } else {
          const valueStart = pos;
          while (pos < len && labelsRaw[pos] !== ",") pos++;
          v = labelsRaw.slice(valueStart, pos).trim();
        }

        labels[k] = v;
      }
    }

    metrics[name] = metrics[name] || { name, samples: [] };
    metrics[name].samples.push({
      metric: name,
      labels,
      value: Number(value),
    });
  }

  return { metrics };
}

// Helper to extract a single metric's samples easily
export function getMetricSamples(
  result: PrometheusParseResult,
  metricName: string,
): PrometheusSample[] {
  return result.metrics[metricName]?.samples || [];
}
