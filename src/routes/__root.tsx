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
  const message =
    error instanceof Error ? error.message : 'An unexpected error occurred.'

  return (
    <>
      <SkipToContent />
      <Navbar />
      <main id="main" className="page">
        <h1>Something went wrong</h1>
        <p className="lead">
          An unexpected error occurred. You can try going back or reloading the
          page.
        </p>
        <Banner kind="bad" title="Unexpected error">
          {message}
        </Banner>
        <div
          style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}
        >
          <button
            type="button"
            className="btn"
            onClick={() => {
              reset()
              router.invalidate()
            }}
          >
            Try again
          </button>
          <a href="/" className="btn ghost">
            Back to home
          </a>
        </div>
      </main>
      <Footer />
    </>
  )
}

function RootComponent() {
  const { error: configError } = useQuery(configQueryOptions)

  return (
    <>
      <SkipToContent />
      {configError && (
        <div className="config-errorbar" role="alert">
          <span className="config-errorbar__label">Instance misconfigured</span>
          <span className="config-errorbar__msg">
            {configError instanceof Error
              ? configError.message
              : 'Could not load /config.json'}
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
