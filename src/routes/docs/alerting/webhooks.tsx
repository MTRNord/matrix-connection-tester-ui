import { createFileRoute } from '@tanstack/react-router'
import DocsLayout from '#/components/DocsLayout/DocsLayout'

export const Route = createFileRoute('/docs/alerting/webhooks')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <DocsLayout
      docPath="alerting/webhooks"
      lead="Receive signed HTTP POST notifications for federation events — integrate with PagerDuty, Slack, or any custom automation."
    />
  )
}
