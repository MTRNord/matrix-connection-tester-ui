import { createFileRoute } from '@tanstack/react-router'
import DocsLayout from '#/components/DocsLayout/DocsLayout'

export const Route = createFileRoute('/docs/api-endpoints/webhooks')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <DocsLayout
      docPath="api-endpoints/webhooks"
      lead="Receive signed HTTP POST notifications for federation events — integrate with PagerDuty, Slack, or any custom automation."
    />
  )
}
