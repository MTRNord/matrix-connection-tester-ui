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

const METRIC_LINE_REGEX = /^(?<name>[a-zA-Z_:][a-zA-Z0-9_:]*)(?:\{(?<labels>.*)\})?\s+(?<value>[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?)$/;

export function parsePrometheusText(text: string): PrometheusParseResult {
    const lines = text.split(/\n+/);
    const metrics: Record<string, PrometheusMetric> = {};

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;
        if (line.startsWith('#')) {
            // Comment / metadata
            const parts = line.split(/\s+/);
            if (parts.length >= 4 && parts[1] === 'HELP') {
                const name = parts[2];
                const help = line.substring(line.indexOf(name) + name.length).replace(/^\s+/, '').replace(/^HELP\s+/, '');
                metrics[name] = metrics[name] || { name, samples: [] };
                metrics[name].help = help.replace(/^#\s*HELP\s+[^\s]+\s+/, '').trim();
            } else if (parts.length >= 4 && parts[1] === 'TYPE') {
                const name = parts[2];
                const type = parts[3];
                metrics[name] = metrics[name] || { name, samples: [] };
                metrics[name].type = type;
            }
            continue;
        }

        const match = METRIC_LINE_REGEX.exec(line);
        if (!match || !match.groups) continue; // skip unrecognized lines
        const { name, labels: labelsRaw, value } = match.groups as { name: string; labels?: string; value: string };
        const labels: Record<string, string> = {};
        if (labelsRaw) {
            // Split by comma not inside quotes
            // Simpler approach: split on commas then key=value; Prometheus guarantees simple format
            // Simple split on commas (Prometheus label values rarely contain unescaped commas)
            const labelParts = labelsRaw.split(/,/);
            for (const part of labelParts) {
                const eq = part.indexOf('=');
                if (eq === -1) continue;
                const k = part.slice(0, eq).trim();
                let v = part.slice(eq + 1).trim();
                if (v.startsWith('"') && v.endsWith('"')) {
                    v = v.slice(1, -1).replace(/\\"/g, '"');
                }
                labels[k] = v;
            }
        }

        metrics[name] = metrics[name] || { name, samples: [] };
        metrics[name].samples.push({ metric: name, labels, value: Number(value) });
    }

    return { metrics };
}

// Helper to extract a single metric's samples easily
export function getMetricSamples(result: PrometheusParseResult, metricName: string): PrometheusSample[] {
    return result.metrics[metricName]?.samples || [];
}
