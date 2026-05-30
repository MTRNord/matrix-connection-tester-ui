import './DocsLayout.css'
import Navbar from '#/components/Navbar/Navbar'
import Footer from '#/components/Footer/Footer'
import Sponsor from '#/components/Sponsor/Sponsor'
import DocPage from '#/components/DocRenderer/DocPage'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

type NavItem = { labelKey: string; to: string }
type NavSection = { headingKey: string; items: NavItem[] }

const NAV_SECTIONS: NavSection[] = [
  {
    headingKey: 'docs.nav.gettingStarted',
    items: [
      { labelKey: 'docs.nav.overview', to: '/docs/getting-started/overview' },
      {
        labelKey: 'docs.nav.federationSetup',
        to: '/docs/getting-started/federation-setup',
      },
      {
        labelKey: 'docs.nav.gettingHelp',
        to: '/docs/getting-started/getting-help',
      },
    ],
  },
  {
    headingKey: 'docs.nav.configuration',
    items: [
      { labelKey: 'docs.nav.cors', to: '/docs/configuration/cors' },
      {
        labelKey: 'docs.nav.tlsCertificates',
        to: '/docs/configuration/tls-certificates',
      },
      {
        labelKey: 'docs.nav.serverConfig',
        to: '/docs/configuration/server-config',
      },
    ],
  },
  {
    headingKey: 'docs.nav.apiEndpoints',
    items: [
      {
        labelKey: 'docs.nav.supportEndpoint',
        to: '/docs/api-endpoints/support-endpoint',
      },
      {
        labelKey: 'docs.nav.clientServerApi',
        to: '/docs/api-endpoints/client-server-api',
      },
      {
        labelKey: 'docs.nav.wellKnownDelegation',
        to: '/docs/api-endpoints/well-known-delegation',
      },
      {
        labelKey: 'docs.nav.oidcAuth',
        to: '/docs/api-endpoints/oidc-auth',
      },
    ],
  },
  {
    headingKey: 'docs.nav.alerting',
    items: [
      {
        labelKey: 'docs.nav.webhooks',
        to: '/docs/alerting/webhooks',
      },
    ],
  },
  {
    headingKey: 'docs.nav.troubleshooting',
    items: [
      { labelKey: 'docs.nav.general', to: '/docs/troubleshooting/general' },
      {
        labelKey: 'docs.nav.networkIssues',
        to: '/docs/troubleshooting/network-issues',
      },
      {
        labelKey: 'docs.nav.federationNetwork',
        to: '/docs/troubleshooting/federation-network',
      },
      {
        labelKey: 'docs.nav.serverLogs',
        to: '/docs/troubleshooting/server-logs',
      },
      {
        labelKey: 'docs.nav.performance',
        to: '/docs/troubleshooting/performance',
      },
    ],
  },
]

export default function DocsLayout({
  docPath,
  lead,
}: {
  docPath: string
  lead?: string
}) {
  const { t } = useTranslation()

  return (
    <>
      <Navbar />
      <main id="main" className="page">
        <div className="breadcrumb">
          <Link to="/">{t('nav.home')}</Link>
          <span className="breadcrumb__sep" aria-hidden="true">
            ›
          </span>
          <span>{t('docs.nav.title')}</span>
        </div>
        <h1>{t('docs.nav.title')}</h1>
        {lead && <p className="lead">{lead}</p>}

        <div className="docs-layout">
          <aside aria-label={t('docs.nav.ariaLabel')}>
            <div className="docs-nav__section">
              <Link
                to="/docs"
                className="docs-nav__link"
                activeOptions={{ exact: true }}
                activeProps={{ className: 'docs-nav__link active' }}
              >
                {t('docs.nav.title')}
              </Link>
            </div>
            {NAV_SECTIONS.map((section) => (
              <div key={section.headingKey} className="docs-nav__section">
                <div className="eyebrow" style={{ marginBottom: 10 }}>
                  {t(section.headingKey)}
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {section.items.map((item) => (
                    <li key={item.to}>
                      <Link
                        to={item.to as any}
                        className="docs-nav__link"
                        activeProps={{ className: 'docs-nav__link active' }}
                      >
                        {t(item.labelKey)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </aside>

          <article className="docs-article">
            <DocPage docPath={docPath} />
            <div className="docs-article__footer">
              <a
                href={`https://github.com/MTRNord/matrix-connection-tester-ui/edit/main/src/docs/en/${docPath}.md`}
                target="_blank"
                rel="noopener noreferrer"
                className="docs-article__edit-link"
              >
                {t('docs.editOnGithub')}
              </a>
            </div>
          </article>
        </div>

        <div style={{ marginTop: 48 }}>
          <Sponsor />
        </div>
      </main>
      <Footer />
    </>
  )
}
