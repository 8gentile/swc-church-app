import { useEffect, useState } from 'react'

import { getWordpressEventsPageId, getWordpressOrigin } from '~/config/churchEnv'
import { extractIframeSrcs, fetchWordPressPage } from '~/features/church/wordpress/wordpressApi'

type State = {
  /** Breeze list calendar embed URL (extracted from WP page), or null if not resolved yet. */
  calendarUrl: string | null
  /** Canonical events web page for "view full calendar" fallback. */
  webUrl: string | null
  loading: boolean
  error: string | null
}

/** Prefer the Breeze /embed/calendar/list iframe; fall back to grid if list absent. */
function pickCalendarUrl(srcs: string[]): string | null {
  const list = srcs.find((s) => s.includes('/calendar/list'))
  if (list) return list
  const grid = srcs.find((s) => s.includes('/calendar/grid'))
  if (grid) return grid
  return srcs[0] ?? null
}

export function useEventsCalendarUrl(): State {
  const pageId = getWordpressEventsPageId()
  const origin = getWordpressOrigin()
  const [calendarUrl, setCalendarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const webUrl = origin && pageId ? `${origin}/events/` : null

  useEffect(() => {
    if (!pageId || !origin) {
      setLoading(false)
      setError('Events page not configured (WORDPRESS_ORIGIN / WORDPRESS_EVENTS_PAGE_ID).')
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    fetchWordPressPage(pageId)
      .then((page) => {
        if (cancelled) return
        const srcs = extractIframeSrcs(page.content.rendered)
        const url = pickCalendarUrl(srcs)
        if (url) {
          setCalendarUrl(url)
        } else {
          setError('No calendar embed found on the events page.')
        }
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Could not load events.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [pageId, origin])

  return { calendarUrl, webUrl, loading, error }
}
