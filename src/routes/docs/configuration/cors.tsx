import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/docs/configuration/cors')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/docs/configuration/cors"!</div>
}
