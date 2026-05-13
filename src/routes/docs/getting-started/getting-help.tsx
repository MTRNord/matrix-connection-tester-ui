import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/docs/getting-started/getting-help')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/docs/getting-started/getting-help"!</div>
}
