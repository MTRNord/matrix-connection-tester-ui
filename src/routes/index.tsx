import Button from '#/components/Button/Button'
import Card from '#/components/Card/Card'
import Field from '#/components/Field/Field'
import Footer from '#/components/Footer/Footer'
import Sponsor from '#/components/Sponsor/Sponsor'
import Step from '#/components/Step/Step'
import Navbar from '../components/Navbar/Navbar'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Trans, useTranslation } from 'react-i18next'
import './index.css'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const navigate = useNavigate({ from: '/' })
  const { t } = useTranslation()

  return (
    <div>
      <Navbar />
      <main id="main" className="page">
        <div className="home-grid">
          <div>
            <div className="eyebrow">{t('home.eyebrow')}</div>
            <h1 className="home-h1">{t('home.headline')}</h1>
            <p className="lead" style={{ fontSize: 19, marginTop: 24 }}>
              {t('home.lead')}
            </p>

            <Card style={{ marginTop: 32, padding: 36 }}>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)
                  const domain = formData.get('domain-input')
                  const statistics = formData.get('contribute-statistics')
                  navigate({
                    to: `/results`,
                    search: {
                      serverName: domain ? domain.toString() : '',
                      statistics: statistics ? 'opt-in' : undefined,
                    },
                  })
                }}
              >
                <Field
                  id="homeserver-domain"
                  label={t('home.form.domainLabel')}
                  hint={
                    <Trans
                      i18nKey="home.form.domainHint"
                      components={{ code: <code /> }}
                    />
                  }
                >
                  <input
                    className="field__input"
                    name="domain-input"
                    type="text"
                    placeholder="example.com"
                    autoComplete="off"
                    spellCheck="false"
                  />
                </Field>
                <label
                  htmlFor="opt-in-stats"
                  style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                    marginTop: 12,
                    fontSize: 15,
                    color: 'var(--ink-2)',
                    lineHeight: 1.5,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    id="opt-in-stats"
                    name="contribute-statistics"
                    type="checkbox"
                    defaultChecked={false}
                    style={{
                      marginTop: 4,
                      width: 20,
                      height: 20,
                      accentColor: 'var(--ink)',
                    }}
                  />
                  <span>{t('home.form.statsLabel')}</span>
                </label>

                <div
                  style={{
                    display: 'flex',
                    gap: 16,
                    marginTop: 24,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <Button type="submit">{t('home.form.submit')}</Button>
                  <span style={{ fontSize: 14, color: 'var(--ink-3)' }}>
                    {t('home.form.timing')}
                  </span>
                </div>
              </form>
            </Card>
          </div>

          <aside aria-labelledby="aside-title">
            <Card variant="stone">
              <h2
                id="aside-title"
                style={{
                  fontSize: 22,
                  margin: 0,
                  fontWeight: 700,
                  letterSpacing: '-0.015em',
                }}
              >
                {t('home.checks.title')}
              </h2>
              <div style={{ paddingTop: 6 }}>
                <Step
                  icon="num"
                  iconText="1"
                  title={t('home.checks.step1Title')}
                  detail={t('home.checks.step1Detail')}
                />
                <Step
                  icon="num"
                  iconText="2"
                  title={t('home.checks.step2Title')}
                  detail={t('home.checks.step2Detail')}
                />
                <Step
                  icon="num"
                  iconText="3"
                  title={t('home.checks.step3Title')}
                  detail={t('home.checks.step3Detail')}
                />
                <Step
                  icon="num"
                  iconText="4"
                  title={t('home.checks.step4Title')}
                  detail={t('home.checks.step4Detail')}
                  style={{ paddingBottom: 0 }}
                />
              </div>
            </Card>

            <Card style={{ marginTop: 16 }}>
              <h3
                style={{
                  fontSize: 19,
                  margin: '0 0 10px',
                  fontWeight: 700,
                }}
              >
                {t('home.help.title')}
              </h3>
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.6,
                  margin: '0 0 12px',
                }}
              >
                {t('home.help.body')}
              </p>
              <Link to="/docs" style={{ fontSize: 14, fontWeight: 500 }}>
                {t('home.help.link')}
              </Link>
            </Card>
          </aside>
        </div>
        <div style={{ marginTop: 24 }}>
          <Sponsor />
        </div>
      </main>
      <Footer />
    </div>
  )
}
