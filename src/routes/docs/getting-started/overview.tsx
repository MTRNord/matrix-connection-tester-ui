import { createFileRoute } from '@tanstack/react-router'
import DocsLayout from '#/components/DocsLayout/DocsLayout'

export const Route = createFileRoute('/docs/getting-started/overview')({
  component: RouteComponent,
})

function RouteComponent() {
  return <DocsLayout docPath="getting-started/overview" />
}
