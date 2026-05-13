import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/docs/configuration/federation-tls')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/docs/configuration/federation-tls"!</div>
}
