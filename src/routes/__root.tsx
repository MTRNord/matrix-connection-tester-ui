import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import type { QueryClient } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import { configQueryOptions } from '#/config'
import SkipToContent from '#/components/SkipToContent/SkipToContent'

import '../inter.css'
import '../styles.css'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  component: RootComponent,
})

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
