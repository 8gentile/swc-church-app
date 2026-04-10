import { useEffect, useState } from 'react'

import { getYoutubeChannelId } from '~/config/churchEnv'

import { getCachedLiveVideoId, setCachedLiveVideoId } from './liveBroadcastCache'
import { fetchLiveBroadcastVideoId } from './youtubeApi'

export function useLiveBroadcast(): {
  liveVideoId: string | null | undefined
  error: string | null
} {
  const channelId = getYoutubeChannelId()
  const [liveVideoId, setLiveVideoId] = useState<string | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!channelId) {
      setLiveVideoId(null)
      return
    }

    const cached = getCachedLiveVideoId(channelId)
    if (cached !== undefined) {
      setLiveVideoId(cached)
      return
    }

    let cancelled = false
    setError(null)
    fetchLiveBroadcastVideoId(channelId)
      .then((id) => {
        if (cancelled) return
        setCachedLiveVideoId(channelId, id)
        setLiveVideoId(id)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Live check failed')
        setLiveVideoId(null)
      })

    return () => {
      cancelled = true
    }
  }, [channelId])

  return { liveVideoId, error }
}
