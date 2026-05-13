import Navbar from '#/components/Navbar/Navbar'
import Footer from '#/components/Footer/Footer'
import { createFileRoute, Link } from '@tanstack/react-router'
import Card from '#/components/Card/Card'
import Sponsor from '#/components/Sponsor/Sponsor'
import Banner from '#/components/Banner/Banner'

export const Route = createFileRoute('/docs/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <>
      <Navbar />
      <main id="main" className="page">
        <div className="breadcrumb">
          <Link to="/">Home</Link>
          <span className="breadcrumb__sep" aria-hidden="true">
            ›
          </span>
          <span>Documentation</span>
        </div>
        <h1>Documentation</h1>
        <p className="lead">
          A small, friendly handbook for diagnosing and configuring Matrix
          homeserver connectivity. We assume you can read a config file but not
          that you've memorised the Matrix Specification.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '260px 1fr',
            gap: 56,
            marginTop: 32,
          }}
        >
          <aside aria-activedescendant="Documentation Navigation">
            {(
              [
                {
                  heading: 'Getting started',
                  items: [
                    { label: 'Overview', to: '/docs/getting-started/overview' },
                    {
                      label: 'Federation setup',
                      to: '/docs/getting-started/federation-setup',
                    },
                    {
                      label: 'Getting help',
                      to: '/docs/getting-started/getting-help',
                    },
                  ],
                },
                {
                  heading: 'Configuration',
                  items: [
                    { label: 'CORS', to: '/docs/configuration/cors' },
                    {
                      label: 'TLS certificates',
                      to: '/docs/configuration/tls-certificates',
                    },
                    {
                      label: 'Federation TLS',
                      to: '/docs/configuration/federation-tls',
                    },
                    {
                      label: 'Server config',
                      to: '/docs/configuration/server-config',
                    },
                  ],
                },
                {
                  heading: 'API endpoints',
                  items: [
                    {
                      label: 'Support endpoint',
                      to: '/docs/api-endpoints/support-endpoint',
                    },
                    {
                      label: 'Client-server API',
                      to: '/docs/api-endpoints/client-server-api',
                    },
                    {
                      label: 'Well-known delegation',
                      to: '/docs/api-endpoints/well-known-delegation',
                    },
                  ],
                },
                {
                  heading: 'Troubleshooting',
                  items: [
                    { label: 'General', to: '/docs/troubleshooting/general' },
                    {
                      label: 'Network issues',
                      to: '/docs/troubleshooting/network-issues',
                    },
                    {
                      label: 'Federation network',
                      to: '/docs/troubleshooting/federation-network',
                    },
                    {
                      label: 'Server logs',
                      to: '/docs/troubleshooting/server-logs',
                    },
                    {
                      label: 'Performance',
                      to: '/docs/troubleshooting/performance',
                    },
                  ],
                },
              ]
            ).map(({ heading, items }) => {
              const linkStyle = {
                display: 'block',
                padding: '7px 0 7px 12px',
                fontSize: 14,
                textDecoration: 'none',
                color: 'var(--ink-2)',
                fontWeight: 400,
                borderLeft: '2px solid transparent',
                marginLeft: -12,
              }

              return (
                <div key={heading} style={{ marginBottom: 28 }}>
                  <div className="eyebrow" style={{ marginBottom: 10 }}>
                    {heading}
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {items.map(({ label, to }) => (
                      <Link
                        activeProps={{
                          style: {
                            ...linkStyle,
                            color: 'var(--ink)',
                            fontWeight: 700,
                            borderLeft: '2px solid var(--ink)',
                          },
                        }}
                        key={to}
                        to={to as any}
                        style={linkStyle}
                      >
                        {label}
                      </Link>
                    ))}
                  </ul>
                </div>
              )
            })}
          </aside>

          <article>
            <Banner kind="warn" title="Still being written.">
              These pages are a work in progress — some bits may be incomplete
              or out of date. Spotted a mistake? <a href="#">Edit on GitHub</a>.
            </Banner>

            <h2 style={{ marginTop: 32 }}>Overview</h2>
            <p>
              A Matrix homeserver needs to be reachable in two distinct ways: by
              other homeservers (federation) and by user clients
              (client-server). The Connectivity Tester checks both from outside
              your network and reports each layer separately.
            </p>
            <p style={{ color: 'var(--ink-3)' }}>
              Most issues fall into one of three buckets: a missing DNS record,
              a TLS certificate the wider internet doesn't trust, or a reverse
              proxy that isn't forwarding the right path. The pages below walk
              through each in plain language.
            </p>

            <Card style={{ marginTop: 28 }}>
              <h3
                style={{
                  fontSize: 22,
                  margin: '0 0 12px',
                  fontWeight: 700,
                  letterSpacing: '-0.015em',
                }}
              >
                If you're new to running a homeserver
              </h3>
              <p
                style={{
                  margin: '0 0 14px',
                }}
              >
                Start with these four pages, in order. Each one takes about ten
                minutes to read.
              </p>
              <ol
                style={{
                  margin: 0,
                  paddingLeft: 20,
                  lineHeight: 2,
                  fontSize: 15,
                  color: 'var(--ink-2)',
                }}
              >
                <li>
                  <a href="#">Federation setup</a> — configure your server for
                  federation
                </li>
                <li>
                  <a href="#">TLS certificates</a> — set up secure connections
                </li>
                <li>
                  <a href="#">Well-known delegation</a> — configure discovery
                </li>
                <li>
                  <a href="#">CORS configuration</a> — enable web clients
                </li>
              </ol>
            </Card>

            <h2>Need help?</h2>
            <ul
              style={{
                lineHeight: 2,
                fontSize: 16,
                color: 'var(--ink-2)',
                paddingLeft: 20,
              }}
            >
              <li>
                Run the <a href="#">connectivity tester</a> against your server
              </li>
              <li>Check your homeserver's logs for relevant errors</li>
              <li>
                Read the <a href="#">troubleshooting guide</a> for common issues
              </li>
              <li>
                Ask in <code>#homeservers:matrix.org</code>
              </li>
              <li>
                Post on the{' '}
                <a href="https://forum.mtrnord.blog/c/matrix-connectivity-tester/support/6">
                  forum
                </a>
              </li>
            </ul>

            <div style={{ marginTop: 32 }}>
              <Sponsor text="If these docs saved you an evening, consider chipping in." />
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </>
  )
}
