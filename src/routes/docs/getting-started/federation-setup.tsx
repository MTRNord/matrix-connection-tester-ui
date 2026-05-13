import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/docs/getting-started/federation-setup')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/docs/getting-started/federation-setup"!</div>
}
