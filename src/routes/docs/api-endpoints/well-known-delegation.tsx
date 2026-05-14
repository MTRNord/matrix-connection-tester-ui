/* eslint-disable i18next/no-literal-string -- docs content not yet i18n-ready */
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/docs/api-endpoints/well-known-delegation',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/docs/api-endpoints/well-known-delegation"!</div>
}
