import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/docs/api-endpoints/client-server-api')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/docs/api-endpoints/client-server-api"!</div>
}
