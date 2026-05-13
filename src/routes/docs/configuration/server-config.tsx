import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/docs/configuration/server-config')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/docs/configuration/server-config"!</div>
}
