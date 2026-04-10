import { getChurchDisplayName } from '~/config/churchEnv'

// Brand (`CHURCH_DISPLAY_NAME` — see `src/config/churchEnv.ts`)
export const APP_NAME = getChurchDisplayName()
export const APP_NAME_LOWERCASE = 'swc-church-app'

// Domain (update when deploying to a real domain)
export const DOMAIN = 'stroudsburgwesleyan.org'

// Social
export const FACEBOOK_URL = 'https://www.facebook.com/groups/stroudsburgwesleyan'
export const YOUTUBE_URL = 'https://www.youtube.com/@stroudsburgwesleyanchurch8704'

// Email
export const ADMIN_EMAIL = `admin@${DOMAIN}`

// Demo user (template — not used in church app MVP)
export const DEMO_EMAIL = `demo@${DOMAIN}`
export const DEMO_PASSWORD = 'demopassword123'
export const DEMO_NAME = 'Demo User'
