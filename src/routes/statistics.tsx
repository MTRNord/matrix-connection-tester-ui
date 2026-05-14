import Banner from '#/components/Banner/Banner'
import Card from '#/components/Card/Card'
import Footer from '#/components/Footer/Footer'
import Navbar from '#/components/Navbar/Navbar'
import OutcomeChart from '#/components/OutcomeChart/OutcomeChart'
import Stat from '#/components/Stat/Stat'
import Table from '#/components/Table/Table'
import { statisticsQueryOptions } from '#/api/statisticsQueryOptions'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute('/statistics')({ component: Statistics })

function Statistics() {
  const { t } = useTranslation()
  const { data: stats, isLoading, error } = useQuery(statisticsQueryOptions)

  const fmtNum = (n: number) =>
    new Intl.NumberFormat('en-GB').format(Math.round(n))

  return (
    <div>
      <Navbar />
      <main id="main" className="page">
        <div className="breadcrumb">
          <Link to="/">{t('nav.home')}</Link>
          <span className="breadcrumb__sep" aria-hidden="true">
            ›
          </span>
          <span>{t('nav.statistics')}</span>
        </div>
        <h1>{t('statistics.title')}</h1>
        <p className="lead">{t('statistics.lead')}</p>

        {isLoading && (
          <p style={{ color: 'var(--ink-3)', marginTop: 32 }}>
            {t('statistics.loading')}
          </p>
        )}

        {error && (
          <Banner kind="bad" title={t('statistics.errorTitle')}>
            {t('statistics.errorBody')}
          </Banner>
        )}

        {stats === null && (
          <Banner kind="info" title={t('statistics.disabledTitle')}>
            {t('statistics.disabledBody')}
          </Banner>
        )}

        {stats != null && (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 16,
                marginTop: 32,
              }}
            >
              <Stat
                label={t('statistics.totalTests')}
                value={fmtNum(stats.totalTests)}
                hint={t('statistics.totalTestsHint')}
              />
              <Stat
                label={t('statistics.uniqueServers')}
                value={fmtNum(stats.uniqueServers)}
                hint={t('statistics.uniqueServersHint')}
              />
              <Stat
                label={t('statistics.successRate')}
                value={`${stats.successRate.toFixed(1)}%`}
                hint={t('statistics.successRateHint')}
              />
            </div>

            <h2>{t('statistics.softwareTitle')}</h2>
            <Card flush>
              <Table>
                <thead>
                  <tr>
                    <th scope="col">{t('statistics.colSoftware')}</th>
                    <th scope="col" style={{ width: 140 }}>
                      {t('statistics.colTests')}
                    </th>
                    <th scope="col" style={{ width: 140 }}>
                      {t('statistics.colShare')}
                    </th>
                    <th scope="col" style={{ width: 320 }}>
                      <span className="sr-only">{t('statistics.colBar')}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stats.serverDistribution.map(
                    ({ software, count, percentage }) => (
                      <tr key={software}>
                        <td style={{ fontWeight: 600, color: 'var(--ink)' }}>
                          {software === 'Other'
                            ? t('statistics.other')
                            : software}
                        </td>
                        <td className="num">{fmtNum(count)}</td>
                        <td className="num">{percentage.toFixed(1)}%</td>
                        <td>
                          <div
                            style={{
                              height: 8,
                              background: 'var(--surface-2)',
                              borderRadius: 2,
                              overflow: 'hidden',
                            }}
                            aria-hidden="true"
                          >
                            <div
                              style={{
                                width: `${percentage}%`,
                                height: '100%',
                                background: 'var(--ink)',
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </Table>
            </Card>

            {stats.dailyOutcomes.length > 0 && (
              <>
                <h2>{t('statistics.chartTitle')}</h2>
                <Card style={{ padding: 28, marginBottom: 32 }}>
                  <OutcomeChart data={stats.dailyOutcomes} height={220} />
                  <div
                    style={{
                      display: 'flex',
                      gap: 20,
                      marginTop: 14,
                      fontSize: 13,
                      color: 'var(--ink-2)',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          width: 12,
                          height: 12,
                          background: 'var(--ink)',
                          display: 'inline-block',
                        }}
                        aria-hidden="true"
                      />
                      {t('statistics.chartPassed')}
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          width: 12,
                          height: 12,
                          background: 'var(--bad)',
                          display: 'inline-block',
                        }}
                        aria-hidden="true"
                      />
                      {t('statistics.chartFailed')}
                    </span>
                  </div>
                </Card>
              </>
            )}

            <div style={{ marginTop: 32 }}>
              <Banner kind="info" title={t('statistics.privacyTitle')}>
                {t('statistics.privacyBody')}
              </Banner>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
