import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/docs/troubleshooting/federation-network',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/docs/troubleshooting/federation-network"!</div>
}
