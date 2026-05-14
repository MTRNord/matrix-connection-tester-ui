import Button from '#/components/Button/Button'
import Field from '#/components/Field/Field'
import Footer from '#/components/Footer/Footer'
import Navbar from '#/components/Navbar/Navbar'
import {
  generateCodeChallenge,
  generateCodeVerifier,
  generateNonce,
  generateState,
} from '#/auth/pkce'
import { configQueryOptions } from '#/config'
import { useAuth } from '#/contexts/AuthContext'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/alerts/login')({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof s.redirect === 'string' ? s.redirect : undefined,
  }),
  component: RouteComponent,
})

interface PkceParams {
  state: string
  nonce: string
  codeChallenge: string
}

function RouteComponent() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<'password' | 'magic'>('password')
  const [pkce, setPkce] = useState<PkceParams | null>(null)
  const { isAuthenticated } = useAuth()
  const { redirect: redirectAfter } = Route.useSearch()
  const navigate = useNavigate()

  useEffect(() => {
    if (redirectAfter) {
      sessionStorage.setItem('oauth_redirect_after', redirectAfter)
    }
  }, [redirectAfter])

  const { data: cfg } = useQuery(configQueryOptions)

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/alerts' })
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    async function generate() {
      const verifier = generateCodeVerifier()
      const challenge = await generateCodeChallenge(verifier)
      const state = generateState()
      const nonce = generateNonce()
      sessionStorage.setItem('oauth_state', state)
      sessionStorage.setItem('oauth_code_verifier', verifier)
      setPkce({ state, nonce, codeChallenge: challenge })
    }
    generate()
  }, [])

  const redirectUri =
    typeof window !== 'undefined'
      ? `${window.location.origin}/alerts/callback`
      : ''

  const ready = !!(cfg && pkce)
  const loginAction = cfg ? `${cfg.api_server_url}/oauth2/login` : undefined
  const magicAction = cfg
    ? `${cfg.api_server_url}/oauth2/magic-link`
    : undefined

  const resetUrl = cfg ? `${cfg.api_server_url}/oauth2/password-reset` : '#'

  const hiddenFields = ready ? (
    <>
      <input type="hidden" name="response_type" value="code" />
      <input type="hidden" name="client_id" value={cfg.oauth2_client_id} />
      <input type="hidden" name="redirect_uri" value={redirectUri} />
      <input
        type="hidden"
        name="scope"
        value="openid email alerts:read alerts:write"
      />
      <input type="hidden" name="state" value={pkce.state} />
      <input type="hidden" name="nonce" value={pkce.nonce} />
      <input type="hidden" name="code_challenge" value={pkce.codeChallenge} />
      <input type="hidden" name="code_challenge_method" value="S256" />
    </>
  ) : null

  return (
    <div style={{ minHeight: 1100, display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main
        id="main"
        className="page"
        style={{ paddingTop: 64, paddingBottom: 64, maxWidth: 600 }}
      >
        <div className="eyebrow">{t('alerts.login.eyebrow')}</div>
        <h1 style={{ fontSize: 48 }}>{t('alerts.login.headline')}</h1>
        <p className="lead">{t('alerts.login.lead')}</p>

        <div className="card" style={{ marginTop: 28, padding: 32 }}>
          <div
            role="tablist"
            aria-label={t('alerts.login.tablistLabel')}
            style={{
              display: 'flex',
              gap: 0,
              padding: 4,
              background: 'var(--surface-2)',
              borderRadius: 5,
              border: '1px solid var(--line)',
            }}
          >
            {(
              [
                ['password', t('alerts.login.tabPassword')],
                ['magic', t('alerts.login.tabMagic')],
              ] as const
            ).map(([tabKey, label]) => (
              <button
                key={tabKey}
                type="button"
                role="tab"
                aria-selected={tab === tabKey}
                onClick={() => setTab(tabKey)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  border: 0,
                  borderRadius: 3,
                  cursor: 'pointer',
                  background: tab === tabKey ? '#fff' : 'transparent',
                  color: tab === tabKey ? 'var(--ink)' : 'var(--ink-2)',
                  fontWeight: tab === tabKey ? 600 : 500,
                  fontSize: 14,
                  fontFamily: 'inherit',
                  boxShadow:
                    tab === tabKey ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <form
            action={tab === 'password' ? loginAction : magicAction}
            method="POST"
            style={{ marginTop: 20 }}
          >
            {hiddenFields}

            <Field id="signin-email" label={t('alerts.login.emailLabel')}>
              <input
                className="field__input"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
              />
            </Field>

            {tab === 'password' && (
              <>
                <Field
                  id="signin-password"
                  label={t('alerts.login.passwordLabel')}
                >
                  <input
                    className="field__input"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                  />
                </Field>
                <Button
                  type="submit"
                  className="block"
                  style={{ marginTop: 12 }}
                  disabled={!ready}
                >
                  {t('alerts.login.submitPassword')}
                </Button>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: 20,
                    fontSize: 14,
                  }}
                >
                  <Link to="/alerts/register">
                    {t('alerts.login.createAccount')}
                  </Link>
                  <a href={resetUrl}>{t('alerts.login.forgotPassword')}</a>
                </div>
              </>
            )}

            {tab === 'magic' && (
              <>
                <p
                  style={{
                    fontSize: 14,
                    color: 'var(--ink-3)',
                    margin: '4px 0 16px',
                  }}
                >
                  {t('alerts.login.magicDescription')}
                </p>
                <Button type="submit" className="block" disabled={!ready}>
                  {t('alerts.login.submitMagic')}
                </Button>
                <div style={{ marginTop: 20, fontSize: 14 }}>
                  <Link to="/alerts/register">
                    {t('alerts.login.createAccountMagic')}
                  </Link>
                </div>
              </>
            )}
          </form>
        </div>

        <p
          style={{
            marginTop: 20,
            fontSize: 13,
            color: 'var(--ink-3)',
            lineHeight: 1.6,
          }}
        >
          {t('alerts.login.disclaimer')}
        </p>
      </main>
      <Footer />
    </div>
  )
}
