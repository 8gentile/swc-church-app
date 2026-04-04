import { getChurchDisplayName } from '~/config/churchEnv'

// Brand (`CHURCH_DISPLAY_NAME` — see `src/config/churchEnv.ts`)
export const APP_NAME = getChurchDisplayName()
export const APP_NAME_LOWERCASE = 'swc-church-app'

// Domain
export const DOMAIN = 'takeout.tamagui.dev'

// Social
export const TWITTER_URL = 'https://x.com/tamagui__js'
export const GITHUB_URL = 'https://github.com/tamagui'

// Email
export const ADMIN_EMAIL = `admin@${DOMAIN}`

// Demo user (for takeout demo site)
export const DEMO_EMAIL = `demo@${DOMAIN}`
export const DEMO_PASSWORD = 'demopassword123'
export const DEMO_NAME = 'Demo User'
