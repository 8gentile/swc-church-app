import { useEffect, useState } from 'react'

import {
  getWordpressAboutPageId,
  getWordpressAboutPageSlug,
  getWordpressOrigin,
} from '~/config/churchEnv'
import {
  fetchWordPressPage,
  fetchWordPressPageBySlug,
  type WordPressPage,
} from '~/features/church/wordpress/wordpressApi'

type State = {
  page: WordPressPage | null
  loading: boolean
  error: string | null
}

export function useAboutPage(): State {
  const pageId = getWordpressAboutPageId()
  const pageSlug = getWordpressAboutPageSlug()
  const origin = getWordpressOrigin()

  const [page, setPage] = useState<WordPressPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!origin) {
      setLoading(false)
      setError('WordPress not configured (WORDPRESS_ORIGIN).')
      return
    }
    if (!pageId && !pageSlug) {
      setLoading(false)
      setError('About page not configured (WORDPRESS_ABOUT_PAGE_ID or WORDPRESS_ABOUT_PAGE_SLUG).')
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    const fetcher = pageId
      ? fetchWordPressPage(pageId)
      : fetchWordPressPageBySlug(pageSlug!)

    fetcher
      .then((result) => {
        if (cancelled) return
        if (!result) {
          setError('About page not found.')
          return
        }
        setPage(result)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Could not load About page.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [origin, pageId, pageSlug])

  return { page, loading, error }
}
