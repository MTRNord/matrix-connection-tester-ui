import Button from '#/components/Button/Button'
import Card from '#/components/Card/Card'
import Footer from '#/components/Footer/Footer'
import Navbar from '#/components/Navbar/Navbar'
import Pill from '#/components/Pill/Pill'
import { apiReq } from '#/auth/apiReq'
import { isTokenValid, loadTokens } from '#/auth/tokens'
import { alertsQueryOptions } from '#/api/alertsQueryOptions'
import type { AlertDto, WebhookDto } from '#/api/alertsQueryOptions'
import { configQueryOptions } from '#/config'
import type { AppConfig } from '#/config'
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from '@tanstack/react-router'
import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'

// ---- Types -------------------------------------------------------------------

type CheckKey = 'uptime' | 'rename' | 'version' | 'tlsChange' | 'tlsExpiry'

interface AlertEventDto {
  when: string
  description: string
  detail?: string
  kind: string
}

interface AlertEventsResponse {
  events: AlertEventDto[]
}

interface EmailDto {
  id: string
  email: string
  verified: boolean
  receives_alerts: boolean
  created_at: string
}

interface AccountInfo {
  email: string
  email_verified: boolean
  additional_emails: EmailDto[]
}

interface DeliveryDto {
  id: string
  event_type: string
  status: string
  attempts: number
  last_status_code: number | null
  last_error: string | null
  created_at: string
  delivered_at: string | null
}

// ---- Route -------------------------------------------------------------------

export const Route = createFileRoute('/alerts/edit')({
  beforeLoad: ({ location }) => {
    const token = loadTokens()
    if (!token || !isTokenValid(token)) {
      throw redirect({
        to: '/alerts/login',
        search: { redirect: location.pathname + location.searchStr },
      })
    }
  },
  validateSearch: (
    s: Record<string, unknown>,
  ): { id: number; domain: string } => ({
    id: typeof s.id === 'number' ? s.id : Number(s.id) || 0,
    domain: typeof s.domain === 'string' ? s.domain : '',
  }),
  component: RouteComponent,
})

// ---- Query options -----------------------------------------------------------

const alertQueryOptions = (cfg: AppConfig | undefined, id: number) =>
  queryOptions({
    queryKey: ['alerts', 'single', id, cfg?.api_server_url] as const,
    queryFn: async () => {
      const res = await apiReq(`${cfg!.api_server_url}/api/v2/alerts/${id}`)
      if (!res.ok) throw new Error('Failed to load alert')
      return res.json() as Promise<AlertDto>
    },
    enabled: !!cfg && id > 0,
  })

const alertEventsQueryOptions = (cfg: AppConfig | undefined, id: number) =>
  queryOptions({
    queryKey: ['alerts', 'events', id, cfg?.api_server_url] as const,
    queryFn: async () => {
      const res = await apiReq(
        `${cfg!.api_server_url}/api/v2/alerts/${id}/events`,
      )
      if (!res.ok) throw new Error('Failed to load events')
      return res.json() as Promise<AlertEventsResponse>
    },
    enabled: !!cfg && id > 0,
  })

const accountQueryOptions = (cfg: AppConfig | undefined) =>
  queryOptions({
    queryKey: ['account', 'me', cfg?.api_server_url] as const,
    queryFn: async () => {
      const res = await apiReq(`${cfg!.api_server_url}/oauth2/account/me`)
      if (!res.ok) throw new Error('Failed to load account')
      return res.json() as Promise<AccountInfo>
    },
    enabled: !!cfg,
  })

const webhookDeliveryQueryOptions = (
  cfg: AppConfig | undefined,
  alertId: number,
  webhookId: number,
  enabled: boolean,
) =>
  queryOptions({
    queryKey: [
      'alerts',
      alertId,
      'webhook',
      webhookId,
      'deliveries',
      cfg?.api_server_url,
    ] as const,
    queryFn: async () => {
      const res = await apiReq(
        `${cfg!.api_server_url}/api/v2/alerts/${alertId}/notify-webhooks/${webhookId}/deliveries`,
      )
      if (!res.ok) throw new Error('Failed to load deliveries')
      return res.json() as Promise<{ deliveries: DeliveryDto[] }>
    },
    enabled: !!cfg && enabled,
  })

// ---- Helpers -----------------------------------------------------------------

const CHECK_KEYS: CheckKey[] = [
  'uptime',
  'rename',
  'version',
  'tlsChange',
  'tlsExpiry',
]

const fmt = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

function safeDate(iso: string | null | undefined): Date | null {
  if (!iso) return null
  const d = new Date(iso)
  return isFinite(d.getTime()) ? d : null
}

function fmtEventTime(iso: string): string {
  const d = safeDate(iso)
  if (!d) return '—'
  const now = Date.now()
  const diff = now - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return fmt.format(d)
}

// ---- WebhookRow sub-component -----------------------------------------------

function WebhookRow({
  wh,
  alertId,
  cfg,
  onMutated,
}: {
  wh: WebhookDto
  alertId: number
  cfg: AppConfig | undefined
  onMutated: () => void
}) {
  const { t } = useTranslation()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showDeliveries, setShowDeliveries] = useState(false)
  const [testFeedback, setTestFeedback] = useState<'idle' | 'ok' | 'error'>(
    'idle',
  )

  const { data: deliveryData } = useQuery(
    webhookDeliveryQueryOptions(cfg, alertId, wh.id, showDeliveries),
  )

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiReq(
        `${cfg!.api_server_url}/api/v2/alerts/${alertId}/notify-webhooks/${wh.id}`,
        { method: 'DELETE' },
      )
      if (!res.ok && res.status !== 204) throw new Error('Failed to delete')
    },
    onSuccess: onMutated,
  })

  const testMutation = useMutation({
    mutationFn: async () => {
      const res = await apiReq(
        `${cfg!.api_server_url}/api/v2/alerts/${alertId}/notify-webhooks/${wh.id}/test`,
        { method: 'POST' },
      )
      if (!res.ok && res.status !== 202) throw new Error('Failed to queue test')
    },
    onSuccess: () => setTestFeedback('ok'),
    onError: () => setTestFeedback('error'),
  })

  const deliveryStatusColor = (status: string) => {
    if (status === 'delivered') return 'var(--ok-deep)'
    if (status === 'failed') return 'var(--bad-deep)'
    return 'var(--ink-3)'
  }

  return (
    <div
      style={{
        padding: '12px 14px',
        border: '1.5px solid var(--line)',
        borderRadius: 5,
        background: '#fff',
        marginBottom: 8,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 12.5,
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {wh.url}
        </span>
        {wh.respect_quiet_hours && (
          <span
            style={{
              fontSize: 11,
              color: 'var(--ink-3)',
              border: '1px solid var(--line)',
              borderRadius: 4,
              padding: '2px 6px',
              whiteSpace: 'nowrap',
            }}
          >
            {t('alerts.webhooks.quietHours')}
          </span>
        )}
        <button
          type="button"
          onClick={() => {
            setTestFeedback('idle')
            testMutation.mutate()
          }}
          disabled={testMutation.isPending}
          style={{
            fontSize: 12,
            padding: '4px 10px',
            borderRadius: 4,
            border: '1px solid var(--line)',
            background:
              testFeedback === 'ok'
                ? 'var(--ok-light)'
                : testFeedback === 'error'
                  ? 'var(--bad-light)'
                  : '#fff',
            color:
              testFeedback === 'ok'
                ? 'var(--ok-deep)'
                : testFeedback === 'error'
                  ? 'var(--bad-deep)'
                  : 'var(--ink)',
            cursor: 'pointer',
          }}
        >
          {testFeedback === 'ok'
            ? t('alerts.webhooks.testQueued')
            : testFeedback === 'error'
              ? t('alerts.webhooks.testFailed')
              : t('alerts.webhooks.test')}
        </button>
        <button
          type="button"
          onClick={() => setShowDeliveries((v) => !v)}
          style={{
            fontSize: 12,
            padding: '4px 10px',
            borderRadius: 4,
            border: '1px solid var(--line)',
            background: showDeliveries ? 'var(--surface-2)' : '#fff',
            color: 'var(--ink-2)',
            cursor: 'pointer',
          }}
        >
          {t('alerts.webhooks.deliveries')}
        </button>
        {confirmDelete ? (
          <>
            <button
              type="button"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              style={{
                fontSize: 12,
                padding: '4px 10px',
                borderRadius: 4,
                border: '1px solid var(--bad-deep)',
                background: 'var(--bad-light, #fff0f0)',
                color: 'var(--bad-deep)',
                cursor: 'pointer',
              }}
            >
              {t('account.delete.confirmButton')}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              style={{
                fontSize: 12,
                padding: '4px 10px',
                borderRadius: 4,
                border: '1px solid var(--line)',
                background: '#fff',
                color: 'var(--ink-3)',
                cursor: 'pointer',
              }}
            >
              {t('account.delete.cancelButton')}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            style={{
              fontSize: 12,
              padding: '4px 10px',
              borderRadius: 4,
              border: '1px solid var(--line)',
              background: '#fff',
              color: 'var(--bad-deep)',
              cursor: 'pointer',
            }}
          >
            {t('alerts.webhooks.remove')}
          </button>
        )}
      </div>

      {showDeliveries && (
        <div
          style={{
            marginTop: 10,
            borderTop: '1px solid var(--line-2)',
            paddingTop: 10,
          }}
        >
          {!deliveryData ? (
            <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>
              {t('account.loading')}
            </p>
          ) : deliveryData.deliveries.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>
              {t('alerts.webhooks.noDeliveries')}
            </p>
          ) : (
            <table
              style={{
                width: '100%',
                fontSize: 12,
                borderCollapse: 'collapse',
                fontFamily: 'var(--mono)',
              }}
            >
              <thead>
                <tr style={{ color: 'var(--ink-3)', textAlign: 'left' }}>
                  <th style={{ paddingBottom: 4, fontWeight: 500 }}>
                    {t('alerts.webhooks.colEvent')}
                  </th>
                  <th style={{ paddingBottom: 4, fontWeight: 500 }}>
                    {t('alerts.webhooks.colStatus')}
                  </th>
                  <th style={{ paddingBottom: 4, fontWeight: 500 }}>
                    {t('alerts.webhooks.colHttp')}
                  </th>
                  <th style={{ paddingBottom: 4, fontWeight: 500 }}>
                    {t('alerts.webhooks.colWhen')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {deliveryData.deliveries.map((d) => (
                  <tr
                    key={d.id}
                    style={{ borderTop: '1px solid var(--line-2)' }}
                  >
                    <td
                      style={{
                        padding: '4px 8px 4px 0',
                        color: 'var(--ink-2)',
                      }}
                    >
                      {d.event_type}
                    </td>
                    <td
                      style={{
                        padding: '4px 8px',
                        color: deliveryStatusColor(d.status),
                        fontWeight: 600,
                      }}
                    >
                      {d.status}
                    </td>
                    <td style={{ padding: '4px 8px', color: 'var(--ink-3)' }}>
                      {d.last_status_code ?? '—'}
                    </td>
                    <td style={{ padding: '4px 0', color: 'var(--ink-3)' }}>
                      {fmtEventTime(d.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

// ---- Component ---------------------------------------------------------------

function RouteComponent() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { id, domain } = Route.useSearch()

  const { data: cfg } = useQuery(configQueryOptions)
  const {
    data: alert,
    isLoading: alertLoading,
    isError: alertError,
  } = useQuery({ ...alertQueryOptions(cfg, id), retry: 1 })
  const { data: eventsData } = useQuery({
    ...alertEventsQueryOptions(cfg, id),
    retry: 1,
  })
  const { data: account } = useQuery({ ...accountQueryOptions(cfg), retry: 1 })

  // Derive available email addresses from account
  const availableEmails: string[] = account
    ? [
        ...(account.email_verified ? [account.email] : []),
        ...account.additional_emails.flatMap((e) =>
          e.verified ? [e.email] : [],
        ),
      ]
    : []

  // Local state — null means "not yet modified, use server value"
  const [checks, setChecks] = useState<Record<CheckKey, boolean> | null>(null)
  const [selectedEmails, setSelectedEmails] = useState<Set<string> | null>(null)
  const [quietEnabled, setQuietEnabled] = useState<boolean | null>(null)
  const [quietFrom, setQuietFrom] = useState<string | null>(null)
  const [quietTo, setQuietTo] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showAllEvents, setShowAllEvents] = useState(false)

  // Webhook add form state
  const [webhookAddUrl, setWebhookAddUrl] = useState('')
  const [webhookAddSecret, setWebhookAddSecret] = useState('')
  const [webhookAddHeader, setWebhookAddHeader] = useState('X-Signature-256')
  const [webhookAddQuietHours, setWebhookAddQuietHours] = useState(false)
  const [webhookAddError, setWebhookAddError] = useState<string | null>(null)

  // Test email state
  const [testEmailFeedback, setTestEmailFeedback] = useState<
    'idle' | 'ok' | 'error'
  >('idle')

  // Effective values: fall back to loaded alert data
  const effectiveChecks: Record<CheckKey, boolean> = checks ?? {
    uptime: true, // always on — no API toggle yet
    rename: alert?.notify_server_name_change ?? true,
    version: alert?.notify_version_change ?? false,
    tlsChange: alert?.notify_tls_cert_change ?? false,
    tlsExpiry: alert?.notify_tls_expiry ?? true,
  }
  const effectiveEmails: Set<string> =
    selectedEmails ?? new Set(alert?.notify_emails ?? [])
  const effectiveQuietEnabled =
    quietEnabled ?? alert?.quiet_hours_enabled ?? false
  const effectiveQuietFrom = quietFrom ?? alert?.quiet_hours_from ?? '22:00'
  const effectiveQuietTo = quietTo ?? alert?.quiet_hours_to ?? '07:00'

  const toggleCheck = (k: CheckKey) => {
    setChecks((c) => ({
      ...effectiveChecks,
      ...c,
      [k]: !(c ?? effectiveChecks)[k],
    }))
  }
  const toggleEmail = (email: string) => {
    setSelectedEmails((prev) => {
      const next = new Set(prev ?? effectiveEmails)
      if (next.has(email)) next.delete(email)
      else next.add(email)
      return next
    })
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const base = `${cfg!.api_server_url}/api/v2/alerts/${id}`
      const [settingsRes, emailsRes] = await Promise.all([
        apiReq(`${base}/settings`, {
          method: 'PUT',
          body: JSON.stringify({
            notify_server_name_change: effectiveChecks.rename,
            notify_version_change: effectiveChecks.version,
            notify_tls_cert_change: effectiveChecks.tlsChange,
            notify_tls_expiry: effectiveChecks.tlsExpiry,
            quiet_hours_enabled: effectiveQuietEnabled,
            quiet_hours_from: effectiveQuietFrom,
            quiet_hours_to: effectiveQuietTo,
          }),
        }),
        apiReq(`${base}/notify-emails`, {
          method: 'PUT',
          body: JSON.stringify({ emails: [...effectiveEmails] }),
        }),
      ])
      if (!settingsRes.ok) throw new Error('Failed to save settings')
      if (!emailsRes.ok) throw new Error('Failed to save notification emails')
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: alertQueryOptions(cfg, id).queryKey,
      })
      await queryClient.invalidateQueries({
        queryKey: alertsQueryOptions(cfg).queryKey,
      })
      void navigate({ to: '/alerts' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiReq(`${cfg!.api_server_url}/api/v2/alerts/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok && res.status !== 204)
        throw new Error('Failed to delete alert')
    },
    onSuccess: () => {
      queryClient.removeQueries({
        queryKey: alertQueryOptions(cfg, id).queryKey,
      })
      void queryClient.invalidateQueries({
        queryKey: alertsQueryOptions(cfg).queryKey,
      })
      void navigate({ to: '/alerts' })
    },
  })

  const addWebhookMutation = useMutation({
    mutationFn: async () => {
      if (!webhookAddUrl.startsWith('https://')) {
        throw new Error(t('alerts.webhooks.urlHttpsRequired'))
      }
      const body: Record<string, unknown> = { url: webhookAddUrl }
      if (webhookAddSecret) body.hmac_secret = webhookAddSecret
      if (webhookAddHeader && webhookAddHeader !== 'X-Signature-256') {
        body.hmac_header = webhookAddHeader
      }
      if (webhookAddQuietHours) body.respect_quiet_hours = true
      const res = await apiReq(
        `${cfg!.api_server_url}/api/v2/alerts/${id}/notify-webhooks`,
        { method: 'POST', body: JSON.stringify(body) },
      )
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as {
          error?: string
        }
        throw new Error(err.error ?? 'Failed to add webhook')
      }
    },
    onSuccess: async () => {
      setWebhookAddUrl('')
      setWebhookAddSecret('')
      setWebhookAddHeader('X-Signature-256')
      setWebhookAddQuietHours(false)
      setWebhookAddError(null)
      await queryClient.invalidateQueries({
        queryKey: alertQueryOptions(cfg, id).queryKey,
      })
    },
    onError: (err) => {
      setWebhookAddError(
        err instanceof Error ? err.message : 'Failed to add webhook',
      )
    },
  })

  const testEmailMutation = useMutation({
    mutationFn: async () => {
      const res = await apiReq(
        `${cfg!.api_server_url}/api/v2/alerts/${id}/test-email`,
        { method: 'POST' },
      )
      if (!res.ok && res.status !== 202)
        throw new Error('Failed to send test email')
    },
    onSuccess: () => setTestEmailFeedback('ok'),
    onError: () => setTestEmailFeedback('error'),
  })

  const handleWebhookMutated = () => {
    void queryClient.invalidateQueries({
      queryKey: alertQueryOptions(cfg, id).queryKey,
    })
  }

  if (alertLoading) {
    return (
      <div>
        <Navbar />
        <main id="main" className="page">
          <p>{t('account.loading')}</p>
        </main>
        <Footer />
      </div>
    )
  }

  if (alertError && !alert) {
    return (
      <div>
        <Navbar />
        <main id="main" className="page">
          <div className="breadcrumb">
            <Link to="/">{t('nav.home')}</Link>
            <span className="breadcrumb__sep" aria-hidden="true">
              ›
            </span>
            <Link to="/alerts">{t('nav.alerts')}</Link>
            <span className="breadcrumb__sep" aria-hidden="true">
              ›
            </span>
            <span>{t('alerts.edit.breadcrumb')}</span>
          </div>
          <p style={{ color: 'var(--bad-deep)' }}>{t('account.error')}</p>
          <Link to="/alerts">{t('alerts.edit.cancel')}</Link>
        </main>
        <Footer />
      </div>
    )
  }

  const effectiveDomain = alert?.server_name ?? domain

  return (
    <div>
      <Navbar />
      <main id="main" className="page">
        <div className="breadcrumb">
          <Link to="/">{t('nav.home')}</Link>
          <span className="breadcrumb__sep" aria-hidden="true">
            ›
          </span>
          <Link to="/alerts">{t('nav.alerts')}</Link>
          <span className="breadcrumb__sep" aria-hidden="true">
            ›
          </span>
          <span>{t('alerts.edit.breadcrumb')}</span>
        </div>

        <h1>
          {t('alerts.edit.headline')}{' '}
          <span
            style={{
              fontFamily: 'var(--mono)',
              fontWeight: 600,
              fontSize: '0.78em',
            }}
          >
            {effectiveDomain}
          </span>
        </h1>
        <p className="lead">{t('alerts.edit.lead')}</p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 1fr',
            gap: 32,
            marginTop: 24,
            alignItems: 'start',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card
              as="form"
              onSubmit={(e) => {
                e.preventDefault()
                saveMutation.mutate()
              }}
            >
              <h2
                style={{
                  fontSize: 22,
                  margin: '0 0 4px',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                }}
              >
                {t('alerts.edit.watchTitle')}
              </h2>
              <p
                style={{
                  margin: '0 0 18px',
                  fontSize: 14,
                  color: 'var(--ink-3)',
                }}
              >
                {t('alerts.edit.watchDescription')}
              </p>

              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {CHECK_KEYS.map((key) => {
                  const on = effectiveChecks[key]
                  const disabled = key === 'uptime'
                  return (
                    <li key={key}>
                      <label
                        htmlFor={`alert-${key}`}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'auto 1fr auto',
                          gap: 14,
                          alignItems: 'start',
                          padding: '14px 16px',
                          background: on ? '#fff' : 'var(--surface-2)',
                          border:
                            '1.5px solid ' +
                            (on ? 'var(--ink)' : 'var(--line)'),
                          borderRadius: 5,
                          cursor: disabled ? 'default' : 'pointer',
                          opacity: disabled ? 0.7 : 1,
                        }}
                      >
                        <input
                          id={`alert-${key}`}
                          type="checkbox"
                          checked={on}
                          disabled={disabled}
                          onChange={() => !disabled && toggleCheck(key)}
                          style={{
                            marginTop: 4,
                            width: 18,
                            height: 18,
                            accentColor: 'var(--ink)',
                          }}
                        />
                        <div>
                          <div
                            style={{
                              fontSize: 15,
                              fontWeight: 600,
                              color: 'var(--ink)',
                            }}
                          >
                            {t(`alerts.edit.types.${key}.title`)}
                          </div>
                          <div
                            style={{
                              fontSize: 13.5,
                              color: 'var(--ink-2)',
                              marginTop: 4,
                              lineHeight: 1.55,
                            }}
                          >
                            {t(`alerts.edit.types.${key}.detail`)}
                          </div>
                          <div
                            style={{
                              fontSize: 12.5,
                              color: 'var(--ink-3)',
                              marginTop: 6,
                              fontStyle: 'italic',
                            }}
                          >
                            {t(`alerts.edit.types.${key}.hint`)}
                          </div>
                        </div>
                        <Pill kind={on ? 'ok' : undefined} dot={on}>
                          {on
                            ? t('alerts.edit.pillOn')
                            : t('alerts.edit.pillOff')}
                        </Pill>
                      </label>
                    </li>
                  )
                })}
              </ul>

              <h2
                style={{
                  fontSize: 22,
                  margin: '32px 0 4px',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                }}
              >
                {t('alerts.edit.notifyTitle')}
              </h2>
              <p
                style={{
                  margin: '0 0 12px',
                  fontSize: 14,
                  color: 'var(--ink-3)',
                }}
              >
                {t('alerts.edit.notifyHint')}
              </p>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  padding: 12,
                  border: '1.5px solid var(--line-2)',
                  borderRadius: 5,
                  background: '#fff',
                }}
              >
                {availableEmails.length === 0 && (
                  <span style={{ fontSize: 14, color: 'var(--ink-3)' }}>
                    <Trans
                      i18nKey="alerts.authed.form.noAddresses"
                      components={{ addLink: <a href="/account#emails" /> }}
                    />
                  </span>
                )}
                {availableEmails.map((addr) => {
                  const sel = effectiveEmails.has(addr)
                  return (
                    <label
                      key={addr}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 14px',
                        borderRadius: 999,
                        background: sel ? 'var(--ink)' : 'var(--surface-2)',
                        color: sel ? 'var(--surface)' : 'var(--ink)',
                        fontFamily: 'var(--mono)',
                        fontSize: 13,
                        cursor: 'pointer',
                        border:
                          '1px solid ' + (sel ? 'var(--ink)' : 'var(--line)'),
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={sel}
                        onChange={() => toggleEmail(addr)}
                        style={{ display: 'none' }}
                      />
                      {sel ? '✓ ' : '+ '}
                      {addr}
                    </label>
                  )
                })}
              </div>

              {/* Test email */}
              {(alert?.notify_emails ?? []).length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setTestEmailFeedback('idle')
                      testEmailMutation.mutate()
                    }}
                    disabled={testEmailMutation.isPending}
                    style={{
                      fontSize: 13,
                      padding: '5px 12px',
                      borderRadius: 4,
                      border: '1px solid var(--line)',
                      background:
                        testEmailFeedback === 'ok'
                          ? 'var(--ok-light)'
                          : testEmailFeedback === 'error'
                            ? 'var(--bad-light, #fff0f0)'
                            : '#fff',
                      color:
                        testEmailFeedback === 'ok'
                          ? 'var(--ok-deep)'
                          : testEmailFeedback === 'error'
                            ? 'var(--bad-deep)'
                            : 'var(--ink)',
                      cursor: 'pointer',
                    }}
                  >
                    {testEmailFeedback === 'ok'
                      ? t('alerts.webhooks.testEmailSent', {
                          count: alert?.notify_emails.length ?? 0,
                        })
                      : t('alerts.webhooks.testEmail')}
                  </button>
                </div>
              )}

              {saveMutation.isError && (
                <p
                  style={{
                    color: 'var(--bad-deep)',
                    fontSize: 14,
                    marginTop: 8,
                  }}
                >
                  {saveMutation.error instanceof Error
                    ? saveMutation.error.message
                    : 'Failed to save'}
                </p>
              )}
              {deleteMutation.isError && (
                <p
                  style={{
                    color: 'var(--bad-deep)',
                    fontSize: 14,
                    marginTop: 8,
                  }}
                >
                  {deleteMutation.error instanceof Error
                    ? deleteMutation.error.message
                    : 'Failed to delete'}
                </p>
              )}

              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  marginTop: 28,
                  alignItems: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <Button type="submit" disabled={saveMutation.isPending}>
                  {t('alerts.edit.save')}
                </Button>
                <Button
                  kind="ghost"
                  type="button"
                  onClick={() => void navigate({ to: '/alerts' })}
                >
                  {t('alerts.edit.cancel')}
                </Button>
                <span style={{ flex: 1 }} />
                {confirmDelete ? (
                  <>
                    <Button
                      kind="danger"
                      type="button"
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate()}
                    >
                      {t('account.delete.confirmButton')}
                    </Button>
                    <Button
                      kind="ghost"
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                    >
                      {t('account.delete.cancelButton')}
                    </Button>
                  </>
                ) : (
                  <Button
                    kind="danger"
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                  >
                    {t('alerts.edit.delete')}
                  </Button>
                )}
              </div>
            </Card>

            {/* Webhook management card */}
            <Card>
              <h2
                style={{
                  fontSize: 22,
                  margin: '0 0 4px',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                }}
              >
                {t('alerts.webhooks.title')}
              </h2>
              <p
                style={{
                  margin: '0 0 16px',
                  fontSize: 14,
                  color: 'var(--ink-3)',
                }}
              >
                {t('alerts.webhooks.description')}
              </p>

              {(alert?.notify_webhooks ?? []).length === 0 ? (
                <p
                  style={{
                    fontSize: 14,
                    color: 'var(--ink-3)',
                    marginBottom: 16,
                  }}
                >
                  {t('alerts.webhooks.noWebhooks')}
                </p>
              ) : (
                <div style={{ marginBottom: 16 }}>
                  {(alert?.notify_webhooks ?? []).map((wh) => (
                    <WebhookRow
                      key={wh.id}
                      wh={wh}
                      alertId={id}
                      cfg={cfg}
                      onMutated={handleWebhookMutated}
                    />
                  ))}
                </div>
              )}

              {/* Add webhook form */}
              <div
                style={{
                  padding: '14px 16px',
                  border: '1.5px dashed var(--line-2)',
                  borderRadius: 5,
                  background: 'var(--surface-2)',
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 14,
                    marginBottom: 12,
                    color: 'var(--ink)',
                  }}
                >
                  {t('alerts.webhooks.add')}
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div>
                    <label
                      htmlFor="webhook-add-url"
                      style={{
                        display: 'block',
                        fontSize: 11,
                        color: 'var(--ink-3)',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        marginBottom: 4,
                      }}
                    >
                      {t('alerts.webhooks.url')}
                    </label>
                    <input
                      id="webhook-add-url"
                      className="field__input small"
                      type="url"
                      placeholder="https://hooks.example.com/…"
                      value={webhookAddUrl}
                      onChange={(e) => setWebhookAddUrl(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        fontSize: 13,
                      }}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="webhook-add-secret"
                      style={{
                        display: 'block',
                        fontSize: 11,
                        color: 'var(--ink-3)',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        marginBottom: 4,
                      }}
                    >
                      {t('alerts.webhooks.secretHint')}
                    </label>
                    <input
                      id="webhook-add-secret"
                      className="field__input small"
                      type="password"
                      placeholder="—"
                      value={webhookAddSecret}
                      onChange={(e) => setWebhookAddSecret(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        fontSize: 13,
                      }}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="webhook-add-header"
                      style={{
                        display: 'block',
                        fontSize: 11,
                        color: 'var(--ink-3)',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        marginBottom: 4,
                      }}
                    >
                      {t('alerts.webhooks.headerHint')}
                    </label>
                    <input
                      id="webhook-add-header"
                      className="field__input small"
                      type="text"
                      placeholder="X-Signature-256"
                      value={webhookAddHeader}
                      onChange={(e) => setWebhookAddHeader(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        fontSize: 13,
                      }}
                    />
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginTop: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 13,
                      cursor: 'pointer',
                      color: 'var(--ink-2)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={webhookAddQuietHours}
                      onChange={(e) =>
                        setWebhookAddQuietHours(e.target.checked)
                      }
                      style={{
                        width: 14,
                        height: 14,
                        accentColor: 'var(--ink)',
                      }}
                    />
                    {t('alerts.webhooks.quietHoursLabel')}
                  </label>
                  <Button
                    kind="ghost"
                    type="button"
                    disabled={
                      addWebhookMutation.isPending || !webhookAddUrl.trim()
                    }
                    onClick={() => addWebhookMutation.mutate()}
                  >
                    {t('alerts.webhooks.addButton')}
                  </Button>
                </div>
                {webhookAddError && (
                  <p
                    style={{
                      color: 'var(--bad-deep)',
                      fontSize: 13,
                      marginTop: 6,
                    }}
                  >
                    {webhookAddError}
                  </p>
                )}
              </div>
            </Card>
          </div>

          <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card variant="stone">
              <div className="eyebrow">{t('alerts.edit.status.eyebrow')}</div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginTop: 6,
                }}
              >
                {alert?.is_currently_failing ? (
                  <Pill kind="bad" dot>
                    {t('alerts.authed.pills.failing')}
                  </Pill>
                ) : (
                  <Pill kind="ok" dot>
                    {t('alerts.authed.pills.healthy')}
                  </Pill>
                )}
                {alert?.last_check_at && (
                  <span style={{ fontSize: 14, color: 'var(--ink-2)' }}>
                    {fmtEventTime(alert.last_check_at)}
                  </span>
                )}
              </div>
              <a
                href={`/results/?serverName=${encodeURIComponent(effectiveDomain)}`}
                style={{
                  display: 'inline-block',
                  marginTop: 14,
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                {t('alerts.edit.status.diagnosticLink')}
              </a>
            </Card>

            <Card>
              <div className="eyebrow">
                {t('alerts.edit.quietHours.eyebrow')}
              </div>
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.6,
                  margin: '6px 0 14px',
                  color: 'var(--ink-2)',
                }}
              >
                {t('alerts.edit.quietHours.description')}
              </p>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 14,
                  color: 'var(--ink)',
                  cursor: 'pointer',
                  marginBottom: 14,
                }}
              >
                <input
                  type="checkbox"
                  checked={effectiveQuietEnabled}
                  onChange={(e) => setQuietEnabled(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: 'var(--ink)' }}
                />
                <span style={{ fontWeight: 600 }}>
                  {t('alerts.edit.quietHours.enableLabel')}
                </span>
              </label>

              {effectiveQuietEnabled && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto 1fr',
                    gap: 8,
                    alignItems: 'end',
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--ink-3)',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        marginBottom: 4,
                      }}
                    >
                      {t('alerts.edit.quietHours.fromLabel')}
                    </div>
                    <input
                      className="field__input small"
                      type="time"
                      value={effectiveQuietFrom}
                      onChange={(e) => setQuietFrom(e.target.value)}
                      style={{
                        padding: '8px 10px',
                        width: '100%',
                        fontFamily: 'var(--mono)',
                        fontSize: 14,
                        textAlign: 'center',
                      }}
                    />
                  </div>
                  <div style={{ color: 'var(--ink-3)', paddingBottom: 10 }}>
                    –
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--ink-3)',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        marginBottom: 4,
                      }}
                    >
                      {t('alerts.edit.quietHours.toLabel')}
                    </div>
                    <input
                      className="field__input small"
                      type="time"
                      value={effectiveQuietTo}
                      onChange={(e) => setQuietTo(e.target.value)}
                      style={{
                        padding: '8px 10px',
                        width: '100%',
                        fontFamily: 'var(--mono)',
                        fontSize: 14,
                        textAlign: 'center',
                      }}
                    />
                  </div>
                </div>
              )}
            </Card>

            <Card>
              <div className="eyebrow">
                {t('alerts.edit.recentEvents.eyebrow')}
              </div>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '8px 0 0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {!eventsData || eventsData.events.length === 0 ? (
                  <li style={{ fontSize: 13.5, color: 'var(--ink-3)' }}>
                    {t('alerts.edit.recentEvents.noEvents')}
                  </li>
                ) : (
                  <>
                    {(showAllEvents
                      ? eventsData.events
                      : eventsData.events.slice(0, 10)
                    ).map((ev) => (
                      <li
                        key={ev.when}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'max-content 1fr auto',
                          gap: 10,
                          alignItems: 'center',
                          fontSize: 13.5,
                        }}
                      >
                        <span
                          className="mono"
                          style={{ color: 'var(--ink-3)' }}
                        >
                          {fmtEventTime(ev.when)}
                        </span>
                        <span style={{ minWidth: 0 }}>
                          <span
                            style={{
                              color: 'var(--ink-2)',
                              display: 'block',
                            }}
                          >
                            {ev.description}
                          </span>
                          {ev.detail && (
                            <span
                              style={{
                                display: 'block',
                                fontSize: 11.5,
                                color: 'var(--ink-3)',
                                marginTop: 1,
                              }}
                            >
                              {ev.detail}
                            </span>
                          )}
                        </span>
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background:
                              ev.kind === 'bad'
                                ? 'var(--bad-deep)'
                                : ev.kind === 'ok'
                                  ? 'var(--ok-deep)'
                                  : 'var(--ink-3)',
                          }}
                          aria-hidden="true"
                        />
                      </li>
                    ))}
                    {eventsData.events.length > 10 && (
                      <li>
                        <button
                          type="button"
                          onClick={() => setShowAllEvents((v) => !v)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            fontSize: 13,
                            color: 'var(--ink-3)',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                          }}
                        >
                          {showAllEvents
                            ? 'Show fewer'
                            : `Show ${eventsData.events.length - 10} older…`}
                        </button>
                      </li>
                    )}
                  </>
                )}
              </ul>
            </Card>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  )
}
