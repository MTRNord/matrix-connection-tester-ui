import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/docs/troubleshooting/general')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/docs/troubleshooting/general"!</div>
}
