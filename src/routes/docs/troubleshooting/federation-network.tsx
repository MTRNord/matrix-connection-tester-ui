import { createFileRoute } from '@tanstack/react-router'
import DocsLayout from '#/components/DocsLayout/DocsLayout'

export const Route = createFileRoute(
  '/docs/troubleshooting/federation-network',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <DocsLayout docPath="troubleshooting/federation-network" />
}
