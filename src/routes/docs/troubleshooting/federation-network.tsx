/* eslint-disable i18next/no-literal-string -- docs content not yet i18n-ready */
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/docs/troubleshooting/federation-network',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/docs/troubleshooting/federation-network"!</div>
}
