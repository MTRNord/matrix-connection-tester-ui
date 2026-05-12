import { resultQueryOptions } from '#/resultQueryOptions'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

type ResultSearchParams = {
  serverName: string
  statistics?: 'opt-in'
}

export const Route = createFileRoute('/results/')({
  validateSearch: (search: Record<string, unknown>): ResultSearchParams => {
    // TODO: Actually validate the search params
    return {
      serverName: search.serverName as string,
      statistics: search.statistics as 'opt-in' | undefined,
    }
  },
  loader: ({ context: { queryClient } }) => {
    // Placeholder
    queryClient.ensureQueryData(resultQueryOptions)
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { serverName, statistics } = Route.useSearch()
  // Placeholder
  const { data } = useSuspenseQuery(resultQueryOptions)

  return <div>Hello "/results/"!</div>
}
