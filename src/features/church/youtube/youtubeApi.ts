import { getYoutubeApiKey } from '~/config/churchEnv'

import type { YouTubePlaylistItem, YouTubeSearchVideo } from './types'

const BASE = 'https://www.googleapis.com/youtube/v3'

function buildUrl(path: string, params: Record<string, string>): string {
  const u = new URL(`${BASE}/${path}`)
  for (const [k, v] of Object.entries(params)) {
    u.searchParams.set(k, v)
  }
  return u.toString()
}

async function youtubeGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const key = getYoutubeApiKey()
  if (!key) {
    throw new Error('Missing YOUTUBE_API_KEY')
  }
  const url = buildUrl(path, { ...params, key })
  const res = await fetch(url)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`YouTube API ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.json() as Promise<T>
}

/** `channels.list` → uploads playlist id (UU…). */
export async function fetchUploadsPlaylistId(channelId: string): Promise<string> {
  const data = await youtubeGet<{ items?: Array<{ contentDetails?: { relatedPlaylists?: { uploads?: string } } }> }>(
    'channels',
    {
      part: 'contentDetails',
      id: channelId,
    },
  )
  const uploads = data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads
  if (!uploads) {
    throw new Error('Could not resolve uploads playlist for this channel.')
  }
  return uploads
}

export type PlaylistItemsPage = {
  items: YouTubePlaylistItem[]
  nextPageToken?: string
}

export async function fetchPlaylistItems(
  playlistId: string,
  pageToken?: string,
): Promise<PlaylistItemsPage> {
  const params: Record<string, string> = {
    part: 'snippet,contentDetails',
    playlistId,
    maxResults: '25',
  }
  if (pageToken) {
    params.pageToken = pageToken
  }
  const data = await youtubeGet<{
    items?: YouTubePlaylistItem[]
    nextPageToken?: string
  }>('playlistItems', params)
  return {
    items: data.items ?? [],
    nextPageToken: data.nextPageToken,
  }
}

/** First live video for channel, if any. */
export async function fetchLiveBroadcastVideoId(channelId: string): Promise<string | null> {
  const data = await youtubeGet<{ items?: YouTubeSearchVideo[] }>('search', {
    part: 'snippet',
    channelId,
    eventType: 'live',
    type: 'video',
    maxResults: '1',
  })
  const id = data.items?.[0]?.id?.videoId
  return id ?? null
}

let uploadsPlaylistCache: { channelId: string; playlistId: string } | null = null

/** One `channels.list` per channel id per session (playlist id is stable). */
export async function getUploadsPlaylistIdCached(channelId: string): Promise<string> {
  if (uploadsPlaylistCache?.channelId === channelId) {
    return uploadsPlaylistCache.playlistId
  }
  const playlistId = await fetchUploadsPlaylistId(channelId)
  uploadsPlaylistCache = { channelId, playlistId }
  return playlistId
}
