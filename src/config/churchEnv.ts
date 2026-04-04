/**
 * Church tenant configuration from Vite env (client bundle).
 * See `.env.production.example` and PRD §7.5.
 */

function isHttpUrl(s: string): boolean {
  return /^https?:\/\//.test(s)
}

/** Opens in the system browser from the Give tab (Ticket 01+). */
export function getEngageGiveUrl(): string | undefined {
  const u = import.meta.env.VITE_ENGAGE_GIVE_URL
  return typeof u === 'string' && isHttpUrl(u) ? u : undefined
}

/** UI title; defaults to first-tenant name when env is unset. */
export function getChurchDisplayName(): string {
  const n = import.meta.env.VITE_CHURCH_DISPLAY_NAME
  return typeof n === 'string' && n.trim() ? n.trim() : 'Stroudsburg Wesleyan Church'
}

/** Ticket 02 — YouTube Data API v3 */
export function getYoutubeApiKey(): string | undefined {
  const k = import.meta.env.VITE_YOUTUBE_API_KEY
  return typeof k === 'string' && k.length > 0 ? k : undefined
}

export function getYoutubeChannelId(): string | undefined {
  const id = import.meta.env.VITE_YOUTUBE_CHANNEL_ID
  return typeof id === 'string' && id.length > 0 ? id : undefined
}

/** Tickets 03–04 — WordPress REST */
export function getWordpressOrigin(): string | undefined {
  const o = import.meta.env.VITE_WORDPRESS_ORIGIN
  return typeof o === 'string' && isHttpUrl(o) ? o.replace(/\/$/, '') : undefined
}

export function getWordpressEventsPageId(): string | undefined {
  const id = import.meta.env.VITE_WORDPRESS_EVENTS_PAGE_ID
  return typeof id === 'string' && id.length > 0 ? id : undefined
}

export function getWordpressAboutPageId(): string | undefined {
  const id = import.meta.env.VITE_WORDPRESS_ABOUT_PAGE_ID
  return typeof id === 'string' && id.length > 0 ? id : undefined
}

export function getWordpressAboutPageSlug(): string | undefined {
  const s = import.meta.env.VITE_WORDPRESS_ABOUT_PAGE_SLUG
  return typeof s === 'string' && s.length > 0 ? s : undefined
}
