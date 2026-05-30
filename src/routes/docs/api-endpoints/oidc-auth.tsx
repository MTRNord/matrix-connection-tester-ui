import { createFileRoute } from '@tanstack/react-router'
import DocsLayout from '#/components/DocsLayout/DocsLayout'

export const Route = createFileRoute('/docs/api-endpoints/oidc-auth')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <DocsLayout
      docPath="api-endpoints/oidc-auth"
      lead="How Matrix 2.0 delegates authentication to an OIDC provider and what the tester validates."
    />
  )
}
