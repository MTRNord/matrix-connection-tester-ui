import Button from '#/components/Button/Button'
import Card from '#/components/Card/Card'
import Field from '#/components/Field/Field'
import Footer from '#/components/Footer/Footer'
import Navbar from '#/components/Navbar/Navbar'
import Pill from '#/components/Pill/Pill'
import Table from '#/components/Table/Table'
import TimezoneSelect from '#/components/TimezoneSelect/TimezoneSelect'
import { apiReq } from '#/auth/apiReq'
import { isTokenValid, loadTokens } from '#/auth/tokens'
import { configQueryOptions } from '#/config'
import type { AppConfig } from '#/config'
import { useAuth } from '#/contexts/AuthContext'
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
import { useTranslation } from 'react-i18next'

// ---- API types ----------------------------------------------------------------

interface EmailDto {
  id: string
  email: string
  verified: boolean
  receives_alerts: boolean
  timezone: string
  created_at: string
}

interface AccountInfo {
  user_id: string
  email: string
  email_verified: boolean
  receives_alerts: boolean
  timezone: string
  has_password: boolean
  created_at: string
  last_login_at?: string | null
  name?: string | null
  additional_emails: EmailDto[]
}

// ---- Route -------------------------------------------------------------------

export const Route = createFileRoute('/account')({
  beforeLoad: ({ location }) => {
    const token = loadTokens()
    if (!token || !isTokenValid(token)) {
      throw redirect({
        to: '/alerts/login',
        search: { redirect: location.pathname + location.searchStr },
      })
    }
  },
  component: RouteComponent,
})

// ---- Helper ------------------------------------------------------------------

const fmt = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

// Mirrors server-side entropy formula: entropy = length × log2(pool_size)
const PW_LEVELS = [
  {
    max: 40,
    label: 'password.strength.veryWeak',
    color: '#d4351c',
    accepted: false,
  },
  {
    max: 55,
    label: 'password.strength.weak',
    color: '#f47738',
    accepted: false,
  },
  {
    max: 65,
    label: 'password.strength.fair',
    color: '#ffdd00',
    accepted: true,
  },
  {
    max: 80,
    label: 'password.strength.strong',
    color: '#00703c',
    accepted: true,
  },
  {
    max: Infinity,
    label: 'password.strength.veryStrong',
    color: '#005a30',
    accepted: true,
  },
]

function passwordEntropy(pw: string): number {
  if (!pw) return 0
  let pool = 0
  if (/[a-z]/.test(pw)) pool += 26
  if (/[A-Z]/.test(pw)) pool += 26
  if (/[0-9]/.test(pw)) pool += 10
  if (/[^a-zA-Z0-9]/.test(pw)) pool += 32
  if (pool === 0) return 0
  return pw.length * Math.log2(pool)
}

function checkPwRequirements(pw: string): string[] {
  const issues: string[] = []
  if (pw.length < 8) issues.push('password.requirements.length')
  if (!/[A-Z]/.test(pw)) issues.push('password.requirements.uppercase')
  if (!/[a-z]/.test(pw)) issues.push('password.requirements.lowercase')
  if (!/[0-9]/.test(pw)) issues.push('password.requirements.number')
  if (!/[^a-zA-Z0-9]/.test(pw)) issues.push('password.requirements.special')
  return issues
}

// ---- Query options -----------------------------------------------------------

const accountQueryOptions = (cfg: AppConfig | undefined) =>
  queryOptions({
    queryKey: ['account', 'me', cfg?.api_server_url] as const,
    queryFn: async () => {
      const res = await apiReq(`${cfg!.api_server_url}/oauth2/account/me`)
      if (!res.ok) throw new Error('Failed to load account info')
      return res.json() as Promise<AccountInfo>
    },
  })

// ---- Component ---------------------------------------------------------------

function RouteComponent() {
  const { t } = useTranslation()
  const ta = (key: string, opts?: Record<string, unknown>) =>
    t(`account.${key}`, opts)
  const { logout } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [addEmailVal, setAddEmailVal] = useState('')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showDelete, setShowDelete] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [tz, setTz] = useState<Record<string, string> | null>(null)

  const { data: cfg } = useQuery(configQueryOptions)

  const {
    data: account,
    isLoading,
    error: accountError,
  } = useQuery({ ...accountQueryOptions(cfg), enabled: !!cfg })

  const addEmail = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiReq(`${cfg!.api_server_url}/oauth2/account/emails`, {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as {
          error_description?: string
        }
        throw new Error(err.error_description ?? 'Failed to add email')
      }
    },
    onSuccess: () => {
      setAddEmailVal('')
      queryClient.invalidateQueries({
        queryKey: accountQueryOptions(cfg).queryKey,
      })
    },
  })

  const removeEmail = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiReq(
        `${cfg!.api_server_url}/oauth2/account/emails/${id}`,
        { method: 'DELETE' },
      )
      if (!res.ok && res.status !== 204) {
        const err = (await res.json().catch(() => ({}))) as {
          error_description?: string
        }
        throw new Error(err.error_description ?? 'Failed to remove email')
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: accountQueryOptions(cfg).queryKey,
      }),
  })

  const changePassword = useMutation({
    mutationFn: async (data: {
      current_password?: string
      new_password: string
      confirm_new_password: string
    }) => {
      const res = await apiReq(
        `${cfg!.api_server_url}/oauth2/account/password`,
        {
          method: 'PATCH',
          body: JSON.stringify(data),
        },
      )
      if (!res.ok && res.status !== 204) {
        const err = (await res.json().catch(() => ({}))) as {
          error_description?: string
        }
        throw new Error(err.error_description ?? 'Failed to change password')
      }
    },
    onSuccess: () => {
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
      void queryClient.invalidateQueries({
        queryKey: accountQueryOptions(cfg).queryKey,
      })
    },
  })

  const setupPassword = useMutation({
    mutationFn: async () => {
      const res = await apiReq(
        `${cfg!.api_server_url}/oauth2/account/password/setup-email`,
        { method: 'POST' },
      )
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as {
          error_description?: string
        }
        throw new Error(err.error_description ?? 'Failed to send setup email')
      }
    },
  })

  const deleteAccount = useMutation({
    mutationFn: async () => {
      const res = await apiReq(`${cfg!.api_server_url}/oauth2/account`, {
        method: 'DELETE',
      })
      if (!res.ok && res.status !== 204) {
        throw new Error('Failed to delete account')
      }
    },
    onSuccess: async () => {
      await logout()
      navigate({ to: '/' })
    },
  })

  const makePrimary = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiReq(
        `${cfg!.api_server_url}/oauth2/account/emails/${id}/primary`,
        { method: 'POST' },
      )
      if (!res.ok && res.status !== 204) {
        const err = (await res.json().catch(() => ({}))) as {
          error_description?: string
        }
        throw new Error(err.error_description ?? 'Failed to make primary')
      }
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: accountQueryOptions(cfg).queryKey,
      }),
  })

  const resendVerification = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiReq(
        `${cfg!.api_server_url}/oauth2/account/emails/${id}/resend`,
        { method: 'POST' },
      )
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as {
          error_description?: string
        }
        throw new Error(
          err.error_description ?? 'Failed to resend verification',
        )
      }
    },
  })

  const savePrimaryTimezone = useMutation({
    mutationFn: async (timezone: string) => {
      const res = await apiReq(`${cfg!.api_server_url}/oauth2/account`, {
        method: 'PATCH',
        body: JSON.stringify({
          receives_alerts: account?.receives_alerts ?? true,
          timezone,
        }),
      })
      if (!res.ok) throw new Error('Failed to save timezone')
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: accountQueryOptions(cfg).queryKey,
      }),
  })

  const saveEmailTimezone = useMutation({
    mutationFn: async ({
      id,
      timezone,
      receives_alerts,
    }: {
      id: string
      timezone: string
      receives_alerts: boolean
    }) => {
      const res = await apiReq(
        `${cfg!.api_server_url}/oauth2/account/emails/${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ receives_alerts, timezone }),
        },
      )
      if (!res.ok) throw new Error('Failed to save timezone')
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: accountQueryOptions(cfg).queryKey,
      }),
  })

  const handleExport = async () => {
    if (!cfg) return
    const res = await apiReq(`${cfg.api_server_url}/oauth2/account/export`)
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'account-data.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <div>
        <Navbar />
        <main id="main" className="page" style={{ color: 'var(--ink-3)' }}>
          {ta('loading')}
        </main>
        <Footer />
      </div>
    )
  }

  if (accountError) {
    return (
      <div>
        <Navbar />
        <main id="main" className="page">
          <p style={{ color: 'var(--bad-deep)' }}>
            {accountError instanceof Error ? accountError.message : ta('error')}
          </p>
        </main>
        <Footer />
      </div>
    )
  }

  if (!account) {
    return (
      <div>
        <Navbar />
        <main id="main" className="page">
          <p style={{ color: 'var(--bad-deep)' }}>{ta('error')}</p>
        </main>
        <Footer />
      </div>
    )
  }

  const navItems: [string, string][] = [
    ['#profile', ta('nav.profile')],
    ['#emails', ta('nav.emails')],
    ['#password', ta('nav.password')],
    ['#export', ta('nav.export')],
    ['#delete', ta('nav.delete')],
  ]

  return (
    <div>
      <Navbar />
      <main id="main" className="page">
        <div className="breadcrumb">
          <Link to="/">{ta('breadcrumb.home')}</Link>
          <span className="breadcrumb__sep" aria-hidden="true">
            ›
          </span>
          <span>{ta('breadcrumb.account')}</span>
        </div>

        <h1>{ta('title')}</h1>
        <p className="lead" style={{ maxWidth: '62ch' }}>
          {ta('leadBefore')}{' '}
          <span
            className="mono"
            style={{ fontSize: '0.92em', color: 'var(--ink)', fontWeight: 600 }}
          >
            {account.email}
          </span>
          {ta('leadAfter')}
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '240px 1fr',
            gap: 56,
            marginTop: 32,
            alignItems: 'start',
            minWidth: 0,
          }}
        >
          {/* ---- Sidebar nav ---- */}
          <aside
            aria-label="Account sections"
            style={{ position: 'sticky', top: 32 }}
          >
            <div className="eyebrow" style={{ marginBottom: 10 }}>
              {ta('nav.onThisPage')}
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {navItems.map(([href, label]) => (
                <li key={href}>
                  <a
                    href={href}
                    style={{
                      display: 'block',
                      padding: '7px 0 7px 12px',
                      fontSize: 14,
                      textDecoration: 'none',
                      color: 'var(--ink-2)',
                      fontWeight: 400,
                      borderLeft: '2px solid transparent',
                      marginLeft: -12,
                    }}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>

            <div
              style={{
                marginTop: 28,
                padding: '16px 0 0',
                borderTop: '1px solid var(--line)',
              }}
            >
              <Button
                kind="ghost"
                size="small"
                onClick={async () => {
                  await logout()
                  navigate({ to: '/' })
                }}
              >
                {ta('nav.signOut')}
              </Button>
            </div>
          </aside>

          {/* ---- Sections ---- */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 32,
              minWidth: 0,
            }}
          >
            {/* ---- Profile ---- */}
            <section id="profile">
              <h2 style={{ marginTop: 0 }}>{ta('profile.title')}</h2>
              <Card flush>
                <Table>
                  <tbody>
                    <tr>
                      <th
                        scope="row"
                        style={{
                          width: 200,
                          fontWeight: 600,
                          color: 'var(--ink)',
                        }}
                      >
                        {ta('profile.memberSince')}
                      </th>
                      <td suppressHydrationWarning>{fmt.format(new Date(account.created_at))}</td>
                    </tr>
                    <tr>
                      <th
                        scope="row"
                        style={{ fontWeight: 600, color: 'var(--ink)' }}
                      >
                        {ta('profile.alerts')}
                      </th>
                      <td>
                        <Link to="/alerts">{ta('profile.manageAlerts')}</Link>
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </Card>
            </section>

            {/* ---- Email addresses ---- */}
            <section id="emails">
              <h2 style={{ marginTop: 0 }}>{ta('emails.title')}</h2>
              <p style={{ maxWidth: '62ch' }}>{ta('emails.description')}</p>

              <Card flush>
                <Table>
                  <thead>
                    <tr>
                      <th scope="col">{ta('emails.table.address')}</th>
                      <th scope="col" style={{ width: 180 }}>
                        {ta('emails.table.status')}
                      </th>
                      <th scope="col" style={{ width: 220 }}>
                        {ta('emails.table.timezone')}
                      </th>
                      <th scope="col" style={{ width: 1 }}>
                        <span className="sr-only">
                          {ta('emails.table.actions')}
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Primary */}
                    <tr>
                      <td>
                        <div
                          className="mono"
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: 'var(--ink)',
                          }}
                        >
                          {account.email}
                        </div>
                        <div
                          suppressHydrationWarning
                          style={{
                            fontSize: 12,
                            color: 'var(--ink-3)',
                            marginTop: 2,
                          }}
                        >
                          {ta('emails.primarySubtext', {
                            date: fmt.format(new Date(account.created_at)),
                          })}
                        </div>
                      </td>
                      <td>
                        <div
                          style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}
                        >
                          <Pill kind="ink">{ta('emails.pills.primary')}</Pill>
                          {account.email_verified ? (
                            <Pill kind="ok" dot>
                              {ta('emails.pills.verified')}
                            </Pill>
                          ) : (
                            <Pill kind="warn" dot>
                              {ta('emails.pills.pending')}
                            </Pill>
                          )}
                        </div>
                      </td>
                      <td>
                        <TimezoneSelect
                          value={tz?.[account.email] ?? account.timezone}
                          onChange={(z) => {
                            setTz((prev) => ({ ...prev, [account.email]: z }))
                            savePrimaryTimezone.mutate(z)
                          }}
                          ariaLabel={`Timezone for ${account.email}`}
                        />
                      </td>
                      <td
                        style={{
                          whiteSpace: 'nowrap',
                          color: 'var(--ink-3)',
                          fontSize: 13,
                        }}
                      >
                        {'—'}
                      </td>
                    </tr>

                    {/* Additional */}
                    {account.additional_emails.map((em) => {
                      const emAddedDate = fmt.format(new Date(em.created_at))
                      return <tr key={em.id}>
                        <td>
                          <div
                            className="mono"
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: 'var(--ink)',
                            }}
                          >
                            {em.email}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: 'var(--ink-3)',
                              marginTop: 2,
                            }}
                          >
                            {ta('emails.addedSubtext', {
                              date: emAddedDate,
                            })}
                          </div>
                        </td>
                        <td>
                          {em.verified ? (
                            <Pill kind="ok" dot>
                              {ta('emails.pills.verified')}
                            </Pill>
                          ) : (
                            <Pill kind="warn" dot>
                              {ta('emails.pills.pending')}
                            </Pill>
                          )}
                        </td>
                        <td>
                          <TimezoneSelect
                            value={tz?.[em.email] ?? em.timezone}
                            onChange={(z) => {
                              setTz((prev) => ({ ...prev, [em.email]: z }))
                              saveEmailTimezone.mutate({
                                id: em.id,
                                timezone: z,
                                receives_alerts: em.receives_alerts,
                              })
                            }}
                            ariaLabel={`Timezone for ${em.email}`}
                          />
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <div
                            style={{
                              display: 'flex',
                              gap: 6,
                              justifyContent: 'flex-end',
                            }}
                          >
                            {!em.verified && (
                              <Button
                                kind="ghost"
                                size="small"
                                disabled={resendVerification.isPending}
                                onClick={() => resendVerification.mutate(em.id)}
                              >
                                {ta('emails.resend')}
                              </Button>
                            )}
                            {em.verified && (
                              <Button
                                kind="ghost"
                                size="small"
                                disabled={makePrimary.isPending}
                                onClick={() => makePrimary.mutate(em.id)}
                              >
                                {ta('emails.makePrimary')}
                              </Button>
                            )}
                            <Button
                              kind="danger"
                              size="small"
                              disabled={removeEmail.isPending}
                              onClick={() => removeEmail.mutate(em.id)}
                            >
                              {ta('emails.remove')}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    })}
                  </tbody>
                </Table>
              </Card>

              {removeEmail.error && (
                <p
                  style={{
                    color: 'var(--bad-deep)',
                    fontSize: 14,
                    marginTop: 8,
                  }}
                >
                  {removeEmail.error.message}
                </p>
              )}
              {resendVerification.error && (
                <p
                  style={{
                    color: 'var(--bad-deep)',
                    fontSize: 14,
                    marginTop: 8,
                  }}
                >
                  {resendVerification.error.message}
                </p>
              )}
              {makePrimary.error && (
                <p
                  style={{
                    color: 'var(--bad-deep)',
                    fontSize: 14,
                    marginTop: 8,
                  }}
                >
                  {makePrimary.error.message}
                </p>
              )}

              <Card
                as="form"
                onSubmit={(e) => {
                  e.preventDefault()
                  addEmail.mutate(addEmailVal)
                }}
                style={{ marginTop: 16 }}
              >
                <h3 style={{ marginTop: 0, fontSize: 19 }}>
                  {ta('emails.addTitle')}
                </h3>
                <p
                  style={{
                    margin: '0 0 14px',
                    fontSize: 14,
                    color: 'var(--ink-3)',
                  }}
                >
                  {ta('emails.addDescription')}
                </p>
                {addEmail.error && (
                  <p
                    style={{
                      color: 'var(--bad-deep)',
                      fontSize: 14,
                      margin: '0 0 8px',
                    }}
                  >
                    {addEmail.error.message}
                  </p>
                )}
                <div
                  style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-end',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ flex: '1 1 320px' }}>
                    <label
                      htmlFor="new-email"
                      className="field__label"
                      style={{ display: 'block', marginBottom: 6 }}
                    >
                      {ta('emails.emailLabel')}
                    </label>
                    <input
                      id="new-email"
                      className="field__input"
                      type="email"
                      autoComplete="email"
                      placeholder={ta('emails.emailPlaceholder')}
                      value={addEmailVal}
                      onChange={(e) => setAddEmailVal(e.target.value)}
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={addEmail.isPending || !addEmailVal}
                  >
                    {ta('emails.addButton')}
                  </Button>
                </div>
              </Card>
            </section>

            {/* ---- Password ---- */}
            <section id="password">
              <h2 style={{ marginTop: 0 }}>{ta('password.title')}</h2>

              {account.has_password ? (
                <>
                  <p style={{ maxWidth: '62ch' }}>
                    {ta('password.hasPasswordDescription')}
                  </p>

                  <Card
                    as="form"
                    onSubmit={(e) => {
                      e.preventDefault()
                      changePassword.mutate({
                        current_password: currentPw,
                        new_password: newPw,
                        confirm_new_password: confirmPw,
                      })
                    }}
                  >
                    {changePassword.error && (
                      <p
                        style={{
                          color: 'var(--bad-deep)',
                          fontSize: 14,
                          margin: '0 0 12px',
                        }}
                      >
                        {changePassword.error.message}
                      </p>
                    )}
                    {changePassword.isSuccess && (
                      <p
                        style={{
                          color: 'var(--ok-deep)',
                          fontSize: 14,
                          margin: '0 0 12px',
                        }}
                      >
                        {ta('password.changeSuccess')}
                      </p>
                    )}

                    <Field
                      id="current-password"
                      label={ta('password.fields.current')}
                    >
                      <input
                        className="field__input"
                        type="password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={currentPw}
                        onChange={(e) => setCurrentPw(e.target.value)}
                      />
                    </Field>

                    <Field id="new-password" label={ta('password.fields.new')}>
                      <input
                        className="field__input"
                        type="password"
                        autoComplete="new-password"
                        value={newPw}
                        onChange={(e) => setNewPw(e.target.value)}
                      />
                    </Field>

                    {newPw.length > 0 &&
                      (() => {
                        const entropy = passwordEntropy(newPw)
                        const levelIdx = PW_LEVELS.findIndex(
                          (l) => entropy < l.max,
                        )
                        const level = PW_LEVELS[levelIdx]
                        const textColor =
                          level.color === '#ffdd00' ? '#594d00' : level.color
                        const issues = checkPwRequirements(newPw)
                        return (
                          <div
                            aria-live="polite"
                            style={{
                              maxWidth: 360,
                              marginTop: -8,
                              marginBottom: 20,
                            }}
                          >
                            <div
                              style={{ display: 'flex', gap: 4 }}
                              aria-hidden="true"
                            >
                              {([0, 1, 2, 3, 4] as const).map((step) => (
                                <div
                                  key={step}
                                  style={{
                                    flex: 1,
                                    height: 6,
                                    borderRadius: 2,
                                    background:
                                      step <= levelIdx
                                        ? level.color
                                        : 'var(--surface-3)',
                                    transition: 'background 120ms ease',
                                  }}
                                />
                              ))}
                            </div>
                            <div
                              style={{
                                marginTop: 8,
                                display: 'flex',
                                justifyContent: 'space-between',
                                gap: 12,
                                alignItems: 'baseline',
                                flexWrap: 'wrap',
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: textColor,
                                }}
                              >
                                {ta(level.label)}{' '}
                                {ta('password.entropyDisplay', {
                                  entropy: Math.round(entropy),
                                })}
                              </span>
                              <span
                                style={{
                                  fontSize: 13,
                                  color:
                                    issues.length > 0 || !level.accepted
                                      ? '#d4351c'
                                      : '#00703c',
                                }}
                              >
                                {issues.length > 0
                                  ? ta('password.missing', {
                                      issues: issues
                                        .map((k) => ta(k))
                                        .join(', '),
                                    })
                                  : level.accepted
                                    ? ta('password.meetsRequirements')
                                    : ta('password.tooWeak')}
                              </span>
                            </div>
                          </div>
                        )
                      })()}

                    <Field
                      id="confirm-password"
                      label={ta('password.fields.confirm')}
                    >
                      <input
                        className="field__input"
                        type="password"
                        autoComplete="new-password"
                        value={confirmPw}
                        onChange={(e) => setConfirmPw(e.target.value)}
                      />
                    </Field>
                    {confirmPw.length > 0 && (
                      <p
                        style={{
                          fontSize: 13,
                          margin: '-8px 0 16px',
                          color: confirmPw === newPw ? '#00703c' : '#d4351c',
                        }}
                      >
                        {confirmPw === newPw
                          ? ta('password.passwordsMatch')
                          : ta('password.passwordsNoMatch')}
                      </p>
                    )}

                    <div
                      style={{
                        display: 'flex',
                        gap: 12,
                        alignItems: 'center',
                        marginTop: 8,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Button type="submit" disabled={changePassword.isPending}>
                        {ta('password.changeButton')}
                      </Button>
                      <Button
                        kind="ghost"
                        onClick={() => {
                          setCurrentPw('')
                          setNewPw('')
                          setConfirmPw('')
                        }}
                      >
                        {ta('password.cancelButton')}
                      </Button>
                    </div>
                  </Card>
                </>
              ) : (
                <>
                  <p style={{ maxWidth: '62ch' }}>
                    {ta('password.noPasswordDescription')}
                  </p>
                  {setupPassword.isSuccess ? (
                    <p style={{ color: 'var(--ok-deep)', fontSize: 14 }}>
                      {ta('password.setupSuccess')}
                    </p>
                  ) : (
                    <Button
                      onClick={() => setupPassword.mutate()}
                      disabled={setupPassword.isPending}
                    >
                      {ta('password.setupButton')}
                    </Button>
                  )}
                  {setupPassword.error && (
                    <p
                      style={{
                        color: 'var(--bad-deep)',
                        fontSize: 14,
                        marginTop: 8,
                      }}
                    >
                      {setupPassword.error.message}
                    </p>
                  )}
                </>
              )}
            </section>

            {/* ---- Download data ---- */}
            <section id="export">
              <h2 style={{ marginTop: 0 }}>{ta('export.title')}</h2>
              <Card>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: 20,
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <p style={{ margin: '0 0 8px' }}>
                      {ta('export.description')}
                    </p>
                    <p
                      style={{ margin: 0, fontSize: 13, color: 'var(--ink-3)' }}
                    >
                      {ta('export.gdpr')}
                    </p>
                  </div>
                  <Button onClick={handleExport}>
                    {ta('export.button')} {}
                    {}
                    {/* eslint-disable i18next/no-literal-string -- file extension */}
                    <span
                      className="mono"
                      style={{ fontSize: '0.85em', marginLeft: 4 }}
                    >
                      .json
                    </span>
                    {/* eslint-enable i18next/no-literal-string */}
                  </Button>
                </div>
              </Card>
            </section>

            {/* ---- Delete account ---- */}
            <section id="delete">
              <h2 style={{ marginTop: 0 }}>{ta('delete.title')}</h2>
              <Card
                style={{
                  borderColor: 'var(--bad-tint)',
                  borderLeft: '4px solid var(--bad-deep)',
                }}
              >
                <h3
                  style={{
                    marginTop: 0,
                    fontSize: 19,
                    color: 'var(--bad-deep)',
                  }}
                >
                  {ta('delete.warning')}
                </h3>
                <p style={{ margin: '0 0 8px' }}>{ta('delete.intro')}</p>
                <ul
                  style={{
                    margin: '0 0 16px',
                    paddingLeft: 20,
                    lineHeight: 1.8,
                    fontSize: 15,
                    color: 'var(--ink-2)',
                  }}
                >
                  <li>{ta('delete.items.profile')}</li>
                  <li>{ta('delete.items.alerts')}</li>
                  <li>{ta('delete.items.history')}</li>
                </ul>
                <p
                  style={{
                    margin: '0 0 16px',
                    fontSize: 14,
                    color: 'var(--ink-3)',
                  }}
                >
                  {ta('delete.statsNote')}
                </p>

                {deleteAccount.error && (
                  <p
                    style={{
                      color: 'var(--bad-deep)',
                      fontSize: 14,
                      margin: '0 0 12px',
                    }}
                  >
                    {deleteAccount.error.message}
                  </p>
                )}

                {!showDelete && (
                  <Button kind="danger" onClick={() => setShowDelete(true)}>
                    {ta('delete.deleteButton')}
                  </Button>
                )}

                {showDelete && (
                  <div
                    style={{
                      padding: 16,
                      background: 'var(--bad-tint)',
                      borderRadius: 5,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: 'var(--bad-deep)',
                        marginBottom: 10,
                      }}
                    >
                      {ta('delete.confirmPrompt')}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: 12,
                        alignItems: 'center',
                        flexWrap: 'wrap',
                      }}
                    >
                      <input
                        className="field__input"
                        style={{ maxWidth: 200, background: '#fff' }}
                        placeholder={ta('delete.confirmPlaceholder')}
                        autoFocus
                        value={deleteConfirm}
                        onChange={(e) => setDeleteConfirm(e.target.value)}
                      />
                      <Button
                        kind="danger"
                        disabled={
                          deleteConfirm !== 'DELETE' || deleteAccount.isPending
                        }
                        onClick={() => deleteAccount.mutate()}
                      >
                        {ta('delete.confirmButton')}
                      </Button>
                      <Button
                        kind="ghost"
                        onClick={() => {
                          setShowDelete(false)
                          setDeleteConfirm('')
                        }}
                      >
                        {ta('delete.cancelButton')}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
