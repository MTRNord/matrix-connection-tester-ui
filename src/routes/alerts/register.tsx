import Button from '#/components/Button/Button'
import Card from '#/components/Card/Card'
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
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'

export const Route = createFileRoute('/alerts/register')({
  validateSearch: (
    s: Record<string, unknown>,
  ): { error?: string; message?: string } => ({
    error: typeof s.error === 'string' ? s.error : undefined,
    message: typeof s.message === 'string' ? s.message : undefined,
  }),
  component: RouteComponent,
})

interface PkceParams {
  state: string
  nonce: string
  codeChallenge: string
}

const STRENGTH_META = [
  { key: 'tooShort', fill: 'var(--bad)' },
  { key: 'weak', fill: 'var(--bad)' },
  { key: 'fair', fill: 'var(--warn)' },
  { key: 'good', fill: 'var(--ok)' },
  { key: 'strong', fill: 'var(--ok-deep)' },
] as const

function computeStrength(password: string): 0 | 1 | 2 | 3 | 4 {
  if (password.length < 8) return 0
  if (password.length < 10) return 1
  if (password.length < 12) return 2
  if (password.length < 16) return 3
  return 4
}

function RouteComponent() {
  const { t } = useTranslation()
  const { error, message } = Route.useSearch()
  const [pkce, setPkce] = useState<PkceParams | null>(null)
  const [password, setPassword] = useState('')

  const { data: cfg } = useQuery(configQueryOptions)

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
  const registerAction = cfg
    ? `${cfg.api_server_url}/oauth2/register`
    : undefined

  const strength = computeStrength(password)
  const { key: strengthKey, fill: strengthFill } = STRENGTH_META[strength]

  return (
    <div style={{ minHeight: 1100, display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main
        id="main"
        className="page"
        style={{ paddingTop: 56, paddingBottom: 64, maxWidth: 600 }}
      >
        <div className="eyebrow">{t('alerts.register.eyebrow')}</div>
        <h1 style={{ fontSize: 48 }}>{t('alerts.register.headline')}</h1>
        <p className="lead">{t('alerts.register.lead')}</p>

        {error && (
          <div
            role="alert"
            style={{
              marginTop: 16,
              padding: '12px 16px',
              background: '#fdf2f2',
              border: '1px solid var(--bad)',
              borderRadius: 6,
              color: 'var(--bad)',
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}
        {message && (
          <div
            role="status"
            style={{
              marginTop: 16,
              padding: '12px 16px',
              background: '#f2fdf4',
              border: '1px solid var(--ok)',
              borderRadius: 6,
              color: 'var(--ok-deep)',
              fontSize: 14,
            }}
          >
            {message}
          </div>
        )}

        <Card
          as="form"
          action={registerAction}
          method="POST"
          style={{ marginTop: 24, padding: 32 }}
        >
          {ready && (
            <>
              <input type="hidden" name="response_type" value="code" />
              <input
                type="hidden"
                name="client_id"
                value={cfg.oauth2_client_id}
              />
              <input type="hidden" name="redirect_uri" value={redirectUri} />
              <input
                type="hidden"
                name="scope"
                value="openid email alerts:read alerts:write"
              />
              <input type="hidden" name="state" value={pkce.state} />
              <input type="hidden" name="nonce" value={pkce.nonce} />
              <input
                type="hidden"
                name="code_challenge"
                value={pkce.codeChallenge}
              />
              <input type="hidden" name="code_challenge_method" value="S256" />
            </>
          )}

          <Field
            id="register-email"
            label={t('alerts.register.emailLabel')}
            hint={t('alerts.register.emailHint')}
          >
            <input
              className="field__input"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              autoFocus
            />
          </Field>

          <Field
            id="register-password"
            label={t('alerts.register.passwordLabel')}
            hint={t('alerts.register.passwordHint')}
          >
            <input
              className="field__input"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>

          {password.length > 0 && (
            <div aria-live="polite" style={{ marginTop: -8, marginBottom: 20 }}>
              <div style={{ display: 'flex', gap: 4 }} aria-hidden="true">
                {([0, 1, 2, 3, 4] as const).map((step) => (
                  <div
                    key={step}
                    style={{
                      flex: 1,
                      height: 6,
                      borderRadius: 2,
                      background:
                        step <= strength ? strengthFill : 'var(--surface-3)',
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
                }}
              >
                <span
                  style={{ fontSize: 13, fontWeight: 600, color: strengthFill }}
                >
                  {t(`alerts.register.strength.${strengthKey}.label`)}
                </span>
                <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>
                  {t(`alerts.register.strength.${strengthKey}.hint`)}
                </span>
              </div>
            </div>
          )}

          <Field
            id="register-confirm"
            label={t('alerts.register.confirmLabel')}
          >
            <input
              className="field__input"
              name="password_confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
            />
          </Field>

          <Button
            type="submit"
            block
            style={{ marginTop: 8 }}
            disabled={!ready}
          >
            {t('alerts.register.submit')}
          </Button>

          <p
            style={{
              fontSize: 13,
              color: 'var(--ink-3)',
              marginTop: 20,
              lineHeight: 1.6,
            }}
          >
            <Trans
              i18nKey="alerts.register.privacyNote"
              components={{ privacyLink: <Link to="/privacy" /> }}
            />
          </p>
        </Card>

        <div
          style={{
            marginTop: 20,
            fontSize: 14,
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <span style={{ color: 'var(--ink-3)' }}>
            {t('alerts.register.alreadyHaveAccount')}
          </span>
          <Link to="/alerts/login">{t('alerts.register.signInLink')}</Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
