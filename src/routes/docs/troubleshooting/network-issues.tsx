import { createFileRoute } from '@tanstack/react-router'
import DocsLayout from '#/components/DocsLayout/DocsLayout'

export const Route = createFileRoute('/docs/troubleshooting/network-issues')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <DocsLayout
      docPath="troubleshooting/network-issues"
      lead="Step-by-step guide to diagnosing network and firewall problems."
    />
  )
}
