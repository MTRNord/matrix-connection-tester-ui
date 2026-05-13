import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/docs/api-endpoints/well-known-delegation',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/docs/api-endpoints/well-known-delegation"!</div>
}
