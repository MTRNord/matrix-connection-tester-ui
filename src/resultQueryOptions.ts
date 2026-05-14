import { queryOptions } from '@tanstack/react-query'
import { loadConfig } from '#/config'

// ── API response types ────────────────────────────────────────────────────────

export interface Ed25519VerifyKey {
  key: string
  expired_ts?: number | null
}

export interface Keys {
  server_name: string
  valid_until_ts: number
  verify_keys?: Record<string, Ed25519VerifyKey>
  old_verify_keys?: Record<string, Ed25519VerifyKey> | null
  signatures?: Record<string, Record<string, string>>
}

export interface Cipher {
  Version: string
  CipherSuite: string
}

export interface Certificate {
  SubjectCommonName: string
  IssuerCommonName: string
  SHA256Fingerprint: string
  DNSNames?: string[] | null
}

export interface Ed25519Check {
  ValidEd25519: boolean
  MatchingSignature: boolean
}

export interface Checks {
  AllChecksOK: boolean
  MatchingServerName: boolean
  FutureValidUntilTS: boolean
  HasEd25519Key: boolean
  AllEd25519ChecksOK: boolean
  ValidCertificates: boolean
  ServerVersionParses: boolean
  Ed25519Checks?: Record<string, Ed25519Check>
}

export interface ApiError {
  Error: string
  ErrorCode: unknown
}

export interface ConnectionReportData {
  Cipher: Cipher
  Checks: Checks
  Ed25519VerifyKeys: Record<string, string>
  Keys: Keys
  Version: Version
  Certificates?: Certificate[]
  Error?: ApiError | null
  RequiredRetry?: boolean
}

export interface Version {
  name: string
  version: string
}

export interface SRVData {
  Target: string
  Port: number
  Priority?: number | null
  Weight?: number | null
  Addrs?: string[]
  Error?: ApiError | null
  SrvPrefix?: string | null
}

export interface Dnsresult {
  SRVSkipped: boolean
  Addrs?: string[]
  SrvTargets?: Record<string, SRVData[]>
}

export interface WellKnownResult {
  'm.server': string
  CacheExpiresAt: number
  Error?: ApiError | null
  ConnectionAddresses?: string[]
}

export interface Root {
  ServerName: string
  WellKnownResult: Record<string, WellKnownResult>
  DNSResult: Dnsresult
  Version: Version
  FederationOK: boolean
  FederationWarning?: boolean
  ConnectionReports?: Record<string, ConnectionReportData>
  ConnectionErrors?: Record<string, ApiError>
  Error?: ApiError | null
}

// ── Client-server API types ───────────────────────────────────────────────────

export interface ClientVersions {
  versions: string[]
  unstable_features?: Record<string, boolean>
}

export interface WellKnownClient {
  'm.homeserver'?: { base_url: string }
  'm.identity_server'?: { base_url: string }
  'org.matrix.msc4143.rtc_foci'?: unknown[]
}

export interface ClientServerData {
  baseUrl: string
  wellKnown: WellKnownClient | null
  versions: ClientVersions | null
  msc3266Supported: boolean
}

// ── MSC1929 support types ─────────────────────────────────────────────────────

export interface SupportContact {
  email_address?: string
  matrix_id?: string
  role: string
}

export interface SupportInfo {
  contacts?: SupportContact[]
  support_page?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function hasMatrixVersion(versions: string[], major: number, minor: number): boolean {
  return versions.some((v) => {
    const m = v.match(/^v(\d+)\.(\d+)/)
    if (!m) return false
    const ma = parseInt(m[1]), mi = parseInt(m[2])
    return ma > major || (ma === major && mi >= minor)
  })
}

async function probeMsc3266(baseUrl: string, serverName: string): Promise<boolean> {
  const roomId = encodeURIComponent(`!probe:${serverName}`)
  const via = encodeURIComponent(serverName)
  for (const path of [
    `/_matrix/client/v1/room_summary/${roomId}?via=${via}`,
    `/_matrix/client/unstable/im.nheko.summary/summary/${roomId}?via=${via}`,
  ]) {
    try {
      const resp = await fetch(`${baseUrl}${path}`)
      if (resp.status === 200) return true
      if (resp.status === 404) {
        const body = await resp.json().catch(() => null)
        if (body?.errcode === 'M_NOT_FOUND') return true
      }
    } catch {
      // CORS or network — try next path
    }
  }
  return false
}

// ── Query factories ───────────────────────────────────────────────────────────

export const resultQueryOptions = (serverName: string, statsOptIn: boolean) =>
  queryOptions({
    queryKey: ['results', serverName, statsOptIn],
    queryFn: async (): Promise<Root> => {
      const config = await loadConfig()
      const url = `${config.api_server_url}/api/federation/report?server_name=${encodeURIComponent(serverName)}&stats_opt_in=${statsOptIn}&no_cache=true`
      const resp = await fetch(url)
      if (!resp.ok)
        throw new Error(`Federation API returned HTTP ${resp.status}`)
      return resp.json()
    },
    staleTime: 60_000,
  })

export const clientServerQueryOptions = (serverName: string) =>
  queryOptions({
    queryKey: ['client-server', serverName],
    queryFn: async (): Promise<ClientServerData> => {
      let baseUrl = `https://${serverName}`
      let wellKnown: WellKnownClient | null = null
      try {
        const wkResp = await fetch(
          `https://${serverName}/.well-known/matrix/client`,
        )
        if (wkResp.ok) {
          wellKnown = await wkResp.json()
          const declared = wellKnown?.['m.homeserver']?.base_url
          if (declared) baseUrl = declared.replace(/\/$/, '')
        }
      } catch {
        // CORS or network failure — fall back to default base URL
      }

      let versions: ClientVersions | null = null
      try {
        const vResp = await fetch(`${baseUrl}/_matrix/client/versions`)
        if (vResp.ok) versions = await vResp.json()
      } catch {
        // unavailable
      }

      // MSC3266 / room summary: stable in v1.15+, or advertised unstable flag,
      // or detected by probing (catches servers that support it but don't advertise it)
      const versionList = versions?.versions ?? []
      const msc3266Supported =
        hasMatrixVersion(versionList, 1, 15) ||
        versions?.unstable_features?.['org.matrix.msc3266'] === true ||
        (await probeMsc3266(baseUrl, serverName))

      return { baseUrl, wellKnown, versions, msc3266Supported }
    },
    staleTime: 120_000,
    retry: false,
    throwOnError: false,
  })

export const supportInfoQueryOptions = (serverName: string) =>
  queryOptions({
    queryKey: ['support-info', serverName],
    queryFn: async (): Promise<SupportInfo | null> => {
      try {
        const resp = await fetch(
          `https://${serverName}/.well-known/matrix/support`,
        )
        if (!resp.ok) return null
        return resp.json()
      } catch {
        return null
      }
    },
    staleTime: 120_000,
    retry: false,
    throwOnError: false,
  })
