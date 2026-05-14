import { queryOptions } from '@tanstack/react-query'
import { loadConfig } from '#/config'
import { getMetricSamples, parsePrometheusText } from './prometheusParser'
import type { OutcomeDay } from '#/components/OutcomeChart/OutcomeChart'

export interface ServerDistribution {
  software: string
  count: number
  percentage: number
}

export interface StatisticsData {
  totalTests: number
  successRate: number
  uniqueServers: number
  serverDistribution: ServerDistribution[]
  dailyOutcomes: OutcomeDay[]
  lastUpdated: string
}

function extractStatistics(text: string): StatisticsData {
  const parsed = parsePrometheusText(text, ['federation_request_total'])
  const samples = getMetricSamples(parsed, 'federation_request_total')

  let successful = 0
  let failed = 0
  const servers = new Set<string>()
  const softwareMap = new Map<string, number>()

  for (const s of samples) {
    const family = s.labels.software_family ?? ''
    const result = s.labels.result
    const server = s.labels.server
    if (!family || family === 'unknown' || !server || s.value <= 0) continue

    servers.add(server)

    if (result === 'success') {
      successful += s.value
      if (family !== 'unknown') {
        softwareMap.set(family, (softwareMap.get(family) ?? 0) + s.value)
      }
    } else if (result === 'failure') {
      failed += s.value
    }
  }

  const total = successful + failed
  const successRate = total > 0 ? (successful / total) * 100 : 0

  let otherCount = 0
  const distribution: ServerDistribution[] = []

  for (const [software, count] of softwareMap) {
    if (count <= 5) {
      otherCount += count
    } else {
      distribution.push({
        software,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      })
    }
  }

  distribution.sort((a, b) => b.count - a.count)

  if (otherCount > 0) {
    distribution.push({
      software: 'Other',
      count: otherCount,
      percentage: total > 0 ? (otherCount / total) * 100 : 0,
    })
  }

  return {
    totalTests: total,
    successRate,
    uniqueServers: servers.size,
    serverDistribution: distribution,
    dailyOutcomes: [],
    lastUpdated: new Date().toISOString(),
  }
}

interface DailyApiResponse {
  days: OutcomeDay[]
}

export const statisticsQueryOptions = queryOptions({
  queryKey: ['statistics'],
  queryFn: async (): Promise<StatisticsData | null> => {
    const config = await loadConfig()

    const [metricsResp, dailyResp] = await Promise.all([
      fetch(`${config.api_server_url}/metrics`),
      fetch(`${config.api_server_url}/api/statistics/daily`),
    ])

    if (!metricsResp.ok) {
      if (metricsResp.status === 404) return null
      throw new Error(`Metrics endpoint returned HTTP ${metricsResp.status}`)
    }

    const text = await metricsResp.text()
    const data = extractStatistics(text)

    if (dailyResp.ok) {
      const daily = (await dailyResp.json()) as DailyApiResponse
      data.dailyOutcomes = daily.days
    }

    return data
  },
  staleTime: 5 * 60 * 1000,
  retry: 1,
})
