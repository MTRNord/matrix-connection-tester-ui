import { apiReq } from '#/auth/apiReq'
import type { AppConfig } from '#/config'
import { queryOptions } from '@tanstack/react-query'

export interface WebhookDto {
  id: number
  url: string
  hmac_header: string
  respect_quiet_hours: boolean
  created_at: string
}

export interface AlertDto {
  id: number
  server_name: string
  verified: boolean
  created_at: string
  is_currently_failing: boolean
  last_check_at: string | null
  notify_emails: string[]
  notify_webhooks: WebhookDto[]
  notify_server_name_change: boolean
  notify_version_change: boolean
  notify_tls_cert_change: boolean
  notify_tls_expiry: boolean
  quiet_hours_enabled: boolean
  quiet_hours_from: string
  quiet_hours_to: string
}

export interface AlertsListResponse {
  alerts: AlertDto[]
  total: number
}

export const alertsQueryOptions = (cfg: AppConfig | undefined) =>
  queryOptions({
    queryKey: ['alerts', 'list', cfg?.api_server_url] as const,
    queryFn: async () => {
      const res = await apiReq(`${cfg!.api_server_url}/api/v2/alerts`)
      if (!res.ok) throw new Error('Failed to load alerts')
      return res.json() as Promise<AlertsListResponse>
    },
  })
