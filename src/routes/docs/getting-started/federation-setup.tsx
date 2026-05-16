import { createFileRoute } from '@tanstack/react-router'
import DocsLayout from '#/components/DocsLayout/DocsLayout'

export const Route = createFileRoute('/docs/getting-started/federation-setup')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <DocsLayout
      docPath="getting-started/federation-setup"
      lead="Configure your Matrix server to federate with the rest of the Matrix network."
    />
  )
}
