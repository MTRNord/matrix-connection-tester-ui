import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/docs/troubleshooting/performance')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/docs/troubleshooting/performance"!</div>
}
