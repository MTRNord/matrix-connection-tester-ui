function base64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export function generateCodeVerifier(): string {
  const buf = new Uint8Array(32)
  crypto.getRandomValues(buf)
  return base64url(buf)
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return base64url(new Uint8Array(digest))
}

export function generateState(): string {
  const buf = new Uint8Array(16)
  crypto.getRandomValues(buf)
  return base64url(buf)
}

export function generateNonce(): string {
  const buf = new Uint8Array(16)
  crypto.getRandomValues(buf)
  return base64url(buf)
}
