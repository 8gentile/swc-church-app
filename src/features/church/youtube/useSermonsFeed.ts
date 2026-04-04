import { useCallback, useEffect, useState } from 'react'

import { getYoutubeChannelId } from '~/config/churchEnv'

import type { YouTubePlaylistItem } from './types'
import { fetchPlaylistItems, getUploadsPlaylistIdCached } from './youtubeApi'

export type SermonsFeedState = {
  items: YouTubePlaylistItem[]
  loading: boolean
  loadingMore: boolean
  refreshing: boolean
  error: string | null
  hasMore: boolean
  reload: () => void
  loadMore: () => void
}

export function useSermonsFeed(): SermonsFeedState {
  const channelId = getYoutubeChannelId()
  const [items, setItems] = useState<YouTubePlaylistItem[]>([])
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadFirstPage = useCallback(async () => {
    if (!channelId) {
      setItems([])
      setError(null)
      setLoading(false)
      return
    }
    setError(null)
    setLoading(true)
    setNextPageToken(undefined)
    try {
      const playlistId = await getUploadsPlaylistIdCached(channelId)
      const page = await fetchPlaylistItems(playlistId)
      setItems(page.items)
      setNextPageToken(page.nextPageToken)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load sermons.')
      setItems([])
      setNextPageToken(undefined)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [channelId])

  useEffect(() => {
    void loadFirstPage()
  }, [loadFirstPage])

  const reload = useCallback(() => {
    if (!channelId) return
    setRefreshing(true)
    void loadFirstPage()
  }, [channelId, loadFirstPage])

  const loadMore = useCallback(async () => {
    if (!channelId || !nextPageToken || loadingMore || loading) return
    setLoadingMore(true)
    setError(null)
    try {
      const playlistId = await getUploadsPlaylistIdCached(channelId)
      const page = await fetchPlaylistItems(playlistId, nextPageToken)
      setItems((prev) => [...prev, ...page.items])
      setNextPageToken(page.nextPageToken)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Could not load more.')
    } finally {
      setLoadingMore(false)
    }
  }, [channelId, nextPageToken, loadingMore, loading])

  return {
    items,
    loading,
    loadingMore,
    refreshing,
    error,
    hasMore: !!nextPageToken,
    reload,
    loadMore,
  }
}
