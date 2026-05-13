import { queryOptions } from '@tanstack/react-query'

export interface AppConfig {
  api_server_url: string
  oauth2_client_id: string
  github_sponsors_url?: string
  liberapay_url?: string
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
