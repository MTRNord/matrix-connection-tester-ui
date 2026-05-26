import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import type { QueryClient } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import { configQueryOptions } from '#/config'
import type { AuthState } from '#/contexts/AuthContext'
import SkipToContent from '#/components/SkipToContent/SkipToContent'
import Navbar from '#/components/Navbar/Navbar'
import Footer from '#/components/Footer/Footer'
import Banner from '#/components/Banner/Banner'
import Button from '#/components/Button/Button'
import { PlausibleAnalytics } from '#/components/PlausibleAnalytics/PlausibleAnalytics'
import { useTranslation } from 'react-i18next'

import '../inter.css'
import '../styles.css'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
  auth: AuthState
}>()({
  component: RootComponent,
  errorComponent: GlobalErrorComponent,
})

function GlobalErrorComponent({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  const router = useRouter()
  const { t } = useTranslation()
  const message =
    error instanceof Error ? error.message : t('globalError.configLoadFailed')

  return (
    <>
      <SkipToContent />
      <Navbar />
      <main id="main" className="page">
        <h1>{t('globalError.title')}</h1>
        <p className="lead">{t('globalError.lead')}</p>
        <Banner kind="bad" title={t('globalError.bannerTitle')}>
          {message}
        </Banner>
        <div
          style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}
        >
          <Button
            type="button"
            onClick={() => {
              reset()
              router.invalidate()
            }}
          >
            {t('globalError.tryAgain')}
          </Button>
          <a href="/" className="btn ghost">
            {t('globalError.backToHome')}
          </a>
        </div>
      </main>
      <Footer />
    </>
  )
}

function RootComponent() {
  const { error: configError } = useQuery(configQueryOptions)
  const { t } = useTranslation()

  return (
    <>
      <PlausibleAnalytics />
      <SkipToContent />
      {configError && (
        <div className="config-errorbar" role="alert">
          <span className="config-errorbar__label">
            {t('globalError.misconfigured')}
          </span>
          <span className="config-errorbar__msg">
            {configError instanceof Error
              ? configError.message
              : t('globalError.configLoadFailed')}
          </span>
        </div>
      )}
      <Outlet />
      <TanStackDevtools
        config={{
          position: 'bottom-right',
        }}
        plugins={[
          {
            name: 'TanStack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
          {
            name: 'React Query',
            render: <ReactQueryDevtoolsPanel />,
          },
        ]}
      />
    </>
  )
}
