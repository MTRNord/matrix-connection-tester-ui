import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/docs/getting-started/overview')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/docs/getting-started/overview"!</div>
}
