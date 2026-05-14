/* eslint-disable i18next/no-literal-string -- docs content not yet i18n-ready */
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/docs/getting-started/getting-help')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/docs/getting-started/getting-help"!</div>
}
