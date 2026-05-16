import { createContext, use, useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  clearTokens,
  isTokenValid,
  loadTokens,
  saveTokens,
} from '../auth/tokens'
import type { TokenSet } from '../auth/tokens'
import { loadConfig } from '../config'

// Module-level setter — lets non-React code (QueryCache error handler) clear
// React auth state synchronously alongside localStorage.
let _clearReactAuth: (() => void) | null = null

export function resetAuthState(): void {
  clearTokens()
  _clearReactAuth?.()
}

export interface AuthState {
  token: TokenSet | null
  isAuthenticated: boolean
  setToken: (t: TokenSet) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<TokenSet | null>(() => {
    const t = loadTokens()
    return t && isTokenValid(t) ? t : null
  })

  useEffect(() => {
    _clearReactAuth = () => setTokenState(null)
    return () => {
      _clearReactAuth = null
    }
  }, [])

  const setToken = useCallback((t: TokenSet) => {
    saveTokens(t)
    setTokenState(t)
  }, [])

  const logout = useCallback(async () => {
    const t = token
    clearTokens()
    setTokenState(null)
    if (!t) return
    try {
      const cfg = await loadConfig()
      const body = new URLSearchParams({ token: t.access_token })
      await fetch(`${cfg.api_server_url}/oauth2/revoke`, {
        method: 'POST',
        body,
      })
    } catch {
      // revocation is best-effort
    }
  }, [token])

  return (
    <AuthContext.Provider
      value={{ token, isAuthenticated: token !== null, setToken, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = use(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
