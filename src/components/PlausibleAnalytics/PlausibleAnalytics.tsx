import { useEffect, useRef } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { init, track } from '@plausible-analytics/tracker'
import { configQueryOptions } from '#/config'

function isDntEnabled() {
  return navigator.doNotTrack === '1'
}

export function PlausibleAnalytics() {
  const { data: config } = useQuery(configQueryOptions)
  const location = useRouterState({ select: (s) => s.location.href })
  const initializedRef = useRef(false)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (!config?.plausible_domain || !config.plausible_api_host) return
    if (initializedRef.current) return
    init({
      domain: config.plausible_domain,
      endpoint: `${config.plausible_api_host}/api/event`,
      autoCapturePageviews: false,
    })
    initializedRef.current = true
    if (!isDntEnabled()) track('pageview', {})
  }, [config?.plausible_domain, config?.plausible_api_host])

  // Skip first location change — initial pageview is fired by the init effect above
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (!initializedRef.current || isDntEnabled()) return
    track('pageview', {})
  }, [location])

  return null
}
