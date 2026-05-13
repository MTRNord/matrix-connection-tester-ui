import Button from '#/components/Button/Button'
import Card from '#/components/Card/Card'
import Field from '#/components/Field/Field'
import Footer from '#/components/Footer/Footer'
import Navbar from '#/components/Navbar/Navbar'
import Pill from '#/components/Pill/Pill'
import Table from '#/components/Table/Table'
import { useAuth } from '#/contexts/AuthContext'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Trans, useTranslation } from 'react-i18next'

export const Route = createFileRoute('/alerts/')({
  component: RouteComponent,
})

const rows = [
  {
    domain: 'matrix.example.org',
    status: 'ok',
    added: '2 weeks ago',
    recipients: ['ops@example.org', 'oncall@example.org'],
  },
  {
    domain: 'draupnir.example.space',
    status: 'bad',
    added: '4 days ago',
    recipients: ['admin@example.space'],
  },
  {
    domain: 'chat.acme.dev',
    status: 'warn',
    added: '1 month ago',
    recipients: ['ops@acme.dev', 'sre-room@acme.dev', 'matrix-team@acme.dev'],
  },
]
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

function RouteComponent() {
  const { isAuthenticated } = useAuth()
  const { t } = useTranslation()

  if (!isAuthenticated) return <LoggedOutView />

  const pillFor = (s: string) =>
    s === 'ok' ? (
      <Pill kind="ok" dot>
        {t('alerts.authed.pills.healthy')}
      </Pill>
    ) : s === 'warn' ? (
      <Pill kind="warn" dot>
        {t('alerts.authed.pills.degraded')}
      </Pill>
    ) : (
      <Pill kind="bad" dot>
        {t('alerts.authed.pills.failing')}
      </Pill>
    )

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
          <Card as="form" onSubmit={(e) => e.preventDefault()}>
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
              <input className="field__input" placeholder="example.com" />
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
                {(
                  [
                    ['you@example.dev', true],
                    ['ops@example.dev', true],
                    ['oncall@example.dev', false],
                    ['matrix-team@example.dev', false],
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
                      border:
                        '1px solid ' + (sel ? 'var(--ink)' : 'var(--line)'),
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
            </fieldset>
            <Button type="submit" style={{ marginTop: 24 }}>
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
              {(
                [
                  ['you@example.dev', 'verified', true],
                  ['ops@example.dev', 'verified', false],
                  ['oncall@example.dev', 'verified', false],
                  ['matrix-team@example.dev', 'pending', false],
                ] as [string, string, boolean][]
              ).map(([addr, state, primary]) => (
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
                    <Pill kind="ink">{t('alerts.authed.pills.primary')}</Pill>
                  )}
                  {state === 'pending' ? (
                    <Pill kind="warn" dot>
                      {t('alerts.authed.pills.pending')}
                    </Pill>
                  ) : (
                    <Pill kind="ok" dot>
                      {t('alerts.authed.pills.verified')}
                    </Pill>
                  )}
                </li>
              ))}
            </ul>
            <a
              href="#"
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
              {rows.map((r) => (
                <tr key={r.domain}>
                  <td>
                    <div
                      className="mono"
                      style={{ fontWeight: 600, color: 'var(--ink)' }}
                    >
                      {r.domain}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--ink-3)',
                        marginTop: 2,
                      }}
                    >
                      {t('alerts.authed.table.added', { date: r.added })}
                    </div>
                  </td>
                  <td>{pillFor(r.status)}</td>
                  <td className="mono">2 min ago</td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {r.recipients.map((rc) => (
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
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Link to="/alerts/edit" search={{ domain: r.domain }}>
                        <Button kind="ghost" size="small" as="span">
                          {t('alerts.authed.table.edit')}
                        </Button>
                      </Link>
                      <Button kind="danger" size="small">
                        {t('alerts.authed.table.delete')}
                      </Button>
                    </div>
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
