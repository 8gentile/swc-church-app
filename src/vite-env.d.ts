/// <reference types="vite/client" />

/** Church tenant keys (see `src/config/churchEnv.ts`, `.env.production.example`). */
interface ImportMetaEnv {
  readonly ENGAGE_GIVE_URL?: string
  readonly CHURCH_DISPLAY_NAME?: string
  readonly YOUTUBE_API_KEY?: string
  readonly YOUTUBE_CHANNEL_ID?: string
  readonly WORDPRESS_ORIGIN?: string
  readonly WORDPRESS_EVENTS_PAGE_ID?: string
  readonly WORDPRESS_ABOUT_PAGE_ID?: string
  readonly WORDPRESS_ABOUT_PAGE_SLUG?: string
}
