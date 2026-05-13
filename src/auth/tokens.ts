const KEY = 'mct_tokens'

export interface TokenSet {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  scope: string
  expires_at: number
}

export function saveTokens(t: TokenSet): void {
  localStorage.setItem(KEY, JSON.stringify(t))
}

export function loadTokens(): TokenSet | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as TokenSet) : null
  } catch {
    return null
  }
}

export function clearTokens(): void {
  localStorage.removeItem(KEY)
}

export function isTokenValid(t: TokenSet): boolean {
  return Date.now() < t.expires_at - 60_000
}
