import { createFileRoute } from '@tanstack/react-router'
import DocsLayout from '#/components/DocsLayout/DocsLayout'

export const Route = createFileRoute('/docs/configuration/cors')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <DocsLayout
      docPath="configuration/cors"
      lead="Enable web-based Matrix clients to connect to your server from any domain."
    />
  )
}
