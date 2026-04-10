/** Short TTL cache for live lookup to reduce YouTube API quota (PRD §7.1). */

const TTL_MS = 3 * 60 * 1000

let cached: { videoId: string | null; at: number; channelId: string } | null = null

export function getCachedLiveVideoId(channelId: string): string | null | undefined {
  if (!cached || cached.channelId !== channelId) {
    return undefined
  }
  if (Date.now() - cached.at > TTL_MS) {
    return undefined
  }
  return cached.videoId
}

export function setCachedLiveVideoId(channelId: string, videoId: string | null): void {
  cached = { channelId, videoId, at: Date.now() }
}
