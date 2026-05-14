export interface PrometheusSample {
  metric: string
  labels: Record<string, string | undefined>
  value: number
}

interface PrometheusParseResult {
  metrics: Record<string, { samples: PrometheusSample[] } | undefined>
}

const METRIC_LINE =
  /^(?<name>[a-zA-Z_:][a-zA-Z0-9_:]*)(?:\{(?<labels>.*)\})?\s+(?<value>[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?)$/

function parseLabels(raw: string): Record<string, string> {
  const labels: Record<string, string> = {}
  let pos = 0
  const len = raw.length
  while (pos < len) {
    while (pos < len && (raw[pos] === ' ' || raw[pos] === ',')) pos++
    if (pos >= len) break
    const keyStart = pos
    while (pos < len && raw[pos] !== '=') pos++
    if (pos >= len) break
    const k = raw.slice(keyStart, pos).trim()
    pos++
    while (pos < len && raw[pos] === ' ') pos++
    if (pos >= len) break
    let v: string
    if (raw[pos] === '"') {
      pos++
      const start = pos
      while (pos < len && raw[pos] !== '"') {
        if (raw[pos] === '\\') pos++
        pos++
      }
      v = raw.slice(start, pos).replace(/\\"/g, '"')
      pos++
    } else {
      const start = pos
      while (pos < len && raw[pos] !== ',') pos++
      v = raw.slice(start, pos).trim()
    }
    labels[k] = v
  }
  return labels
}

export function parsePrometheusText(
  text: string,
  targetMetrics?: string[],
): PrometheusParseResult {
  const metrics: Record<string, { samples: PrometheusSample[] } | undefined> =
    {}
  const targetSet = targetMetrics ? new Set(targetMetrics) : null

  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue

    const m = METRIC_LINE.exec(line)
    if (!m?.groups) continue
    const {
      name,
      labels: labelsRaw,
      value,
    } = m.groups as {
      name: string
      labels?: string
      value: string
    }
    if (targetSet && !targetSet.has(name)) continue
    ;(metrics[name] ??= { samples: [] }).samples.push({
      metric: name,
      labels: labelsRaw ? parseLabels(labelsRaw) : {},
      value: Number(value),
    })
  }

  return { metrics }
}

export function getMetricSamples(
  result: PrometheusParseResult,
  metricName: string,
): PrometheusSample[] {
  return result.metrics[metricName]?.samples ?? []
}
