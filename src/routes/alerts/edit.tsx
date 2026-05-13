import Button from '#/components/Button/Button'
import Card from '#/components/Card/Card'
import Footer from '#/components/Footer/Footer'
import Navbar from '#/components/Navbar/Navbar'
import Pill from '#/components/Pill/Pill'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

type CheckKey = 'uptime' | 'rename' | 'version' | 'tlsChange' | 'tlsExpiry'

export const Route = createFileRoute('/alerts/edit')({
  validateSearch: (s: Record<string, unknown>): { domain: string } => ({
    domain: typeof s.domain === 'string' ? s.domain : '',
  }),
  component: RouteComponent,
})

const CHECK_KEYS: CheckKey[] = [
  'uptime',
  'rename',
  'version',
  'tlsChange',
  'tlsExpiry',
]

function RouteComponent() {
  const { t } = useTranslation()
  const { domain } = Route.useSearch()
  const [checks, setChecks] = useState<Record<CheckKey, boolean>>({
    uptime: true,
    rename: true,
    version: false,
    tlsChange: true,
    tlsExpiry: true,
  })
  const toggle = (k: CheckKey) => setChecks((c) => ({ ...c, [k]: !c[k] }))

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
            {domain}
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
          <Card as="form" onSubmit={(e) => e.preventDefault()}>
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
                const on = checks[key]
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
                          '1.5px solid ' + (on ? 'var(--ink)' : 'var(--line)'),
                        borderRadius: 5,
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        id={`alert-${key}`}
                        type="checkbox"
                        checked={on}
                        onChange={() => toggle(key)}
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
              {(
                [
                  ['admin@example.space', true],
                  ['ops@example.space', false],
                  ['security@example.space', true],
                  ['matrix-team@example.space', false],
                ] as [string, boolean][]
              ).map(([addr, sel]) => (
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
                    border: '1px solid ' + (sel ? 'var(--ink)' : 'var(--line)'),
                  }}
                >
                  <input
                    type="checkbox"
                    defaultChecked={sel}
                    style={{ display: 'none' }}
                  />
                  {sel ? '✓ ' : '+ '}
                  {addr}
                </label>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                gap: 12,
                marginTop: 28,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Button type="submit">{t('alerts.edit.save')}</Button>
              <Button kind="ghost">{t('alerts.edit.cancel')}</Button>
              <span style={{ flex: 1 }} />
              <Button kind="danger">{t('alerts.edit.delete')}</Button>
            </div>
          </Card>

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
                <Pill kind="bad" dot>
                  {t('alerts.authed.pills.failing')}
                </Pill>
                <span style={{ fontSize: 14, color: 'var(--ink-2)' }}>
                  since 4 minutes ago
                </span>
              </div>
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.6,
                  margin: '14px 0 0',
                  color: 'var(--ink-2)',
                }}
              >
                Federation is timing out. The last successful check was at{' '}
                <span className="mono">15:55 UTC</span>.
              </p>
              <a
                href="#"
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
                  margin: '6px 0 12px',
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
                  color: 'var(--ink-2)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  defaultChecked
                  style={{ width: 18, height: 18, accentColor: 'var(--ink)' }}
                />
                <span>
                  {t('alerts.edit.quietHours.checkboxLabel', {
                    from: '22:00',
                    to: '07:00',
                    timezone: 'Europe/Berlin',
                  })}
                </span>
              </label>
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
                {(
                  [
                    ['16:02', 'Federation down', 'bad'],
                    ['09:14', 'Version: 1.118.0 → 1.119.0', 'info'],
                    ['Apr 28', 'TLS certificate renewed', 'info'],
                    ['Apr 12', 'Federation recovered', 'ok'],
                  ] as [string, string, string][]
                ).map(([when, what, kind]) => (
                  <li
                    key={when + what}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '64px 1fr auto',
                      gap: 10,
                      alignItems: 'center',
                      fontSize: 13.5,
                    }}
                  >
                    <span className="mono" style={{ color: 'var(--ink-3)' }}>
                      {when}
                    </span>
                    <span style={{ color: 'var(--ink-2)' }}>{what}</span>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background:
                          kind === 'bad'
                            ? 'var(--bad-deep)'
                            : kind === 'ok'
                              ? 'var(--ok-deep)'
                              : 'var(--ink-3)',
                      }}
                      aria-hidden="true"
                    />
                  </li>
                ))}
              </ul>
            </Card>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  )
}
