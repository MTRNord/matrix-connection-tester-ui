import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/docs/troubleshooting/server-logs')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/docs/troubleshooting/server-logs"!</div>
}
