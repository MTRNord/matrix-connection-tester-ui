import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { useAuth } from '#/contexts/AuthContext'
import { loadConfig } from '#/config'
import type { TokenSet } from '#/auth/tokens'

export const Route = createFileRoute('/alerts/callback')({
  validateSearch: (
    search: Record<string, unknown>,
  ): { code?: string; state?: string; error?: string } => ({
    code: search.code as string | undefined,
    state: search.state as string | undefined,
    error: search.error as string | undefined,
  }),
  component: CallbackComponent,
})

function CallbackComponent() {
  const { code, state, error } = Route.useSearch()
  const { setToken } = useAuth()
  const navigate = useNavigate()
  const router = useRouter()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    async function exchange() {
      if (error || !code || !state) {
        navigate({ to: '/alerts/login' })
        return
      }

      const storedState = sessionStorage.getItem('oauth_state')
      const codeVerifier = sessionStorage.getItem('oauth_code_verifier')
      sessionStorage.removeItem('oauth_state')
      sessionStorage.removeItem('oauth_code_verifier')

      if (state !== storedState || !codeVerifier) {
        navigate({ to: '/alerts/login' })
        return
      }

      try {
        const cfg = await loadConfig()
        const redirectUri = `${window.location.origin}/alerts/callback`
        const body = new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: cfg.oauth2_client_id,
          redirect_uri: redirectUri,
          code_verifier: codeVerifier,
        })
        const res = await fetch(`${cfg.api_server_url}/oauth2/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body,
        })
        if (!res.ok) {
          navigate({ to: '/alerts/login' })
          return
        }
        const data = (await res.json()) as Omit<TokenSet, 'expires_at'>
        const redirectAfter = sessionStorage.getItem('oauth_redirect_after')
        sessionStorage.removeItem('oauth_redirect_after')
        setToken({ ...data, expires_at: Date.now() + data.expires_in * 1000 })
        // Only follow relative paths — guards against open redirect
        if (redirectAfter && redirectAfter.startsWith('/') && !redirectAfter.startsWith('//')) {
          router.history.push(redirectAfter)
        } else {
          navigate({ to: '/alerts' })
        }
      } catch {
        navigate({ to: '/alerts/login' })
      }
    }

    exchange()
  }, [])

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
        color: 'var(--ink-3)',
      }}
    >
      Signing you in…
    </div>
  )
}
