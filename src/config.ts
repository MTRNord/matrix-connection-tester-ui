import { queryOptions } from '@tanstack/react-query'

export interface AppConfig {
  api_server_url: string
  oauth2_client_id: string
  github_sponsors_url?: string
  liberapay_url?: string
  /** Display name of the data controller shown in the privacy policy. */
  privacy_controller_name?: string
  /** Contact email of the data controller shown in the privacy policy. */
  privacy_controller_email?: string
  /** Public hostname of this instance (e.g. "matrix-connection-tester.example.com"). */
  instance_domain?: string
  /**
   * How many days the email notification log is retained (matches the backend
   * `email_log_retention_days` config). Shown in the privacy policy.
   * Defaults to 7 when not set.
   */
  email_log_retention_days?: number
  /**
   * How many days raw anonymised statistics are retained (matches the backend
   * `statistics.raw_retention_days` config). Shown in the privacy policy.
   * Defaults to 30 when not set.
   */
  statistics_raw_retention_days?: number
}

function isValidConfig(data: unknown): data is AppConfig {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as Record<string, unknown>).api_server_url === 'string' &&
    typeof (data as Record<string, unknown>).oauth2_client_id === 'string'
  )
}

let _cache: AppConfig | null = null

export async function loadConfig(): Promise<AppConfig> {
  if (_cache) return _cache
  let res: Response
  try {
    res = await fetch('/config.json')
  } catch (e) {
    throw new Error(
      `Could not reach /config.json: ${e instanceof Error ? e.message : 'network error'}`,
    )
  }
  if (!res.ok) {
    throw new Error(`/config.json returned HTTP ${res.status}`)
  }
  let data: unknown
  try {
    data = await res.json()
  } catch {
    throw new Error('/config.json is not valid JSON')
  }
  if (!isValidConfig(data)) {
    throw new Error(
      '/config.json is missing required fields: api_server_url and oauth2_client_id must be strings',
    )
  }
  _cache = data
  return _cache
}

export const configQueryOptions = queryOptions({
  queryKey: ['config'],
  queryFn: loadConfig,
  staleTime: Infinity,
  retry: 1,
})
