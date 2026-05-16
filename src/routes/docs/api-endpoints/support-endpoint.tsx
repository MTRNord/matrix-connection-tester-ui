import { createFileRoute } from '@tanstack/react-router'
import DocsLayout from '#/components/DocsLayout/DocsLayout'

export const Route = createFileRoute('/docs/api-endpoints/support-endpoint')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <DocsLayout
      docPath="api-endpoints/support-endpoint"
      lead="Publish contact information so users and other server operators know how to reach you."
    />
  )
}
