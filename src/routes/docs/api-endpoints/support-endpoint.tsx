import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/docs/api-endpoints/support-endpoint')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/docs/api-endpoints/support-endpoint"!</div>
}
