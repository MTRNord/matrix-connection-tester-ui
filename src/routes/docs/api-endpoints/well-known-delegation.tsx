import { createFileRoute } from '@tanstack/react-router'
import DocsLayout from '#/components/DocsLayout/DocsLayout'

export const Route = createFileRoute(
  '/docs/api-endpoints/well-known-delegation',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <DocsLayout
      docPath="api-endpoints/well-known-delegation"
      lead="Route Matrix IDs and clients to your homeserver using well-known discovery files."
    />
  )
}
