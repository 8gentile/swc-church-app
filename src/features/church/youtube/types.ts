/** Minimal YouTube Data API v3 shapes used by the sermons tab. */

export type YouTubePlaylistItem = {
  snippet: {
    title: string
    publishedAt: string
    thumbnails?: {
      medium?: { url: string }
      high?: { url: string }
      default?: { url: string }
    }
    resourceId: {
      videoId: string
    }
  }
}

export type YouTubeSearchVideo = {
  id: {
    videoId: string
  }
  snippet: {
    title: string
  }
}
