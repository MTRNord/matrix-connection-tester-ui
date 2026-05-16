import Banner from '#/components/Banner/Banner'
import Card from '#/components/Card/Card'
import Disclosure from '#/components/Disclosure/Disclosure'
import Footer from '#/components/Footer/Footer'
import Navbar from '#/components/Navbar/Navbar'
import Pill from '#/components/Pill/Pill'
import Stat from '#/components/Stat/Stat'
import Table from '#/components/Table/Table'
import type { ClientServerData, Root, SupportInfo } from '#/resultQueryOptions'
import {
  clientServerQueryOptions,
  resultQueryOptions,
  supportInfoQueryOptions,
} from '#/resultQueryOptions'
import _knownServers from '#/data/knownServers.json'
import _unstableFeatures from '#/data/unstableFeatures.json'
import {
  useQuery,
  useSuspenseQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  Link,
  createFileRoute,
  redirect,
  useRouter,
} from '@tanstack/react-router'
import { useCallback, useState } from 'react'
import { useTranslation, Trans } from 'react-i18next'
import './index.css'

const knownServers = _knownServers as Record<
  string,
  { maturity: string; url?: string } | undefined
>

const unstableFeatures = _unstableFeatures as Record<
  string,
  { msc: string; title: string; description: string } | undefined
>

// ── Types ─────────────────────────────────────────────────────────────────────

type ResultSearchParams = {
  serverName: string
  statistics?: 'opt-in'
}

// ── Route ─────────────────────────────────────────────────────────────────────

export const Route = createFileRoute('/results/')({
  validateSearch: (search: Record<string, unknown>): ResultSearchParams => ({
    serverName: (search.serverName as string | undefined) ?? '',
    statistics: search.statistics as 'opt-in' | undefined,
  }),
  beforeLoad: ({ search }) => {
    if (!search.serverName) throw redirect({ to: '/' })
  },
  loaderDeps: ({ search: { serverName, statistics } }) => ({
    serverName,
    statistics,
  }),
  loader: ({ context: { queryClient }, deps: { serverName, statistics } }) =>
    queryClient.ensureQueryData(
      resultQueryOptions(serverName, statistics === 'opt-in'),
    ),
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
  component: RouteComponent,
})

// ── Pending ───────────────────────────────────────────────────────────────────

function PendingComponent() {
  const { t } = useTranslation()
  return (
    <div>
      <Navbar />
      <main id="main" className="page">
        <div className="breadcrumb">
          <Link to="/">{t('nav.home')}</Link>
          <span className="breadcrumb__sep" aria-hidden="true">
            ›
          </span>
          <span>{t('results.breadcrumb')}</span>
        </div>
        <h1 style={{ color: 'var(--ink-3)' }}>{t('results.pending.title')}</h1>
        <p className="lead" style={{ color: 'var(--ink-3)' }}>
          {t('results.pending.lead')}
        </p>
        <div className="stat-grid" aria-hidden="true">
          {(
            [
              t('results.stats.federation'),
              t('results.stats.clientServer'),
              t('results.stats.implementation'),
              t('results.stats.matrixRtc'),
            ] as string[]
          ).map((label) => (
            <Card key={label}>
              <div className="stat__label">{label}</div>
              <div
                className="stat__value"
                style={{ color: 'var(--ink-4)', fontStyle: 'italic' }}
              >
                …
              </div>
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}

// ── Error ─────────────────────────────────────────────────────────────────────

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const { serverName } = Route.useSearch()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const router = useRouter()

  const handleRetry = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: resultQueryOptions(serverName, false).queryKey,
    })
    reset()
    router.invalidate()
  }, [queryClient, serverName, reset, router])

  const message =
    error instanceof Error ? error.message : 'An unexpected error occurred.'

  const isNetworkError =
    message.toLowerCase().includes('networkerror') ||
    message.toLowerCase().includes('failed to fetch') ||
    message.toLowerCase().includes('502') ||
    message.toLowerCase().includes('503') ||
    message.toLowerCase().includes('504')

  return (
    <div>
      <Navbar />
      <main id="main" className="page">
        <div className="breadcrumb">
          <Link to="/">{t('nav.home')}</Link>
          <span className="breadcrumb__sep" aria-hidden="true">
            ›
          </span>
          <span>{t('results.breadcrumb')}</span>
        </div>
        <h1>{t('results.error.title')}</h1>
        <p className="lead">
          <Trans
            i18nKey="results.error.lead"
            values={{ serverName }}
            components={{ mono: <span className="mono" /> }}
          />
        </p>
        <Banner
          kind="bad"
          title={isNetworkError ? t('results.error.networkTitle') : 'Error'}
        >
          {isNetworkError ? t('results.error.networkBody') : message}
        </Banner>
        <div
          style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}
        >
          <button type="button" className="btn" onClick={handleRetry}>
            {t('results.error.retry')}
          </button>
          <Link to="/" className="btn ghost">
            {t('results.error.home')}
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}

// ── Error classifier ──────────────────────────────────────────────────────────

type ErrorClass = {
  titleKey: string
  hintKey: string | null
  docsPath: string
}

function classifyFederationError(raw: string, errorCode?: unknown): ErrorClass {
  // Check structured ErrorCode first (more reliable than message text)
  const code =
    typeof errorCode === 'string'
      ? errorCode
      : typeof errorCode === 'object' && errorCode !== null
        ? Object.keys(errorCode)[0]
        : ''

  if (code === 'SRVPointsToCNAME') {
    return {
      titleKey: 'results.errors.srvToCname',
      hintKey: 'results.errors.srvToCnameHint',
      docsPath: '/docs/troubleshooting/network-issues',
    }
  }
  if (code === 'SRVLookupTimeout') {
    return {
      titleKey: 'results.errors.srvTimeout',
      hintKey: 'results.errors.srvTimeoutHint',
      docsPath: '/docs/troubleshooting/network-issues',
    }
  }
  if (code === 'InvalidServerName') {
    return {
      titleKey: 'results.errors.invalidServerName',
      hintKey: 'results.errors.invalidServerNameHint',
      docsPath: '/docs/getting-started/federation-setup',
    }
  }

  const lower = raw.toLowerCase()
  if (
    lower.includes('no records found') ||
    lower.includes('nxdomain') ||
    lower.includes('a record lookup') ||
    lower.includes('aaaa record') ||
    (lower.includes('dns') && lower.includes('error'))
  ) {
    return {
      titleKey: 'results.errors.dnsNoRecord',
      hintKey: 'results.errors.dnsNoRecordHint',
      docsPath: '/docs/troubleshooting/network-issues',
    }
  }
  if (lower.includes('connection refused')) {
    return {
      titleKey: 'results.errors.connRefused',
      hintKey: 'results.errors.connRefusedHint',
      docsPath: '/docs/troubleshooting/network-issues',
    }
  }
  if (lower.includes('timed out') || lower.includes('timeout')) {
    return {
      titleKey: 'results.errors.timeout',
      hintKey: 'results.errors.timeoutHint',
      docsPath: '/docs/troubleshooting/network-issues',
    }
  }
  if (
    lower.includes('tls') ||
    lower.includes('certificate') ||
    lower.includes(' cert ')
  ) {
    return {
      titleKey: 'results.errors.tls',
      hintKey: 'results.errors.tlsHint',
      docsPath: '/docs/troubleshooting/federation-network',
    }
  }
  return {
    titleKey: 'results.errors.unknown',
    hintKey: null,
    docsPath: '/docs/troubleshooting/network-issues',
  }
}

function ClassifiedErrorBanner({
  raw,
  errorCode,
}: {
  raw: string
  errorCode?: unknown
}) {
  const { t } = useTranslation()
  const { titleKey, hintKey, docsPath } = classifyFederationError(
    raw,
    errorCode,
  )
  return (
    <Banner kind="bad" title={t(titleKey)}>
      {hintKey && (
        <p style={{ margin: '4px 0 8px', fontSize: 14 }}>
          <Trans
            i18nKey={hintKey}
            components={{
              code: <code />,
              docsLink: <Link to={docsPath} />,
            }}
          />
        </p>
      )}
      <details>
        <summary
          style={{
            fontSize: 12,
            cursor: 'pointer',
            opacity: 0.75,
            userSelect: 'none',
          }}
        >
          {t('results.errors.technicalDetails')}
        </summary>
        <code
          style={{
            fontSize: 11,
            display: 'block',
            marginTop: 6,
            wordBreak: 'break-all',
            fontFamily: 'var(--mono)',
            opacity: 0.85,
          }}
        >
          {raw}
        </code>
      </details>
    </Banner>
  )
}

// ── Problem banner ────────────────────────────────────────────────────────────

type Problem = {
  key: string
  severity: 'bad' | 'warn'
  titleKey: string
  titleValues?: Record<string, string>
  hintKey?: string
  hintValues?: Record<string, string>
  docsPath?: string
  detail?: string
  isSplitBrain?: boolean
}

function ProblemBanner({
  problem,
  children,
}: {
  problem: Problem
  children?: React.ReactNode
}) {
  const { t } = useTranslation()
  return (
    <Banner
      kind={problem.severity}
      title={t(problem.titleKey, problem.titleValues ?? {})}
    >
      {problem.hintKey && (
        <p style={{ margin: '4px 0 8px', fontSize: 14 }}>
          <Trans
            i18nKey={problem.hintKey}
            values={problem.hintValues}
            components={{
              code: <code />,
              docsLink: problem.docsPath ? (
                <Link to={problem.docsPath} />
              ) : (
                <span />
              ),
            }}
          />
        </p>
      )}
      {children}
      {problem.detail && (
        <details>
          <summary
            style={{
              fontSize: 12,
              cursor: 'pointer',
              opacity: 0.75,
              userSelect: 'none',
            }}
          >
            {t('results.errors.technicalDetails')}
          </summary>
          <code
            style={{
              fontSize: 11,
              display: 'block',
              marginTop: 6,
              wordBreak: 'break-all',
              fontFamily: 'var(--mono)',
              opacity: 0.85,
            }}
          >
            {problem.detail}
          </code>
        </details>
      )}
    </Banner>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function maturityPillKind(maturity: string): string {
  switch (maturity.toLowerCase()) {
    case 'stable':
      return 'ok'
    case 'beta':
      return 'info'
    case 'alpha':
    case 'experimental':
      return 'warn'
    case 'obsolete':
      return 'bad'
    default:
      return 'ink'
  }
}

const timeFormatter = new Intl.DateTimeFormat([], {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

function versionToNum(v: string): number {
  // v1.12 style (Matrix 1.0+) — always newer than legacy r-style
  const mv = v.match(/^v(\d+)\.(\d+)$/)
  if (mv) return 1_000_000 + parseInt(mv[1]) * 1000 + parseInt(mv[2])
  // r0.6.1 style (legacy pre-1.0)
  const mr = v.match(/^r(\d+)\.(\d+)\.(\d+)$/)
  if (mr)
    return parseInt(mr[1]) * 10000 + parseInt(mr[2]) * 100 + parseInt(mr[3])
  return 0
}

function latestVersion(versions: string[]): string {
  return (
    [...versions].sort((a, b) => versionToNum(b) - versionToNum(a))[0] ?? ''
  )
}

// ── Copy button ───────────────────────────────────────────────────────────────

function CopyButton({ text, label }: { text: string; label: string }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [text])
  return (
    <button
      type="button"
      className={`support__copy${copied ? ' copied' : ''}`}
      aria-label={label}
      onClick={handleCopy}
    >
      {copied ? t('results.support.copied') : t('results.support.copy')}
    </button>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

function RouteComponent() {
  const { serverName, statistics } = Route.useSearch()
  const statsOptIn = statistics === 'opt-in'

  const { data, refetch, isFetching, dataUpdatedAt } = useSuspenseQuery(
    resultQueryOptions(serverName, statsOptIn),
  )
  const { data: csData } = useQuery(clientServerQueryOptions(serverName))
  const { data: supportData } = useQuery(supportInfoQueryOptions(serverName))

  const handleRefresh = useCallback(() => {
    void refetch()
  }, [refetch])

  return (
    <div>
      <Navbar />
      <main id="main" className="page">
        <ResultsBody
          data={data}
          serverName={serverName}
          csData={csData}
          supportData={supportData ?? null}
          onRefresh={handleRefresh}
          isRefreshing={isFetching}
          lastUpdatedAt={dataUpdatedAt}
        />
      </main>
      <Footer />
    </div>
  )
}

// ── ResultsBody ───────────────────────────────────────────────────────────────

function ResultsBody({
  data,
  serverName,
  csData,
  supportData,
  onRefresh,
  isRefreshing,
  lastUpdatedAt,
}: {
  data: Root
  serverName: string
  csData: ClientServerData | undefined
  supportData: SupportInfo | null | undefined
  onRefresh: () => void
  isRefreshing: boolean
  lastUpdatedAt: number
}) {
  const { t } = useTranslation()

  const federationOK = data.FederationOK
  const hasWarning = !!data.FederationWarning
  const hasErrors =
    !!data.ConnectionErrors && Object.keys(data.ConnectionErrors).length > 0
  const hasRetry =
    !!data.ConnectionReports &&
    Object.values(data.ConnectionReports).some((r) => r.RequiredRetry)

  const ipAddrs = data.DNSResult.Addrs ?? []
  const serverType = data.Version.name || ''
  const serverVersion = data.Version.version || ''
  const serverInfo = knownServers[serverType.toLowerCase()] ?? null

  // Verdict
  const verdictKind =
    !federationOK || hasErrors ? 'bad' : hasWarning || hasRetry ? 'warn' : 'ok'

  const verdictTitle =
    verdictKind === 'ok'
      ? t('results.verdict.okTitle')
      : verdictKind === 'warn'
        ? t('results.verdict.warnTitle')
        : t('results.verdict.badTitle')

  const verdictBody =
    verdictKind === 'ok'
      ? t('results.verdict.okBody')
      : verdictKind === 'warn'
        ? hasRetry
          ? t('results.verdict.warnBodyRetry')
          : t('results.verdict.warnBodySplitBrain')
        : t('results.verdict.badBody')

  // Stat: federation
  const fedValue =
    !federationOK || hasErrors ? 'FAIL' : hasWarning ? 'WARN' : 'OK'
  const fedColor =
    fedValue === 'OK'
      ? 'var(--ok-deep)'
      : fedValue === 'WARN'
        ? 'var(--warn-deep)'
        : 'var(--bad-deep)'
  const fedHint = `${t('results.stats.ipCount', { count: ipAddrs.length })} · ${
    !federationOK || hasErrors
      ? t('results.stats.checksFail')
      : t('results.stats.checksPass')
  }`

  // Stat: client-server API
  const csVersions = csData?.versions?.versions ?? []
  const latestCSVersion = csVersions.length ? latestVersion(csVersions) : null
  const enabledMSCCount = Object.values(
    csData?.versions?.unstable_features ?? {},
  ).filter(Boolean).length
  const csValue = csData?.versions ? 'OK' : csData === undefined ? '…' : 'N/A'
  const csHint = latestCSVersion
    ? `${latestCSVersion} · ${t('results.stats.mscCount', { count: enabledMSCCount })}`
    : csData === undefined
      ? t('results.stats.fetching')
      : t('results.stats.unavailable')

  // Stat: implementation
  const implValue = serverType || 'Unknown'
  const implHint = serverVersion ? (
    <span className="mono">{serverVersion}</span>
  ) : undefined

  // Stat: MatrixRTC
  const legacyFoci = Object.entries(csData?.wellKnown ?? {}).filter(
    ([key]) =>
      key.startsWith('org.matrix.msc4143.') || key.startsWith('m.rtc.'),
  )
  const hasMsc4143Flag =
    csData?.versions?.unstable_features?.['org.matrix.msc4143'] === true
  const hasMsc4140 =
    csData?.versions?.unstable_features?.['org.matrix.msc4140'] === true
  const hasRTC =
    (csData !== undefined && csData.rtcTransports !== null) ||
    legacyFoci.length > 0 ||
    hasMsc4143Flag
  const rtcValue = csData === undefined ? '…' : hasRTC ? 'OK' : 'N/A'
  const rtcColor = hasRTC ? 'var(--ok-deep)' : undefined
  const rtcHint =
    csData === undefined
      ? t('results.stats.fetching')
      : hasRTC
        ? t('results.stats.rtcSupported')
        : t('results.stats.rtcNotDetected')

  // Primary API error — shown with rich explanation, separate from per-IP list
  const primaryApiError = data.Error?.Error ?? null
  const primaryApiErrorCode = data.Error?.ErrorCode

  // Well-known per-IP — declared early so problem loop can reference it
  const wellKnownEntries = Object.entries(data.WellKnownResult)

  // Per-IP / check-failure problems
  const problems: Problem[] = []

  // Per-IP connection errors (full failure — couldn't connect at all)
  if (hasErrors) {
    for (const [ip, err] of Object.entries(data.ConnectionErrors ?? {})) {
      problems.push({
        key: `conn-error-${ip}`,
        severity: 'bad',
        titleKey: 'results.problems.connectionError',
        titleValues: { ip, error: err.Error },
        hintKey: 'results.problems.connectionErrorHint',
        docsPath: '/docs/troubleshooting/network-issues',
        detail: err.Error,
      })
    }
  }

  if (hasWarning) {
    problems.push({
      key: 'split-brain',
      severity: 'warn',
      titleKey: 'results.problems.splitBrain',
      hintKey: 'results.problems.splitBrainHint',
      docsPath: '/docs/api-endpoints/well-known-delegation',
      isSplitBrain: true,
    })
  }

  if (hasRetry) {
    problems.push({
      key: 'retry-needed',
      severity: 'warn',
      titleKey: 'results.problems.retryNeeded',
      hintKey: 'results.problems.retryNeededHint',
    })
  }

  if (data.ConnectionReports) {
    for (const [ip, report] of Object.entries(data.ConnectionReports)) {
      // Per-report connection error (connected but something failed)
      if (report.Error?.Error) {
        const errMsg = report.Error.Error
        problems.push({
          key: `report-error-${ip}`,
          severity: 'bad',
          titleKey: 'results.problems.connectionError',
          titleValues: { ip, error: errMsg },
          hintKey: 'results.problems.connectionErrorHint',
          docsPath: '/docs/troubleshooting/network-issues',
          detail: errMsg,
        })
      }
      if (!report.Checks.AllChecksOK) {
        if (!report.Checks.MatchingServerName) {
          problems.push({
            key: `name-mismatch-${ip}`,
            severity: 'bad',
            titleKey: 'results.problems.serverNameMismatch',
            titleValues: { ip },
            hintKey: 'results.problems.serverNameMismatchHint',
            hintValues: { serverName },
            docsPath: '/docs/troubleshooting/federation-network',
          })
        }
        if (!report.Checks.ValidCertificates) {
          const certDetail = report.Certificates?.map((c) =>
            [
              `Subject: ${c.SubjectCommonName}`,
              `Issuer: ${c.IssuerCommonName}`,
              c.DNSNames?.length ? `SANs: ${c.DNSNames.join(', ')}` : null,
            ]
              .filter(Boolean)
              .join('\n'),
          ).join('\n\n')
          problems.push({
            key: `invalid-cert-${ip}`,
            severity: 'bad',
            titleKey: 'results.problems.invalidCert',
            titleValues: { ip },
            hintKey: 'results.problems.invalidCertHint',
            docsPath: '/docs/configuration/tls-certificates',
            detail: certDetail ?? undefined,
          })
        }
        if (!report.Checks.FutureValidUntilTS) {
          const expiry = report.Keys.valid_until_ts
            ? new Date(report.Keys.valid_until_ts).toISOString()
            : undefined
          problems.push({
            key: `expired-keys-${ip}`,
            severity: 'bad',
            titleKey: 'results.problems.expiredKeys',
            titleValues: { ip },
            hintKey: 'results.problems.expiredKeysHint',
            docsPath: '/docs/troubleshooting/federation-network',
            detail: expiry ? `valid_until_ts expired: ${expiry}` : undefined,
          })
        }
        if (!report.Checks.HasEd25519Key) {
          problems.push({
            key: `no-ed25519-${ip}`,
            severity: 'bad',
            titleKey: 'results.problems.noEd25519Key',
            titleValues: { ip },
            hintKey: 'results.problems.noEd25519KeyHint',
            docsPath: '/docs/troubleshooting/federation-network',
          })
        }
        if (!report.Checks.AllEd25519ChecksOK) {
          const failedKeys = Object.entries(report.Checks.Ed25519Checks ?? {})
            .flatMap(([keyId, check]) =>
              !check.ValidEd25519 || !check.MatchingSignature
                ? [
                    `${keyId}: valid=${check.ValidEd25519}, matching=${check.MatchingSignature}`,
                  ]
                : [],
            )
            .join('\n')
          problems.push({
            key: `ed25519-failed-${ip}`,
            severity: 'bad',
            titleKey: 'results.problems.ed25519Failed',
            titleValues: { ip },
            hintKey: 'results.problems.ed25519FailedHint',
            docsPath: '/docs/troubleshooting/federation-network',
            detail: failedKeys || undefined,
          })
        }
        if (!report.Checks.ServerVersionParses) {
          problems.push({
            key: `version-parse-${ip}`,
            severity: 'warn',
            titleKey: 'results.problems.serverVersionParse',
            titleValues: { ip },
            hintKey: 'results.problems.serverVersionParseHint',
          })
        }
      }
    }
  }

  // Generic fallback only when nothing else explains the failure
  if (!federationOK && problems.length === 0 && !primaryApiError) {
    problems.push({
      key: 'federation-failed',
      severity: 'bad',
      titleKey: 'results.problems.federationFailed',
    })
  }

  // Well-known probe errors per IP (federation routing may be inconsistent)
  for (const [ip, wk] of wellKnownEntries) {
    if (wk.Error?.Error) {
      problems.push({
        key: `wk-error-${ip}`,
        severity: 'warn',
        titleKey: 'results.problems.wellKnownError',
        titleValues: { ip },
        hintKey: 'results.problems.wellKnownErrorHint',
        docsPath: '/docs/api-endpoints/well-known-delegation',
        detail: wk.Error.Error,
      })
    }
  }

  // SRV target resolution errors
  if (data.DNSResult.SrvTargets) {
    for (const records of Object.values(data.DNSResult.SrvTargets)) {
      for (const record of records) {
        if (record.Error?.Error) {
          problems.push({
            key: `srv-error-${record.Target}-${record.Port}`,
            severity: 'warn',
            titleKey: 'results.problems.srvTargetError',
            titleValues: { target: `${record.Target}:${record.Port}` },
            hintKey: 'results.problems.srvTargetErrorHint',
            docsPath: '/docs/troubleshooting/network-issues',
            detail: record.Error.Error,
          })
        }
      }
    }
  }

  // Per-connection-report: TLS version and keys-expiring-soon checks
  if (data.ConnectionReports) {
    for (const [ip, report] of Object.entries(data.ConnectionReports)) {
      // TLS 1.0 / 1.1 deprecated — Matrix spec recommends 1.2+
      const tlsVer = report.Cipher.Version
      if (tlsVer === 'TLS 1.0' || tlsVer === 'TLS 1.1') {
        problems.push({
          key: `tls-old-${ip}`,
          severity: 'warn',
          titleKey: 'results.problems.tlsOldVersion',
          titleValues: { ip, version: tlsVer },
          hintKey: 'results.problems.tlsOldVersionHint',
          docsPath: '/docs/configuration/tls-certificates',
        })
      }
    }
  }

  // Client-server API unreachable (loaded, but no versions returned)
  if (csData !== undefined && csData.versions === null) {
    problems.push({
      key: 'cs-api-unavailable',
      severity: 'warn',
      titleKey: 'results.problems.csApiUnavailable',
      hintKey: 'results.problems.csApiUnavailableHint',
      docsPath: '/docs/configuration/cors',
    })
  }

  // Support contacts
  const contacts = supportData?.contacts ?? []
  const supportPage = supportData?.support_page

  // Connection reports
  const connectionReportEntries = Object.entries(data.ConnectionReports ?? {})

  // Enabled unstable features for table
  const enabledFeatures = Object.entries(
    csData?.versions?.unstable_features ?? {},
  ).flatMap(([key, enabled]) =>
    enabled ? [{ key, info: unstableFeatures[key] }] : [],
  )

  // Inject MSC3266 if detected via stable version or probe but not already listed
  const msc3266AlreadyListed =
    csData?.versions?.unstable_features?.['org.matrix.msc3266'] === true
  if (csData?.msc3266Supported && !msc3266AlreadyListed) {
    enabledFeatures.push({
      key: 'org.matrix.msc3266',
      info: unstableFeatures['org.matrix.msc3266'],
    })
  }

  // Lead IP suffix
  const ipSuffix =
    ipAddrs.length > 0
      ? t('results.leadIpSuffix', { count: ipAddrs.length })
      : ''

  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/">{t('nav.home')}</Link>
        <span className="breadcrumb__sep" aria-hidden="true">
          ›
        </span>
        <span>{t('results.breadcrumb')}</span>
      </div>

      {/* Heading */}
      <h1>{t('results.title', { serverName })}</h1>
      <p className="lead">
        <Trans
          i18nKey="results.lead"
          values={{ serverName, ipSuffix }}
          components={{ mono: <span className="mono" /> }}
        />
      </p>

      {/* Verdict banner */}
      <Banner kind={verdictKind} title={verdictTitle}>
        {verdictBody}
      </Banner>

      {/* Re-run / last run row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 12,
          marginBottom: -8,
        }}
      >
        <span
          suppressHydrationWarning
          style={{ fontSize: 13, color: 'var(--ink-3)' }}
        >
          {t('results.lastRun', {
            time: timeFormatter.format(new Date(lastUpdatedAt)),
          })}
        </span>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            font: 'inherit',
            fontSize: 13,
            color: isRefreshing ? 'var(--ink-3)' : 'var(--ink-2)',
            cursor: isRefreshing ? 'default' : 'pointer',
            textDecoration: isRefreshing ? 'none' : 'underline',
          }}
        >
          {isRefreshing ? t('results.rerunning') : t('results.rerun')}
        </button>
      </div>

      {/* Stat cards */}
      <div className="stat-grid">
        <Stat
          label={t('results.stats.federation')}
          value={fedValue}
          hint={fedHint}
          valueColor={fedColor}
        />
        <Stat
          label={t('results.stats.clientServer')}
          value={csValue}
          hint={csHint}
          valueColor={csValue === 'OK' ? 'var(--ok-deep)' : undefined}
        />
        <Stat
          label={t('results.stats.implementation')}
          value={implValue}
          hint={implHint}
        />
        <Stat
          label={t('results.stats.matrixRtc')}
          value={rtcValue}
          hint={rtcHint}
          valueColor={rtcColor}
        />
      </div>

      {/* Problems */}
      <h2>{t('results.problems.title')}</h2>
      {primaryApiError === null && problems.length === 0 ? (
        <Card
          variant="stone"
          style={{ display: 'flex', alignItems: 'center', gap: 16 }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'var(--ok-deep)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 20,
              flexShrink: 0,
            }}
            aria-hidden="true"
          >
            {'✓'}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 19 }}>
              {t('results.problems.noneTitle')}
            </h3>
            <div style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 4 }}>
              {t('results.problems.noneBody')}
            </div>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {primaryApiError && (
            <ClassifiedErrorBanner
              raw={primaryApiError}
              errorCode={primaryApiErrorCode}
            />
          )}
          {problems.map((p) => (
            <ProblemBanner key={p.key} problem={p}>
              {p.isSplitBrain && wellKnownEntries.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  {wellKnownEntries.map(([ip, wk]) => (
                    <div
                      key={ip}
                      style={{
                        display: 'flex',
                        gap: 8,
                        fontSize: 13,
                        fontFamily: 'var(--mono)',
                        marginBottom: 2,
                      }}
                    >
                      <span style={{ color: 'var(--ink-3)', minWidth: 140 }}>
                        {ip}
                      </span>
                      <span>→ {wk['m.server'] || '(none)'}</span>
                    </div>
                  ))}
                </div>
              )}
            </ProblemBanner>
          ))}
        </div>
      )}

      {/* Support contacts */}
      {supportData !== undefined && (
        <>
          <h2>{t('results.support.title')}</h2>
          <p style={{ color: 'var(--ink-3)' }}>{t('results.support.intro')}</p>
          <div className="support">
            <div className="support__head">
              <h3 style={{ margin: 0 }}>
                {t('results.support.contactsFor', { serverName })}
              </h3>
              {contacts.length > 0 || supportPage ? (
                <Pill kind="ok" dot>
                  {t('results.support.published')}
                </Pill>
              ) : (
                <Pill kind="ink">{t('results.support.notPublished')}</Pill>
              )}
            </div>
            {contacts.length === 0 && !supportPage ? (
              <p className="support__lead" style={{ paddingBottom: 12 }}>
                <Trans
                  i18nKey="results.support.noneFound"
                  values={{ serverName }}
                  components={{ mono: <span className="mono" /> }}
                />
              </p>
            ) : (
              <>
                <p className="support__lead">{t('results.support.copyHint')}</p>
                <div className="support__grid">
                  {contacts.map((c) => (
                    <div
                      key={c.email_address ?? c.matrix_id ?? c.role}
                      className="support__row"
                    >
                      <span className="support__role">{c.role}</span>
                      {c.email_address ? (
                        <a
                          className="support__email"
                          href={`mailto:${c.email_address}`}
                        >
                          {c.email_address}
                        </a>
                      ) : c.matrix_id ? (
                        <span className="support__email">{c.matrix_id}</span>
                      ) : (
                        <span
                          className="support__email"
                          style={{ color: 'var(--ink-3)' }}
                        >
                          {'—'}
                        </span>
                      )}
                      <CopyButton
                        text={c.email_address ?? c.matrix_id ?? ''}
                        label={`Copy ${c.email_address ?? c.matrix_id}`}
                      />
                    </div>
                  ))}
                  {supportPage && (
                    <div
                      className="support__row"
                      style={{ gridColumn: '1 / -1' }}
                    >
                      <span className="support__role">
                        {t('results.support.supportPage')}
                      </span>
                      <a href={supportPage} className="support__email">
                        {supportPage}
                      </a>
                      <button
                        type="button"
                        className="support__copy"
                        onClick={() => window.open(supportPage, '_blank')}
                      >
                        {t('results.support.open')}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Server overview */}
      <h2>{t('results.overview.title')}</h2>
      <Card flush>
        <Table>
          <caption className="sr-only">
            {t('results.overview.srCaption', { serverName })}
          </caption>
          <tbody>
            <tr>
              <th scope="row" style={{ width: 240, fontWeight: 600 }}>
                {t('results.overview.serverType')}
              </th>
              <td>
                {serverInfo ? (
                  <>
                    {serverInfo.url ? (
                      <a
                        href={serverInfo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mono"
                      >
                        {serverType}
                      </a>
                    ) : (
                      <span className="mono">{serverType}</span>
                    )}{' '}
                    {serverVersion && (
                      <>
                        <Trans
                          i18nKey="results.overview.atVersion"
                          values={{ version: serverVersion }}
                          components={{ mono: <span className="mono" /> }}
                        />{' '}
                      </>
                    )}
                    <Pill kind={maturityPillKind(serverInfo.maturity)} dot>
                      {serverInfo.maturity}
                    </Pill>
                  </>
                ) : (
                  <span className="mono">
                    {serverType || 'Unknown'}
                    {serverVersion ? ` ${serverVersion}` : ''}
                  </span>
                )}
              </td>
            </tr>
            <tr>
              <th scope="row" style={{ fontWeight: 600 }}>
                {t('results.overview.discoveredIps')}
              </th>
              <td className="mono">
                {ipAddrs.length > 0 ? (
                  ipAddrs.map((ip) => <div key={ip}>{ip}</div>)
                ) : (
                  <span style={{ color: 'var(--ink-3)' }}>
                    {t('results.overview.noIps')}
                  </span>
                )}
              </td>
            </tr>
            {csData?.baseUrl && (
              <tr>
                <th scope="row" style={{ fontWeight: 600 }}>
                  {t('results.overview.clientEndpoint')}
                </th>
                <td className="mono">{csData.baseUrl}</td>
              </tr>
            )}
            {csData?.wellKnown?.['m.identity_server']?.base_url && (
              <tr>
                <th scope="row" style={{ fontWeight: 600 }}>
                  {t('results.overview.identityServer')}
                </th>
                <td className="mono">
                  {csData.wellKnown['m.identity_server'].base_url}
                </td>
              </tr>
            )}
            {latestCSVersion && (
              <tr>
                <th scope="row" style={{ fontWeight: 600 }}>
                  {t('results.overview.latestCsVersion')}
                </th>
                <td className="mono">{latestCSVersion}</td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>

      {/* Technical details */}
      <h2>{t('results.technical.title')}</h2>
      <p style={{ color: 'var(--ink-3)' }}>{t('results.technical.intro')}</p>

      <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
        {/* Client-Server API overview */}
        <Disclosure
          title={t('results.technical.csApi.title')}
          hint={t('results.technical.csApi.hint')}
          defaultOpen
          badge={
            csData?.versions ? (
              <Pill kind="ok" dot>
                OK
              </Pill>
            ) : csData === undefined ? undefined : (
              <Pill kind="ink">{t('results.technical.connectivity.na')}</Pill>
            )
          }
        >
          {csData?.versions ? (
            <>
              <div className="kv-grid">
                <div style={{ fontWeight: 600 }}>
                  {t('results.technical.csApi.latestVersion')}
                </div>
                <div className="mono">{latestCSVersion}</div>
                <div style={{ fontWeight: 600 }}>
                  {t('results.technical.csApi.endpoint')}
                </div>
                <div className="mono">{csData.baseUrl}</div>
                <div style={{ fontWeight: 600 }}>
                  {t('results.technical.csApi.allVersions')}
                </div>
                <div className="mono">{csVersions.join(', ')}</div>
              </div>
              {enabledFeatures.length > 0 && (
                <>
                  <h3 style={{ fontSize: 17, marginTop: 24, marginBottom: 8 }}>
                    {t('results.technical.csApi.featuresTitle', {
                      count: enabledFeatures.length,
                    })}
                  </h3>
                  <Card flush>
                    <Table>
                      <thead>
                        <tr>
                          <th scope="col">
                            {t('results.technical.csApi.featureCol')}
                          </th>
                          <th scope="col">
                            {t('results.technical.csApi.whatCol')}
                          </th>
                          <th scope="col">
                            {t('results.technical.csApi.specCol')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {enabledFeatures.map(({ key, info }) => (
                          <tr key={key}>
                            <td>
                              {info ? (
                                <>
                                  <div
                                    style={{
                                      fontWeight: 600,
                                      color: 'var(--ink)',
                                    }}
                                  >
                                    {info.title}
                                  </div>
                                  <div
                                    className="mono"
                                    style={{
                                      fontSize: 12,
                                      color: 'var(--ink-3)',
                                    }}
                                  >
                                    {key}
                                  </div>
                                </>
                              ) : (
                                <span className="mono" style={{ fontSize: 13 }}>
                                  {key}
                                </span>
                              )}
                            </td>
                            <td style={{ fontSize: 14 }}>
                              {info?.description ?? '—'}
                            </td>
                            <td>
                              {info?.msc ? (
                                <a
                                  href={`https://github.com/matrix-org/matrix-spec-proposals/blob/main/proposals/${info.msc.slice(3).toLowerCase()}-${info.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {info.msc}
                                </a>
                              ) : (
                                '—'
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card>
                </>
              )}
            </>
          ) : (
            <p style={{ color: 'var(--ink-3)', fontSize: 14 }}>
              {csData === undefined
                ? t('results.stats.fetching')
                : t('results.technical.csApi.unavailable')}
            </p>
          )}
        </Disclosure>

        {/* Client discovery results */}
        <Disclosure
          title={t('results.technical.clientDiscovery.title')}
          hint={t('results.technical.clientDiscovery.hint')}
        >
          {wellKnownEntries.length > 0 ? (
            <Card flush>
              <Table>
                <thead>
                  <tr>
                    <th scope="col">
                      {t('results.technical.clientDiscovery.ipCol')}
                    </th>
                    <th scope="col">
                      {t('results.technical.clientDiscovery.serverCol')}
                    </th>
                    <th scope="col">
                      {t('results.technical.clientDiscovery.statusCol')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {wellKnownEntries.map(([ip, wk]) => (
                    <tr key={ip}>
                      <td className="mono" style={{ fontSize: 13 }}>
                        {ip}
                      </td>
                      <td className="mono" style={{ fontSize: 13 }}>
                        {wk['m.server']}
                      </td>
                      <td>
                        {wk.Error ? (
                          <Pill kind="bad">
                            {t('results.technical.connectivity.error')}
                          </Pill>
                        ) : (
                          <Pill kind="ok" dot>
                            OK
                          </Pill>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          ) : (
            <p style={{ color: 'var(--ink-3)', fontSize: 14 }}>
              {t('results.technical.clientDiscovery.noData')}
            </p>
          )}
        </Disclosure>

        {/* MatrixRTC readiness */}
        <Disclosure
          title={t('results.technical.rtc.title')}
          hint={t('results.technical.rtc.hint')}
          badge={
            csData !== undefined ? (
              <Pill kind={hasRTC ? 'ok' : 'ink'} dot={hasRTC}>
                {hasRTC
                  ? t('results.technical.rtc.supported')
                  : t('results.technical.rtc.notDetected')}
              </Pill>
            ) : undefined
          }
        >
          {csData === undefined ? (
            <p style={{ color: 'var(--ink-3)', fontSize: 14 }}>
              {t('results.stats.fetching')}
            </p>
          ) : (
            <div className="kv-grid">
              {/* RTC transports endpoint */}
              <div style={{ fontWeight: 600 }}>
                {t('results.technical.rtc.transportsEndpoint')}
              </div>
              <div>
                {csData.rtcTransports ? (
                  <>
                    <Pill kind="ok" dot>
                      {t('results.technical.rtc.supported')}
                    </Pill>
                    <div
                      className="mono"
                      style={{
                        fontSize: 12,
                        color: 'var(--ink-3)',
                        marginTop: 4,
                      }}
                    >
                      {csData.rtcTransports.endpoint}
                    </div>
                    {csData.rtcTransports.transports.length > 0 ? (
                      <div style={{ marginTop: 4 }}>
                        {csData.rtcTransports.transports.map((tr) => (
                          <span
                            key={tr.type}
                            className="mono"
                            style={{
                              fontSize: 12,
                              display: 'block',
                              color: 'var(--ink-2)',
                            }}
                          >
                            {tr.type}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--ink-3)',
                          marginTop: 4,
                        }}
                      >
                        {t('results.technical.rtc.transportsEmpty')}
                      </div>
                    )}
                  </>
                ) : (
                  <Pill kind="ink">
                    {t('results.technical.rtc.notDetected')}
                  </Pill>
                )}
              </div>

              {/* Legacy focus config from .well-known */}
              <div style={{ fontWeight: 600 }}>
                {t('results.technical.rtc.legacyFoci')}
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 400,
                    color: 'var(--ink-3)',
                    marginTop: 2,
                  }}
                >
                  {t('results.technical.rtc.legacyFociHint')}
                </div>
              </div>
              <div>
                {legacyFoci.length > 0 ? (
                  <>
                    <Pill kind="ok" dot>
                      {t('results.technical.rtc.configured')}
                    </Pill>
                    <div style={{ marginTop: 4 }}>
                      {legacyFoci.map(([key]) => (
                        <span
                          key={key}
                          className="mono"
                          style={{
                            fontSize: 12,
                            display: 'block',
                            color: 'var(--ink-2)',
                          }}
                        >
                          {key}
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <Pill kind="ink">
                    {t('results.technical.rtc.notConfigured')}
                  </Pill>
                )}
              </div>

              {/* MSC4140 — delayed events */}
              <div style={{ fontWeight: 600 }}>
                {t('results.technical.rtc.msc4140')}
              </div>
              <div>
                <Pill kind={hasMsc4140 ? 'ok' : 'ink'} dot={hasMsc4140}>
                  {hasMsc4140
                    ? t('results.technical.rtc.supported')
                    : t('results.technical.rtc.notDetected')}
                </Pill>
              </div>

              {/* MSC3266 — room summaries */}
              <div style={{ fontWeight: 600 }}>
                {t('results.technical.rtc.msc3266')}
              </div>
              <div>
                <Pill
                  kind={csData.msc3266Supported ? 'ok' : 'ink'}
                  dot={csData.msc3266Supported}
                >
                  {csData.msc3266Supported
                    ? t('results.technical.rtc.supported')
                    : t('results.technical.rtc.notDetected')}
                </Pill>
              </div>
            </div>
          )}
        </Disclosure>

        {/* Server resolution */}
        <Disclosure
          title={t('results.technical.resolution.title')}
          hint={t('results.technical.resolution.hint')}
        >
          <div className="kv-grid" style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600 }}>
              {t('results.technical.resolution.srvSkipped')}
            </div>
            <div>
              {data.DNSResult.SRVSkipped
                ? t('results.technical.resolution.yes')
                : t('results.technical.resolution.no')}
            </div>
            <div style={{ fontWeight: 600 }}>
              {t('results.technical.resolution.resolvedAddrs')}
            </div>
            <div className="mono">
              {ipAddrs.length > 0 ? (
                ipAddrs.map((ip) => <div key={ip}>{ip}</div>)
              ) : (
                <span style={{ color: 'var(--ink-3)' }}>
                  {t('results.technical.resolution.none')}
                </span>
              )}
            </div>
          </div>
          {data.DNSResult.SrvTargets &&
            Object.keys(data.DNSResult.SrvTargets).length > 0 && (
              <>
                <h3 style={{ fontSize: 15, marginBottom: 8 }}>
                  {t('results.technical.resolution.srvTargets')}
                </h3>
                <Card flush>
                  <Table>
                    <thead>
                      <tr>
                        <th scope="col">
                          {t('results.technical.resolution.prefixCol')}
                        </th>
                        <th scope="col">
                          {t('results.technical.resolution.targetCol')}
                        </th>
                        <th scope="col">
                          {t('results.technical.resolution.portCol')}
                        </th>
                        <th scope="col">
                          {t('results.technical.resolution.priorityCol')}
                        </th>
                        <th scope="col">
                          {t('results.technical.resolution.weightCol')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(data.DNSResult.SrvTargets).flatMap(
                        ([prefix, records]) =>
                          records.map((r) => (
                            <tr key={`${prefix}-${r.Target}-${r.Port}`}>
                              <td className="mono" style={{ fontSize: 13 }}>
                                {prefix}
                              </td>
                              <td className="mono" style={{ fontSize: 13 }}>
                                {r.Target}
                              </td>
                              <td className="mono">{r.Port}</td>
                              <td>{r.Priority ?? '—'}</td>
                              <td>{r.Weight ?? '—'}</td>
                            </tr>
                          )),
                      )}
                    </tbody>
                  </Table>
                </Card>
              </>
            )}
        </Disclosure>

        {/* Connectivity report */}
        <Disclosure
          title={t('results.technical.connectivity.title')}
          hint={t('results.technical.connectivity.hint')}
        >
          {connectionReportEntries.length === 0 ? (
            <p style={{ color: 'var(--ink-3)', fontSize: 14 }}>
              {t('results.technical.connectivity.noReports')}
            </p>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {connectionReportEntries.map(([ip, report]) => (
                <div key={ip}>
                  <div
                    style={{
                      display: 'flex',
                      gap: 10,
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <span className="mono" style={{ fontWeight: 600 }}>
                      {ip}
                    </span>
                    <Pill
                      kind={report.Checks.AllChecksOK ? 'ok' : 'bad'}
                      dot={report.Checks.AllChecksOK}
                    >
                      {report.Checks.AllChecksOK
                        ? t('results.technical.connectivity.ok')
                        : t('results.technical.connectivity.failed')}
                    </Pill>
                    {report.RequiredRetry && (
                      <Pill kind="warn">
                        {t('results.technical.connectivity.retryNeeded')}
                      </Pill>
                    )}
                  </div>
                  <Card flush>
                    <Table>
                      <tbody>
                        <tr>
                          <th
                            scope="row"
                            style={{ fontWeight: 600, width: 200 }}
                          >
                            {t('results.technical.connectivity.tlsVersion')}
                          </th>
                          <td className="mono">{report.Cipher.Version}</td>
                        </tr>
                        <tr>
                          <th scope="row" style={{ fontWeight: 600 }}>
                            {t('results.technical.connectivity.cipherSuite')}
                          </th>
                          <td className="mono">{report.Cipher.CipherSuite}</td>
                        </tr>
                        <tr>
                          <th scope="row" style={{ fontWeight: 600 }}>
                            {t(
                              'results.technical.connectivity.serverNameMatch',
                            )}
                          </th>
                          <td>
                            <CheckBadge ok={report.Checks.MatchingServerName} />
                          </td>
                        </tr>
                        <tr>
                          <th scope="row" style={{ fontWeight: 600 }}>
                            {t('results.technical.connectivity.validCerts')}
                          </th>
                          <td>
                            <CheckBadge ok={report.Checks.ValidCertificates} />
                          </td>
                        </tr>
                        <tr>
                          <th scope="row" style={{ fontWeight: 600 }}>
                            {t('results.technical.connectivity.keysNotExpired')}
                          </th>
                          <td>
                            <CheckBadge ok={report.Checks.FutureValidUntilTS} />
                          </td>
                        </tr>
                        <tr>
                          <th scope="row" style={{ fontWeight: 600 }}>
                            {t('results.technical.connectivity.ed25519Present')}
                          </th>
                          <td>
                            <CheckBadge ok={report.Checks.HasEd25519Key} />
                          </td>
                        </tr>
                        <tr>
                          <th scope="row" style={{ fontWeight: 600 }}>
                            {t('results.technical.connectivity.ed25519Valid')}
                          </th>
                          <td>
                            <CheckBadge ok={report.Checks.AllEd25519ChecksOK} />
                          </td>
                        </tr>
                        {!report.Checks.AllEd25519ChecksOK &&
                          report.Checks.Ed25519Checks &&
                          Object.keys(report.Checks.Ed25519Checks).length >
                            0 && (
                            <tr>
                              <th
                                scope="row"
                                style={{
                                  fontWeight: 600,
                                  verticalAlign: 'top',
                                  paddingTop: 10,
                                }}
                              >
                                {t(
                                  'results.technical.connectivity.ed25519KeysTitle',
                                )}
                              </th>
                              <td>
                                {Object.entries(
                                  report.Checks.Ed25519Checks,
                                ).map(([keyId, check]) => (
                                  <div key={keyId} style={{ marginBottom: 8 }}>
                                    <div
                                      className="mono"
                                      style={{
                                        fontSize: 12,
                                        color: 'var(--ink-2)',
                                        marginBottom: 4,
                                        wordBreak: 'break-all',
                                      }}
                                    >
                                      {keyId}
                                    </div>
                                    <div
                                      style={{
                                        display: 'flex',
                                        gap: 6,
                                        flexWrap: 'wrap',
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontSize: 12,
                                          color: 'var(--ink-3)',
                                        }}
                                      >
                                        {t(
                                          'results.technical.connectivity.keyValidFormat',
                                        )}
                                        :
                                      </span>
                                      <CheckBadge ok={check.ValidEd25519} />
                                      <span
                                        style={{
                                          fontSize: 12,
                                          color: 'var(--ink-3)',
                                        }}
                                      >
                                        {t(
                                          'results.technical.connectivity.keyMatchingSig',
                                        )}
                                        :
                                      </span>
                                      <CheckBadge
                                        ok={check.MatchingSignature}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </td>
                            </tr>
                          )}
                        {!report.Checks.ValidCertificates &&
                          report.Certificates &&
                          report.Certificates.length > 0 && (
                            <tr>
                              <th
                                scope="row"
                                style={{
                                  fontWeight: 600,
                                  verticalAlign: 'top',
                                  paddingTop: 10,
                                }}
                              >
                                {t(
                                  'results.technical.connectivity.certificates',
                                )}
                              </th>
                              <td>
                                {report.Certificates.map((cert, i) => (
                                  <div
                                    key={`${cert.SubjectCommonName}-${cert.IssuerCommonName}`}
                                    style={{
                                      fontSize: 12,
                                      fontFamily: 'var(--mono)',
                                      marginBottom:
                                        i < report.Certificates!.length - 1
                                          ? 10
                                          : 0,
                                    }}
                                  >
                                    <div>
                                      <span style={{ color: 'var(--ink-3)' }}>
                                        {t(
                                          'results.technical.connectivity.certSubject',
                                        )}
                                        :{' '}
                                      </span>
                                      {cert.SubjectCommonName}
                                    </div>
                                    <div>
                                      <span style={{ color: 'var(--ink-3)' }}>
                                        {t(
                                          'results.technical.connectivity.certIssuer',
                                        )}
                                        :{' '}
                                      </span>
                                      {cert.IssuerCommonName}
                                    </div>
                                    {cert.DNSNames &&
                                      cert.DNSNames.length > 0 && (
                                        <div>
                                          <span
                                            style={{ color: 'var(--ink-3)' }}
                                          >
                                            {t(
                                              'results.technical.connectivity.certDnsNames',
                                            )}
                                            :{' '}
                                          </span>
                                          {cert.DNSNames.join(', ')}
                                        </div>
                                      )}
                                  </div>
                                ))}
                              </td>
                            </tr>
                          )}
                      </tbody>
                    </Table>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </Disclosure>

        {/* Raw JSON */}
        <Disclosure
          title={t('results.technical.rawJson.title')}
          hint={t('results.technical.rawJson.hint')}
        >
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </Disclosure>
      </div>
    </>
  )
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function CheckBadge({ ok }: { ok: boolean }) {
  const { t } = useTranslation()
  return ok ? (
    <Pill kind="ok" dot>
      {t('results.technical.connectivity.ok')}
    </Pill>
  ) : (
    <Pill kind="bad">{t('results.technical.connectivity.failed')}</Pill>
  )
}
