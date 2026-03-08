/**
 * Client-side OAuth2 / PKCE authentication utilities.
 * Runs entirely in the browser — uses Web Crypto API and sessionStorage.
 * The SSR server never sees tokens.
 */

/** How early before expiry to trigger a silent token refresh. */
const TOKEN_EXPIRY_WARNING_MS = 5 * 60 * 1000;

const STORAGE_KEYS = {
  ACCESS_TOKEN: "auth_access_token",
  REFRESH_TOKEN: "auth_refresh_token",
  TOKEN_EXPIRES_AT: "auth_token_expires_at",
  PKCE_STATE: "auth_pkce_state",
  PKCE_VERIFIER: "auth_pkce_verifier",
} as const;

// ---------------------------------------------------------------------------
// PKCE helpers
// ---------------------------------------------------------------------------

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = "";
  for (const byte of bytes) {
    str += String.fromCharCode(byte);
  }
  return btoa(str)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/** Generate a cryptographically random PKCE code verifier (32 bytes → base64url). */
export function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array.buffer);
}

/** Derive the PKCE code challenge: BASE64URL(SHA-256(verifier)). */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(digest);
}

/** Generate a random state parameter for CSRF protection. */
export function generateState(): string {
  return crypto.randomUUID();
}

// ---------------------------------------------------------------------------
// OIDC Discovery
// ---------------------------------------------------------------------------

export interface OidcConfig {
  authorizationEndpoint: string;
  tokenEndpoint: string;
  revocationEndpoint: string;
}

/** Fetch the OIDC discovery document and extract the relevant endpoints. */
export async function fetchOidcConfig(apiUrl: string): Promise<OidcConfig> {
  const response = await fetch(
    `${apiUrl}/oauth2/.well-known/openid-configuration`,
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch OIDC config: ${response.status}`);
  }
  const data = await response.json();
  return {
    authorizationEndpoint: data.authorization_endpoint,
    tokenEndpoint: data.token_endpoint,
    revocationEndpoint: data.revocation_endpoint,
  };
}

// ---------------------------------------------------------------------------
// Authorize URL builder
// ---------------------------------------------------------------------------

/** Build the full authorization URL to redirect the user to. */
export function buildAuthorizeUrl(
  authorizationEndpoint: string,
  clientId: string,
  redirectUri: string,
  state: string,
  codeChallenge: string,
): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "openid email alerts:read alerts:write",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return `${authorizationEndpoint}?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Token exchange & refresh
// ---------------------------------------------------------------------------

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

/** Exchange an authorization code for tokens (Authorization Code + PKCE). */
export async function exchangeCode(
  tokenEndpoint: string,
  params: {
    code: string;
    codeVerifier: string;
    clientId: string;
    redirectUri: string;
  },
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: params.redirectUri,
    client_id: params.clientId,
    code_verifier: params.codeVerifier,
  });

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed (${response.status}): ${error}`);
  }

  return await response.json();
}

/** Use a refresh token to obtain a new access token. */
export async function refreshAccessToken(
  tokenEndpoint: string,
  params: {
    refreshToken: string;
    clientId: string;
  },
): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: params.refreshToken,
    client_id: params.clientId,
  });

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed (${response.status}): ${error}`);
  }

  return await response.json();
}

// ---------------------------------------------------------------------------
// Token revocation (RFC 7009)
// ---------------------------------------------------------------------------

/** Revoke an access token server-side. Best-effort — always resolves. */
export async function revokeToken(
  revocationEndpoint: string,
  token: string,
  clientId: string,
): Promise<void> {
  const body = new URLSearchParams({
    token,
    token_type_hint: "access_token",
    client_id: clientId,
  });

  try {
    await fetch(revocationEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });
  } catch {
    // Best-effort — ignore errors (RFC 7009 says server always returns 200)
  }
}

// ---------------------------------------------------------------------------
// Token storage (sessionStorage)
// ---------------------------------------------------------------------------

/** Persist tokens into sessionStorage. Cleared on tab close. */
export function storeTokens(tokens: TokenResponse): void {
  sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.access_token);
  if (tokens.refresh_token) {
    sessionStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh_token);
  }
  const expiresAt = Date.now() + tokens.expires_in * 1000;
  sessionStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, String(expiresAt));
}

export function getAccessToken(): string | null {
  return sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

export function getRefreshToken(): string | null {
  return sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
}

function getTokenExpiresAt(): number {
  const val = sessionStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
  return val ? parseInt(val, 10) : 0;
}

/** True if there is a non-expired access token in sessionStorage. */
export function isAuthenticated(): boolean {
  return !!getAccessToken() && Date.now() < getTokenExpiresAt();
}

/** True if the access token expires within the next 5 minutes. */
export function isTokenExpiringSoon(): boolean {
  const expiresAt = getTokenExpiresAt();
  if (!expiresAt) return false;
  return Date.now() > expiresAt - TOKEN_EXPIRY_WARNING_MS;
}

/** Remove all auth-related entries from sessionStorage. */
export function clearTokens(): void {
  sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
}

// ---------------------------------------------------------------------------
// PKCE session storage
// ---------------------------------------------------------------------------

/** Persist the PKCE state + verifier before redirecting to the authorize endpoint. */
export function storePkceSession(state: string, verifier: string): void {
  sessionStorage.setItem(STORAGE_KEYS.PKCE_STATE, state);
  sessionStorage.setItem(STORAGE_KEYS.PKCE_VERIFIER, verifier);
}

/** Retrieve the stored PKCE session, or null if it is missing. */
export function getPkceSession(): { state: string; verifier: string } | null {
  const state = sessionStorage.getItem(STORAGE_KEYS.PKCE_STATE);
  const verifier = sessionStorage.getItem(STORAGE_KEYS.PKCE_VERIFIER);
  if (!state || !verifier) return null;
  return { state, verifier };
}

/** Remove the PKCE session after a successful code exchange. */
export function clearPkceSession(): void {
  sessionStorage.removeItem(STORAGE_KEYS.PKCE_STATE);
  sessionStorage.removeItem(STORAGE_KEYS.PKCE_VERIFIER);
}
