import { createFileRoute } from '@tanstack/react-router'
import DocsLayout from '#/components/DocsLayout/DocsLayout'

export const Route = createFileRoute('/docs/configuration/tls-certificates')({
  component: RouteComponent,
})

function RouteComponent() {
  return <DocsLayout docPath="configuration/tls-certificates" />
}
