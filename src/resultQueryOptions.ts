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
  Error?: 'Mismatch' | 'NonCanonicalJson'
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

export interface RtcTransport {
  type: string
  [key: string]: unknown
}

export interface RtcTransportsResult {
  transports: RtcTransport[]
  endpoint: string
}

export interface ClientServerData {
  baseUrl: string
  wellKnown: WellKnownClient | null
  versions: ClientVersions | null
  msc3266Supported: boolean
  rtcTransports: RtcTransportsResult | null
  /** True when `/_matrix/client/versions` responded but had no CORS headers. */
  versionsCorsBlocked: boolean
  /** True when the RTC transports endpoint responded but had no CORS headers. */
  rtcCorsBlocked: boolean
  /** True when the MSC3266 room-summary endpoint responded but had no CORS headers. */
  msc3266CorsBlocked: boolean
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

/** Result returned by the backend well-known probe endpoint. */
export interface WellKnownProbeResult {
  /** HTTP status code from the remote server; 0 means network/TLS error. */
  status_code: number
  /** Value of `Access-Control-Allow-Origin`, or null if the header is absent. */
  cors_origin: string | null
  /** Parsed JSON body (2xx only). */
  body: unknown | null
}

/** Enriched support-info result including CORS diagnostic information. */
export interface SupportInfoResult {
  info: SupportInfo | null
  /** True when the endpoint responded (non-zero status) but had no CORS headers. */
  corsBlocked: boolean
  /** HTTP status code returned by the remote server. */
  statusCode: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function hasMatrixVersion(
  versions: string[],
  major: number,
  minor: number,
): boolean {
  return versions.some((v) => {
    const m = v.match(/^v(\d+)\.(\d+)/)
    if (!m) return false
    const ma = parseInt(m[1]),
      mi = parseInt(m[2])
    return ma > major || (ma === major && mi >= minor)
  })
}

/** Call the backend CORS probe for a client-server API path.
 *  Returns true if the endpoint responded but had no CORS headers. */
async function probeCors(
  apiServerUrl: string,
  baseUrl: string,
  path: string,
  extra?: Record<string, string>,
): Promise<boolean> {
  try {
    const params = new URLSearchParams({
      base_url: baseUrl,
      path,
      ...extra,
    })
    const resp = await fetch(`${apiServerUrl}/api/probe/client-api?${params}`)
    if (!resp.ok) return false
    const probe = (await resp.json()) as WellKnownProbeResult
    return probe.status_code >= 200 && probe.status_code < 300 && probe.cors_origin === null
  } catch {
    return false
  }
}

async function probeRtcTransports(
  baseUrl: string,
  apiServerUrl: string,
): Promise<{ result: RtcTransportsResult | null; corsBlocked: boolean }> {
  const paths = [
    '/_matrix/client/v1/rtc/transports',
    '/_matrix/client/unstable/org.matrix.msc4143/rtc/transports',
  ] as const

  let anyFailed = false
  for (const path of paths) {
    try {
      const resp = await fetch(`${baseUrl}${path}`)
      if (resp.ok) {
        const json = await resp.json().catch(() => null)
        if (json && Array.isArray(json.rtc_transports)) {
          return {
            result: {
              transports: json.rtc_transports as RtcTransport[],
              endpoint: `${baseUrl}${path}`,
            },
            corsBlocked: false,
          }
        }
      }
    } catch {
      // CORS or network — try next path
      anyFailed = true
    }
  }

  // If all browser fetches failed, check whether CORS is the reason
  if (anyFailed) {
    const corsBlocked = await probeCors(apiServerUrl, baseUrl, 'rtc-transports-v1')
    return { result: null, corsBlocked }
  }
  return { result: null, corsBlocked: false }
}

async function probeMsc3266(
  baseUrl: string,
  serverName: string,
  apiServerUrl: string,
): Promise<{ supported: boolean; corsBlocked: boolean }> {
  const roomId = encodeURIComponent(`!probe:${serverName}`)
  const via = encodeURIComponent(serverName)
  const paths = [
    `/_matrix/client/v1/room_summary/${roomId}?via=${via}`,
    `/_matrix/client/unstable/im.nheko.summary/summary/${roomId}?via=${via}`,
  ]

  let anyFailed = false
  for (const path of paths) {
    try {
      const resp = await fetch(`${baseUrl}${path}`)
      if (resp.status === 200) return { supported: true, corsBlocked: false }
      if (resp.status === 404) {
        const body = await resp.json().catch(() => null)
        if (body?.errcode === 'M_NOT_FOUND')
          return { supported: true, corsBlocked: false }
      }
    } catch {
      anyFailed = true
    }
  }

  if (anyFailed) {
    const corsBlocked = await probeCors(
      apiServerUrl,
      baseUrl,
      'room-summary-v1',
      { room_id: `!probe:${serverName}`, via: serverName },
    )
    return { supported: false, corsBlocked }
  }
  return { supported: false, corsBlocked: false }
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
    refetchInterval: 5 * 60_000,
  })

export const clientServerQueryOptions = (serverName: string) =>
  queryOptions({
    queryKey: ['client-server', serverName],
    queryFn: async (): Promise<ClientServerData> => {
      const config = await loadConfig()
      const apiServerUrl = config.api_server_url

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
      let versionsCorsBlocked = false
      try {
        const vResp = await fetch(`${baseUrl}/_matrix/client/versions`)
        if (vResp.ok) versions = await vResp.json()
      } catch {
        // CORS or network — probe to find out which
        versionsCorsBlocked = await probeCors(apiServerUrl, baseUrl, 'versions')
      }

      const versionList = versions?.versions ?? []

      // Run both probes concurrently to keep total latency down
      const msc3266Skip =
        hasMatrixVersion(versionList, 1, 15) ||
        versions?.unstable_features?.['org.matrix.msc3266'] === true

      const [msc3266Result, rtcResult] = await Promise.all([
        msc3266Skip
          ? Promise.resolve({ supported: true, corsBlocked: false })
          : probeMsc3266(baseUrl, serverName, apiServerUrl),
        probeRtcTransports(baseUrl, apiServerUrl),
      ])

      return {
        baseUrl,
        wellKnown,
        versions,
        msc3266Supported: msc3266Result.supported,
        rtcTransports: rtcResult.result,
        versionsCorsBlocked,
        rtcCorsBlocked: rtcResult.corsBlocked,
        msc3266CorsBlocked: msc3266Result.corsBlocked,
      }
    },
    retry: false,
    throwOnError: false,
  })

export const supportInfoQueryOptions = (serverName: string) =>
  queryOptions({
    queryKey: ['support-info', serverName],
    queryFn: async (): Promise<SupportInfoResult> => {
      const config = await loadConfig()
      const url = `${config.api_server_url}/api/probe/well-known?server_name=${encodeURIComponent(serverName)}&endpoint=support`
      try {
        const resp = await fetch(url)
        if (!resp.ok) {
          return { info: null, corsBlocked: false, statusCode: 0 }
        }
        const probe = (await resp.json()) as WellKnownProbeResult
        const corsBlocked = probe.status_code >= 200 && probe.status_code < 300 && probe.cors_origin === null
        const info =
          probe.status_code >= 200 && probe.status_code < 300 && probe.body
            ? (probe.body as SupportInfo)
            : null
        return { info, corsBlocked, statusCode: probe.status_code }
      } catch {
        return { info: null, corsBlocked: false, statusCode: 0 }
      }
    },
    retry: false,
    throwOnError: false,
  })
