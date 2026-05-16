import Footer from '#/components/Footer/Footer'
import Navbar from '#/components/Navbar/Navbar'
import { configQueryOptions } from '#/config'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Trans, useTranslation } from 'react-i18next'

export const Route = createFileRoute('/privacy')({ component: Privacy })

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section style={{ marginTop: 40 }}>
      <h2 style={{ fontSize: 22, marginBottom: 12 }}>{title}</h2>
      {children}
    </section>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ marginTop: 12, lineHeight: 1.7, color: 'var(--ink-2)' }}>
      {children}
    </p>
  )
}

function Ul({ children }: { children: React.ReactNode }) {
  return (
    <ul
      style={{
        marginTop: 8,
        paddingLeft: 20,
        lineHeight: 1.7,
        color: 'var(--ink-2)',
      }}
    >
      {children}
    </ul>
  )
}

function Privacy() {
  const { t } = useTranslation()
  const { data: cfg } = useQuery(configQueryOptions)

  const controllerName = cfg?.privacy_controller_name
  const controllerEmail = cfg?.privacy_controller_email
  const instanceDomain =
    cfg?.instance_domain ??
    (typeof window !== 'undefined' ? window.location.hostname : null)
  const emailLogDays = cfg?.email_log_retention_days ?? 7
  const statsDays = cfg?.statistics_raw_retention_days ?? 30

  return (
    <div>
      <Navbar />
      <main
        id="main"
        className="page"
        style={{ paddingTop: 56, paddingBottom: 80, maxWidth: 720 }}
      >
        <div className="breadcrumb">
          <Link to="/">{t('nav.home')}</Link>
          <span className="breadcrumb__sep" aria-hidden="true">
            ›
          </span>
          <span>{t('privacy.breadcrumb')}</span>
        </div>

        <div className="eyebrow">{t('privacy.eyebrow')}</div>
        <h1>{t('privacy.title')}</h1>
        <p className="lead">{t('privacy.lead')}</p>
        <p style={{ marginTop: 8, fontSize: 13, color: 'var(--ink-3)' }}>
          {t('privacy.lastUpdated')}
        </p>

        <Section title={t('privacy.s1.title')}>
          <P>{t('privacy.s1.p1')}</P>
          {controllerName || controllerEmail || instanceDomain ? (
            <P>
              {instanceDomain && (
                <Trans
                  i18nKey="privacy.s1.instanceAt"
                  values={{ domain: instanceDomain }}
                  components={{ strong: <strong /> }}
                />
              )}{' '}
              {controllerName ? (
                controllerEmail ? (
                  <Trans
                    i18nKey="privacy.s1.controllerIsEmail"
                    values={{ name: controllerName, email: controllerEmail }}
                    components={{
                      strong: <strong />,
                      a: <a href={`mailto:${controllerEmail}`} />,
                    }}
                  />
                ) : (
                  <Trans
                    i18nKey="privacy.s1.controllerIs"
                    values={{ name: controllerName }}
                    components={{ strong: <strong /> }}
                  />
                )
              ) : controllerEmail ? (
                <Trans
                  i18nKey="privacy.s1.controllerEmailOnly"
                  values={{ email: controllerEmail }}
                  components={{ a: <a href={`mailto:${controllerEmail}`} /> }}
                />
              ) : (
                t('privacy.s1.controllerUnknown')
              )}
            </P>
          ) : (
            <P>{t('privacy.s1.noInfo')}</P>
          )}
        </Section>

        <Section title={t('privacy.s2.title')}>
          <h3 style={{ fontSize: 16, marginTop: 20, marginBottom: 4 }}>
            {t('privacy.s2.s21.title')}
          </h3>
          <P>
            <Trans
              i18nKey="privacy.s2.s21.p1"
              components={{ strong: <strong /> }}
            />
          </P>
          <P>
            <Trans
              i18nKey="privacy.s2.s21.p2"
              components={{ strong: <strong /> }}
            />
          </P>

          <h3 style={{ fontSize: 16, marginTop: 20, marginBottom: 4 }}>
            {t('privacy.s2.s22.title')}
          </h3>
          <P>{t('privacy.s2.s22.p1')}</P>
          <Ul>
            <li>
              <Trans
                i18nKey="privacy.s2.s22.email"
                components={{ strong: <strong /> }}
              />
            </li>
            <li>
              <Trans
                i18nKey="privacy.s2.s22.name"
                components={{ strong: <strong /> }}
              />
            </li>
            <li>
              <Trans
                i18nKey="privacy.s2.s22.password"
                components={{ strong: <strong /> }}
              />
            </li>
            <li>
              <Trans
                i18nKey="privacy.s2.s22.timezone"
                components={{ strong: <strong />, code: <code /> }}
              />
            </li>
            <li>
              <Trans
                i18nKey="privacy.s2.s22.alerts"
                components={{ strong: <strong /> }}
              />
            </li>
            <li>
              <Trans
                i18nKey="privacy.s2.s22.history"
                components={{ strong: <strong /> }}
              />
            </li>
            <li>
              <Trans
                i18nKey="privacy.s2.s22.webhooks"
                components={{ strong: <strong /> }}
              />
            </li>
          </Ul>
          <P>{t('privacy.s2.s22.footer')}</P>

          <h3 style={{ fontSize: 16, marginTop: 20, marginBottom: 4 }}>
            {t('privacy.s2.s23.title')}
          </h3>
          <P>{t('privacy.s2.s23.p1')}</P>
        </Section>

        <Section title={t('privacy.s3.title')}>
          <P>{t('privacy.s3.noWarranty')}</P>
          <Ul>
            <li>
              <Trans
                i18nKey="privacy.s3.accountData"
                components={{ strong: <strong /> }}
              />
            </li>
            <li>
              <Trans
                i18nKey="privacy.s3.statsOptIn"
                components={{ strong: <strong /> }}
              />
            </li>
            <li>
              <Trans
                i18nKey="privacy.s3.serverLogs"
                components={{ strong: <strong /> }}
              />
            </li>
          </Ul>
        </Section>

        <Section title={t('privacy.s4.title')}>
          <P>{t('privacy.s4.p1')}</P>
          <P>
            <Trans
              i18nKey="privacy.s4.webhooks"
              components={{ strong: <strong /> }}
            />
          </P>
          <P>{t('privacy.s4.p2')}</P>
        </Section>

        <Section title={t('privacy.s5.title')}>
          <P>
            <Trans
              i18nKey="privacy.s5.p1"
              components={{ strong: <strong />, code: <code /> }}
            />
          </P>
          <P>
            <Trans i18nKey="privacy.s5.p2" components={{ code: <code /> }} />
          </P>
        </Section>

        <Section title={t('privacy.s6.title')}>
          <Ul>
            <li>
              <Trans
                i18nKey="privacy.s6.accountData"
                components={{ strong: <strong /> }}
              />
            </li>
            <li>
              <Trans
                i18nKey="privacy.s6.alertHistory"
                components={{ strong: <strong /> }}
              />
            </li>
            <li>
              <Trans
                i18nKey="privacy.s6.emailLog"
                values={{ emailLogDays }}
                components={{ strong: <strong /> }}
              />
            </li>
            <li>
              <Trans
                i18nKey="privacy.s6.webhookLog"
                components={{ strong: <strong /> }}
              />
            </li>
            <li>
              <Trans
                i18nKey="privacy.s6.anonStats"
                values={{ statsDays }}
                components={{ strong: <strong /> }}
              />
            </li>
            <li>
              <Trans
                i18nKey="privacy.s6.serverLogs"
                components={{ strong: <strong /> }}
              />
            </li>
          </Ul>
        </Section>

        <Section title={t('privacy.s7.title')}>
          <P>{t('privacy.s7.p1')}</P>
          <Ul>
            <li>
              <Trans
                i18nKey="privacy.s7.access"
                components={{ strong: <strong /> }}
              />
            </li>
            <li>
              <Trans
                i18nKey="privacy.s7.deletion"
                components={{ strong: <strong /> }}
              />
            </li>
            <li>
              <Trans
                i18nKey="privacy.s7.correction"
                components={{ strong: <strong /> }}
              />
            </li>
            <li>
              <Trans
                i18nKey="privacy.s7.portability"
                components={{ strong: <strong /> }}
              />
            </li>
            <li>
              <Trans
                i18nKey="privacy.s7.withdrawConsent"
                components={{ strong: <strong /> }}
              />
            </li>
            <li>
              <Trans
                i18nKey="privacy.s7.objectOrRestrict"
                components={{ strong: <strong /> }}
              />
            </li>
          </Ul>
          <P>{t('privacy.s7.complaint')}</P>
        </Section>

        <Section title={t('privacy.s8.title')}>
          <P>{t('privacy.s8.p1')}</P>
        </Section>

        <Section title={t('privacy.s9.title')}>
          <P>
            {t('privacy.s9.p1')}
            {controllerEmail && (
              <>
                {' '}
                <Trans
                  i18nKey="privacy.s9.controllerEmail"
                  values={{ email: controllerEmail }}
                  components={{ a: <a href={`mailto:${controllerEmail}`} /> }}
                />
              </>
            )}
          </P>
        </Section>
      </main>
      <Footer />
    </div>
  )
}
