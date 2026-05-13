import './Footer.css'
import Wordmark from '../Wordmark/Wordmark'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { configQueryOptions } from '#/config'

export default function Footer() {
  const { t } = useTranslation()
  const { data: cfg } = useQuery(configQueryOptions)

  return (
    <footer className="footer">
      <div className="footer__inner">
        <div
          style={{
            display: 'flex',
            gap: 32,
            flexWrap: 'wrap',
            alignItems: 'flex-start',
          }}
        >
          <div style={{ flex: '0 0 280px' }}>
            <Wordmark size={22} light />
            <p className="footer__meta" style={{ marginTop: 16 }}>
              {t('footer.meta')}
            </p>
          </div>
          <div
            style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 24,
            }}
          >
            <div>
              <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>
                {t('footer.project')}
              </div>
              <div
                className="footer__row"
                style={{ flexDirection: 'column', gap: 8 }}
              >
                <a href="https://github.com/MTRNord/matrix-connection-tester-ui">
                  {t('footer.uiSource')}
                </a>
                <a href="https://github.com/MTRNord/rust-federation-tester/">
                  {t('footer.apiSource')}
                </a>
                <Link to="/docs">{t('footer.documentation')}</Link>
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>
                {t('footer.matrix')}
              </div>
              <div
                className="footer__row"
                style={{ flexDirection: 'column', gap: 8 }}
              >
                <a href="https://matrix.org">Matrix.org</a>
                <a href="https://spec.matrix.org">
                  {t('footer.specification')}
                </a>
              </div>
            </div>
            {(cfg?.github_sponsors_url ?? cfg?.liberapay_url) && (
              <div>
                <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>
                  {t('footer.sponsoring')}
                </div>
                <div
                  className="footer__row"
                  style={{ flexDirection: 'column', gap: 8 }}
                >
                  {cfg?.github_sponsors_url && (
                    <a href={cfg.github_sponsors_url}>GitHub Sponsors</a>
                  )}
                  {cfg?.liberapay_url && (
                    <a href={cfg.liberapay_url}>Liberapay</a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
