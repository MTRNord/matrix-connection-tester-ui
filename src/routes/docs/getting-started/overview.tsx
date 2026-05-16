import { createFileRoute } from '@tanstack/react-router'
import DocsLayout from '#/components/DocsLayout/DocsLayout'

export const Route = createFileRoute('/docs/getting-started/overview')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <DocsLayout
      docPath="getting-started/overview"
      lead="What the connectivity tester checks and how to read the results."
    />
  )
}
