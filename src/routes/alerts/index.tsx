import Button from '#/components/Button/Button'
import Card from '#/components/Card/Card'
import Field from '#/components/Field/Field'
import Footer from '#/components/Footer/Footer'
import Navbar from '#/components/Navbar/Navbar'
import Pill from '#/components/Pill/Pill'
import Table from '#/components/Table/Table'
import { apiReq } from '#/auth/apiReq'
import { alertsQueryOptions } from '#/api/alertsQueryOptions'
import type { AlertDto } from '#/api/alertsQueryOptions'
import { configQueryOptions } from '#/config'
import type { AppConfig } from '#/config'
import { useAuth } from '#/contexts/AuthContext'
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'

// ---- Types -------------------------------------------------------------------

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

// ---- Route -------------------------------------------------------------------

export const Route = createFileRoute('/alerts/')({
  component: RouteComponent,
})

// ---- Helpers -----------------------------------------------------------------

const fmt = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

function safeDate(iso: string | null | undefined): Date | null {
  if (!iso) return null
  const d = new Date(iso)
  return isFinite(d.getTime()) ? d : null
}

function fmtDate(iso: string | null | undefined): string {
  const d = safeDate(iso)
  return d ? fmt.format(d) : '—'
}

function fmtRelative(iso: string | null | undefined): string {
  const d = safeDate(iso)
  if (!d) return '—'
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '< 1 min ago'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return fmt.format(d)
}

// ---- Query options -----------------------------------------------------------

const accountQueryOptions = (cfg: AppConfig | undefined) =>
  queryOptions({
    queryKey: ['account', 'me', cfg?.api_server_url] as const,
    queryFn: async () => {
      const res = await apiReq(`${cfg!.api_server_url}/oauth2/account/me`)
      if (!res.ok) throw new Error('Failed to load account')
      return res.json() as Promise<AccountInfo>
    },
  })

// ---- Logged-out view ---------------------------------------------------------

function LoggedOutView() {
  const { t } = useTranslation()
  const features = [
    { key: 'failure' },
    { key: 'recovery' },
    { key: 'recipients' },
  ] as const
  return (
    <div>
      <Navbar />
      <main id="main" className="page">
        <div className="breadcrumb">
          <a href="/">{t('nav.home')}</a>
          <span className="breadcrumb__sep" aria-hidden="true">
            ›
          </span>
          <span>{t('nav.alerts')}</span>
        </div>
        <div className="eyebrow">{t('alerts.loggedOut.eyebrow')}</div>
        <h1>{t('alerts.loggedOut.headline')}</h1>
        <p className="lead" style={{ maxWidth: 560 }}>
          {t('alerts.loggedOut.lead')}
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 16,
            marginTop: 32,
          }}
        >
          {features.map(({ key }) => (
            <div key={key} className="card stone">
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>
                {t(`alerts.loggedOut.features.${key}.title`)}
              </h3>
              <p
                style={{
                  fontSize: 14,
                  color: 'var(--ink-2)',
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                {t(`alerts.loggedOut.features.${key}.body`)}
              </p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 32 }}>
          <Link
            to="/alerts/login"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: 'var(--ink)',
              color: 'var(--surface)',
              borderRadius: 5,
              fontWeight: 600,
              fontSize: 15,
              textDecoration: 'none',
            }}
          >
            {t('alerts.loggedOut.cta')}
          </Link>
          <p style={{ marginTop: 12, fontSize: 13, color: 'var(--ink-3)' }}>
            {t('alerts.loggedOut.ctaNote')}
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}

// ---- Main component ----------------------------------------------------------

function RouteComponent() {
  const { isAuthenticated } = useAuth()
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [domain, setDomain] = useState('')
  // null = unmodified, derive from account; Set = user has explicitly chosen
  const [selectedEmails, setSelectedEmails] = useState<Set<string> | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  const { data: cfg } = useQuery(configQueryOptions)

  const { data: account } = useQuery({
    ...accountQueryOptions(cfg),
    enabled: isAuthenticated && !!cfg,
  })

  const {
    data: alertsData,
    isFetching: alertsFetching,
    error: alertsError,
  } = useQuery({
    ...alertsQueryOptions(cfg),
    enabled: isAuthenticated && !!cfg,
  })
  // Show a loading row when authenticated but data hasn't arrived yet (includes
  // the brief window before cfg loads where `enabled` is still false).
  const alertsLoading =
    isAuthenticated && (alertsFetching || (!alertsData && !alertsError))

  // All emails the user can choose as notification recipients
  const allEmails: string[] = account
    ? [
        account.email,
        ...account.additional_emails
          .filter((e) => e.verified)
          .map((e) => e.email),
      ]
    : []

  // Active email selection: user override or default to all verified
  const emailSet: Set<string> =
    selectedEmails ??
    new Set(
      account
        ? [
            ...(account.email_verified ? [account.email] : []),
            ...account.additional_emails
              .filter((e) => e.verified)
              .map((e) => e.email),
          ]
        : [],
    )

  const toggleEmail = (addr: string) => {
    setSelectedEmails((prev) => {
      const next = new Set(prev ?? emailSet)
      if (next.has(addr)) next.delete(addr)
      else next.add(addr)
      return next
    })
  }

  const createAlert = useMutation({
    mutationFn: async ({
      serverName,
      emails,
    }: {
      serverName: string
      emails: string[]
    }) => {
      const res = await apiReq(`${cfg!.api_server_url}/api/v2/alerts`, {
        method: 'POST',
        body: JSON.stringify({ server_name: serverName }),
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as {
          error_description?: string
        }
        throw new Error(err.error_description ?? 'Failed to create alert')
      }
      const created = (await res.json()) as { id: number }
      if (emails.length > 0) {
        await apiReq(
          `${cfg!.api_server_url}/api/v2/alerts/${created.id}/notify-emails`,
          { method: 'PUT', body: JSON.stringify({ emails }) },
        )
      }
    },
    onSuccess: () => {
      setDomain('')
      setSelectedEmails(null)
      queryClient.invalidateQueries({
        queryKey: alertsQueryOptions(cfg).queryKey,
      })
    },
  })

  const deleteAlert = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiReq(`${cfg!.api_server_url}/api/v2/alerts/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok && res.status !== 204) {
        const err = (await res.json().catch(() => ({}))) as {
          error_description?: string
        }
        throw new Error(err.error_description ?? 'Failed to delete alert')
      }
    },
    onSuccess: () => {
      setConfirmDeleteId(null)
      queryClient.invalidateQueries({
        queryKey: alertsQueryOptions(cfg).queryKey,
      })
    },
  })

  if (!isAuthenticated) return <LoggedOutView />

  const pillFor = (alert: AlertDto) => {
    if (!alert.verified)
      return (
        <Pill kind="warn" dot>
          {t('alerts.authed.pills.pending')}
        </Pill>
      )
    if (alert.is_currently_failing)
      return (
        <Pill kind="bad" dot>
          {t('alerts.authed.pills.failing')}
        </Pill>
      )
    return (
      <Pill kind="ok" dot>
        {t('alerts.authed.pills.healthy')}
      </Pill>
    )
  }

  return (
    <div>
      <Navbar />
      <main id="main" className="page">
        <div className="breadcrumb">
          <Link to="/">{t('alerts.authed.breadcrumbHome')}</Link>
          <span className="breadcrumb__sep" aria-hidden="true">
            ›
          </span>
          <span>{t('nav.alerts')}</span>
        </div>
        <h1>{t('alerts.authed.headline')}</h1>
        <p className="lead">{t('alerts.authed.lead')}</p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 1fr',
            gap: 32,
            marginTop: 24,
            alignItems: 'start',
          }}
        >
          <Card
            as="form"
            onSubmit={(e) => {
              e.preventDefault()
              if (!domain.trim()) return
              createAlert.mutate({
                serverName: domain.trim(),
                emails: [...emailSet],
              })
            }}
          >
            <h2
              style={{
                fontSize: 26,
                margin: '0 0 8px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
              }}
            >
              {t('alerts.authed.form.title')}
            </h2>
            <p style={{ margin: '0 0 20px' }}>
              {t('alerts.authed.form.description')}
            </p>

            {createAlert.error && (
              <p
                style={{
                  color: 'var(--bad-deep)',
                  fontSize: 14,
                  margin: '0 0 16px',
                }}
              >
                {createAlert.error.message}
              </p>
            )}

            <Field
              id="alert-domain"
              label={t('alerts.authed.form.domainLabel')}
              hint={
                <Trans
                  i18nKey="alerts.authed.form.domainHint"
                  components={{ code: <code /> }}
                />
              }
            >
              <input
                className="field__input"
                placeholder="example.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
            </Field>

            <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
              <legend className="field__label" style={{ padding: 0 }}>
                {t('alerts.authed.form.notifyLegend')}
              </legend>
              <div className="field__hint">
                {t('alerts.authed.form.notifyHint')}
              </div>
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
                {allEmails.map((addr) => {
                  const sel = emailSet.has(addr)
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
            </fieldset>
            <Button
              type="submit"
              style={{ marginTop: 24 }}
              disabled={createAlert.isPending || !domain.trim()}
            >
              {t('alerts.authed.form.submit')}
            </Button>
          </Card>

          <Card as="aside" variant="stone">
            <div className="eyebrow">
              {t('alerts.authed.addresses.eyebrow')}
            </div>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                marginTop: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {account
                ? [
                    {
                      addr: account.email,
                      verified: account.email_verified,
                      primary: true,
                    },
                    ...account.additional_emails.map((e) => ({
                      addr: e.email,
                      verified: e.verified,
                      primary: false,
                    })),
                  ].map(({ addr, verified, primary }) => (
                    <li
                      key={addr}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 12px',
                        background: '#fff',
                        borderRadius: 5,
                        border: '1px solid var(--line)',
                      }}
                    >
                      <span
                        className="mono"
                        style={{ fontSize: 13, color: 'var(--ink)', flex: 1 }}
                      >
                        {addr}
                      </span>
                      {primary && (
                        <Pill kind="ink">
                          {t('alerts.authed.pills.primary')}
                        </Pill>
                      )}
                      {verified ? (
                        <Pill kind="ok" dot>
                          {t('alerts.authed.pills.verified')}
                        </Pill>
                      ) : (
                        <Pill kind="warn" dot>
                          {t('alerts.authed.pills.pending')}
                        </Pill>
                      )}
                    </li>
                  ))
                : null}
            </ul>
            <a
              href="/account#emails"
              style={{
                display: 'inline-block',
                marginTop: 16,
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              {t('alerts.authed.addresses.addLink')}
            </a>
          </Card>
        </div>

        <h2>{t('alerts.authed.headline')}</h2>

        {alertsError && (
          <p style={{ color: 'var(--bad-deep)', fontSize: 14 }}>
            {alertsError instanceof Error
              ? alertsError.message
              : 'Failed to load alerts'}
          </p>
        )}
        {deleteAlert.error && (
          <p style={{ color: 'var(--bad-deep)', fontSize: 14 }}>
            {deleteAlert.error instanceof Error
              ? deleteAlert.error.message
              : 'Failed to delete alert'}
          </p>
        )}

        <Card flush>
          <Table>
            <thead>
              <tr>
                <th scope="col">{t('alerts.authed.table.colServer')}</th>
                <th scope="col">{t('alerts.authed.table.colStatus')}</th>
                <th scope="col">{t('alerts.authed.table.colLastCheck')}</th>
                <th scope="col">{t('alerts.authed.table.colNotifies')}</th>
                <th scope="col">
                  <span className="sr-only">
                    {t('alerts.authed.table.colActions')}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {alertsLoading && (
                <tr>
                  <td
                    colSpan={5}
                    style={{ color: 'var(--ink-3)', textAlign: 'center' }}
                  >
                    Loading…
                  </td>
                </tr>
              )}
              {alertsData?.alerts.map((alert) => (
                <tr key={alert.id}>
                  <td>
                    <div
                      className="mono"
                      style={{ fontWeight: 600, color: 'var(--ink)' }}
                    >
                      {alert.server_name}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--ink-3)',
                        marginTop: 2,
                      }}
                    >
                      {t('alerts.authed.table.added', {
                        date: fmtDate(alert.created_at),
                      })}
                    </div>
                  </td>
                  <td>{pillFor(alert)}</td>
                  <td className="mono" style={{ fontSize: 13 }}>
                    {fmtRelative(alert.last_check_at)}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {alert.notify_emails.map((rc) => (
                        <span
                          key={rc}
                          className="pill ink"
                          style={{
                            fontFamily: 'var(--mono)',
                            fontSize: 12,
                            padding: '4px 10px',
                          }}
                        >
                          {rc}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {confirmDeleteId === alert.id ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Button
                          kind="danger"
                          size="small"
                          disabled={deleteAlert.isPending}
                          onClick={() => deleteAlert.mutate(alert.id)}
                        >
                          Confirm
                        </Button>
                        <Button
                          kind="ghost"
                          size="small"
                          onClick={() => setConfirmDeleteId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link
                          to="/alerts/edit"
                          search={{ id: alert.id, domain: alert.server_name }}
                        >
                          <Button kind="ghost" size="small" as="span">
                            {t('alerts.authed.table.edit')}
                          </Button>
                        </Link>
                        <Button
                          kind="danger"
                          size="small"
                          onClick={() => setConfirmDeleteId(alert.id)}
                        >
                          {t('alerts.authed.table.delete')}
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
        <p style={{ marginTop: 16, fontSize: 14, color: 'var(--ink-3)' }}>
          {t('alerts.authed.table.footerNote')}
        </p>
      </main>
      <Footer />
    </div>
  )
}
