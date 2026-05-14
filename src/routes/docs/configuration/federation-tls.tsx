import { createFileRoute } from '@tanstack/react-router'
import DocsLayout from '#/components/DocsLayout/DocsLayout'

export const Route = createFileRoute('/docs/configuration/federation-tls')({
  component: RouteComponent,
})

function RouteComponent() {
  return <DocsLayout docPath="configuration/federation-tls" />
}
