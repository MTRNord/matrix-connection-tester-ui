import { createFileRoute } from '@tanstack/react-router'
import DocsLayout from '#/components/DocsLayout/DocsLayout'

export const Route = createFileRoute('/docs/api-endpoints/client-server-api')({
  component: RouteComponent,
})

function RouteComponent() {
  return <DocsLayout docPath="api-endpoints/client-server-api" />
}
