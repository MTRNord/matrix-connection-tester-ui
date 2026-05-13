import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/docs/configuration/tls-certificates')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/docs/configuration/tls-certificates"!</div>
}
