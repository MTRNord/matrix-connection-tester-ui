import { createFileRoute } from '@tanstack/react-router'
import DocsLayout from '#/components/DocsLayout/DocsLayout'

export const Route = createFileRoute('/docs/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <DocsLayout
      docPath="index"
      lead="A small, friendly handbook for diagnosing and configuring Matrix homeserver connectivity. We assume you can read a config file but not that you've memorised the Matrix Specification."
    />
  )
}
