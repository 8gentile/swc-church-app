import { getURL } from 'one'

const CHURCH_DOMAIN = 'app.stroudsburgwesleyan.org'

export const SERVER_URL = (() => {
  if (typeof location !== 'undefined') {
    return `${location.protocol}//${location.host}`
  }

  let url = getURL()

  if (
    url ===
    'http://one-server.example.com' /* release build — not served by dev server */
  ) {
    url = process.env.ONE_SERVER_URL || `https://${CHURCH_DOMAIN}`
  }
  return url
})()

export const ZERO_SERVER_URL = (() => {
  if (typeof location !== 'undefined') {
    return `${location.protocol}//${location.host}`
  }

  let serverUrl = getURL()
  if (
    serverUrl ===
    'http://one-server.example.com' /* release build — not served by dev server */
  ) {
    const hostname = process.env.VITE_ZERO_HOSTNAME
    return hostname ? `https://${hostname}` : `https://${CHURCH_DOMAIN}`
  } else {
    const hostname = process.env.VITE_ZERO_HOSTNAME
    return hostname ? `https://${hostname}` : 'http://localhost:4948'
  }
})()

export const DEFAULT_HOT_UPDATE_SERVER_URL =
  'https://pckjvzbtdczlpkgujgkb.supabase.co/functions/v1/update-server'

export const API_URL = `${SERVER_URL}/api`
export const AUTH_URL = `${SERVER_URL}/api/auth`
