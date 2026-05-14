import { createFileRoute } from '@tanstack/react-router'
import DocsLayout from '#/components/DocsLayout/DocsLayout'

export const Route = createFileRoute('/docs/troubleshooting/general')({
  component: RouteComponent,
})

function RouteComponent() {
  return <DocsLayout docPath="troubleshooting/general" />
}
