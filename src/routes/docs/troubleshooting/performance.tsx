import { createFileRoute } from '@tanstack/react-router'
import DocsLayout from '#/components/DocsLayout/DocsLayout'

export const Route = createFileRoute('/docs/troubleshooting/performance')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <DocsLayout
      docPath="troubleshooting/performance"
      lead="Identify what is slow and where to look for performance bottlenecks."
    />
  )
}
