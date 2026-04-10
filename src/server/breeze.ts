/**
 * Lightweight Breeze ChMS REST client (server-side only).
 *
 * The `breeze-chms` npm wrapper doesn't implement events endpoints, so we
 * call the REST API directly. The API key is an admin secret — this module
 * must never be imported from client code.
 *
 * Rate limit: Breeze enforces 20 requests/minute. We use a sliding-window
 * throttle and response cache to stay well under.
 */

// ── Rate limiter (20 req/min, serialised queue) ──────────────────────

const RATE_WINDOW_MS = 60_000
const MAX_REQUESTS = 18 // leave headroom under the 20/min hard limit
const MIN_GAP_MS = 3_500 // Breeze-recommended minimum between calls

const requestTimestamps: number[] = []
const requestQueue: Array<{
  execute: () => Promise<unknown>
  resolve: (v: unknown) => void
  reject: (e: unknown) => void
}> = []
let processing = false

function canSendNow(): boolean {
  const now = Date.now()
  // prune timestamps older than the window
  while (requestTimestamps.length > 0 && requestTimestamps[0]! < now - RATE_WINDOW_MS) {
    requestTimestamps.shift()
  }
  if (requestTimestamps.length >= MAX_REQUESTS) return false
  const last = requestTimestamps[requestTimestamps.length - 1]
  if (last && now - last < MIN_GAP_MS) return false
  return true
}

function msUntilReady(): number {
  const now = Date.now()
  while (requestTimestamps.length > 0 && requestTimestamps[0]! < now - RATE_WINDOW_MS) {
    requestTimestamps.shift()
  }
  let wait = 0
  if (requestTimestamps.length >= MAX_REQUESTS) {
    wait = Math.max(wait, requestTimestamps[0]! + RATE_WINDOW_MS - now + 50)
  }
  const last = requestTimestamps[requestTimestamps.length - 1]
  if (last) {
    wait = Math.max(wait, last + MIN_GAP_MS - now)
  }
  return Math.max(0, wait)
}

async function processQueue() {
  if (processing) return
  processing = true
  while (requestQueue.length > 0) {
    if (!canSendNow()) {
      const wait = msUntilReady()
      await new Promise((r) => setTimeout(r, wait))
      continue
    }
    const item = requestQueue.shift()!
    requestTimestamps.push(Date.now())
    try {
      const result = await item.execute()
      item.resolve(result)
    } catch (err) {
      item.reject(err)
    }
  }
  processing = false
}

function enqueue<T>(execute: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    requestQueue.push({
      execute: execute as () => Promise<unknown>,
      resolve: resolve as (v: unknown) => void,
      reject,
    })
    void processQueue()
  })
}

// ── Response cache ───────────────────────────────────────────────────

type CacheEntry<T = unknown> = { data: T; expires: number }
const cache = new Map<string, CacheEntry>()

function getCached<T>(key: string): T | undefined {
  const entry = cache.get(key)
  if (!entry) return undefined
  if (Date.now() > entry.expires) {
    cache.delete(key)
    return undefined
  }
  return entry.data as T
}

function setCache<T>(key: string, data: T, ttlMs: number) {
  cache.set(key, { data, expires: Date.now() + ttlMs })
}

// ── Core HTTP helpers ────────────────────────────────────────────────

function getConfig() {
  const subdomain = process.env.BREEZE_SUBDOMAIN
  const apiKey = process.env.BREEZE_API_KEY
  if (!subdomain || !apiKey) {
    throw new Error(
      `Missing BREEZE_SUBDOMAIN or BREEZE_API_KEY in server env. ` +
        `Got subdomain="${subdomain ?? ''}", key="${apiKey ? '***' : '(empty)'}". ` +
        `Make sure both are set in .env.`
    )
  }
  return { baseUrl: `https://${subdomain}.breezechms.com/api`, apiKey }
}

async function rawGet<T = unknown>(path: string, params?: Record<string, string>): Promise<T> {
  const { baseUrl, apiKey } = getConfig()
  const url = new URL(`${baseUrl}${path}`)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v)
    }
  }
  const res = await fetch(url.toString(), {
    headers: { 'Content-Type': 'application/json', 'Api-Key': apiKey },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Breeze ${res.status}: ${path} — ${text.slice(0, 200)}`)
  }
  return res.json() as Promise<T>
}

async function rawPost<T = unknown>(path: string, params?: Record<string, string>): Promise<T> {
  const { baseUrl, apiKey } = getConfig()
  const url = new URL(`${baseUrl}${path}`)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v)
    }
  }
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Api-Key': apiKey },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Breeze ${res.status}: ${path} — ${text.slice(0, 200)}`)
  }
  return res.json() as Promise<T>
}

/** Rate-limited GET */
function breezeGet<T = unknown>(path: string, params?: Record<string, string>): Promise<T> {
  return enqueue(() => rawGet<T>(path, params))
}

/** Rate-limited POST */
function breezePost<T = unknown>(path: string, params?: Record<string, string>): Promise<T> {
  return enqueue(() => rawPost<T>(path, params))
}

// ── Events ──────────────────────────────────────────────────────────

export type BreezeEventRaw = {
  id: string
  oid: string
  event_id: string
  name: string
  category_id: string
  start_datetime: string
  end_datetime: string
  is_modified: string
  created_on: string
  description?: string
  location?: string
}

export type BreezeCalendar = {
  id: string | number
  name: string
  color: string
}

const EVENTS_CACHE_TTL = 5 * 60_000

export async function listEvents(start: string, end: string): Promise<BreezeEventRaw[]> {
  const key = `events:${start}:${end}`
  const cached = getCached<BreezeEventRaw[]>(key)
  if (cached) return cached
  const data = await breezeGet<BreezeEventRaw[]>('/events', { start, end, details: '1' })
  setCache(key, data, EVENTS_CACHE_TTL)
  return data
}

export async function listCalendars(): Promise<BreezeCalendar[]> {
  const key = 'calendars'
  const cached = getCached<BreezeCalendar[]>(key)
  if (cached) return cached
  const data = await breezeGet<BreezeCalendar[]>('/events/calendars/list')
  setCache(key, data, EVENTS_CACHE_TTL)
  return data
}

// ── Profile fields (dynamic discovery) ──────────────────────────────

type BreezeProfileField = { field_id: string; field_type: string; name: string }
type BreezeProfileSection = { id: string; name: string; fields: BreezeProfileField[] }

let _emailFieldId: string | null = null

async function getEmailFieldId(): Promise<string> {
  if (_emailFieldId) return _emailFieldId
  const sections = await breezeGet<BreezeProfileSection[]>('/profile')
  for (const section of sections) {
    for (const field of section.fields) {
      if (field.field_type === 'email') {
        _emailFieldId = field.field_id
        return _emailFieldId
      }
    }
  }
  throw new Error('Could not find email field in Breeze profile schema')
}

// ── People ──────────────────────────────────────────────────────────

export type BreezePersonSummary = {
  id: string
  first_name: string
  last_name: string
}

const PERSON_CACHE_TTL = 5 * 60_000

export async function findPersonByEmail(email: string): Promise<BreezePersonSummary | null> {
  const key = `person:${email.toLowerCase()}`
  const cached = getCached<BreezePersonSummary | null>(key)
  if (cached !== undefined) return cached

  const emailFieldId = await getEmailFieldId()
  const people = await breezeGet<BreezePersonSummary[]>('/people', {
    details: '0',
    filter_json: JSON.stringify({ [emailFieldId]: email }),
  })
  const person = people?.[0] ?? null
  setCache(key, person, PERSON_CACHE_TTL)
  return person
}

export async function createPerson(
  first: string,
  last: string,
  email: string
): Promise<BreezePersonSummary> {
  const emailFieldId = await getEmailFieldId()
  const fieldsJson = JSON.stringify([
    {
      field_id: emailFieldId,
      field_type: 'email',
      response: true,
      details: { address: email },
    },
  ])
  const result = await breezeGet<BreezePersonSummary | BreezePersonSummary[]>('/people/add', {
    first,
    last,
    fields_json: fieldsJson,
  })
  const person = Array.isArray(result) ? result[0]! : result
  // cache the newly created person
  setCache(`person:${email.toLowerCase()}`, person, PERSON_CACHE_TTL)
  return person
}

// ── Attendance (check-in / sign-up) ─────────────────────────────────

export async function addAttendance(personId: string, instanceId: string): Promise<boolean> {
  const result = await breezeGet<boolean | string>('/events/attendance/add', {
    person_id: personId,
    instance_id: instanceId,
  })
  // invalidate attendance cache for this instance
  cache.delete(`attendance:${instanceId}`)
  return !!result
}

export async function removeAttendance(personId: string, instanceId: string): Promise<boolean> {
  const result = await breezeGet<boolean | string>('/events/attendance/delete', {
    person_id: personId,
    instance_id: instanceId,
  })
  cache.delete(`attendance:${instanceId}`)
  return !!result
}

type BreezeAttendanceRecord = {
  instance_id: string
  person_id: string
  check_out: string
  created_on: string
}

const ATTENDANCE_CACHE_TTL = 2 * 60_000

export async function listAttendance(instanceId: string): Promise<BreezeAttendanceRecord[]> {
  const key = `attendance:${instanceId}`
  const cached = getCached<BreezeAttendanceRecord[]>(key)
  if (cached) return cached
  const data = await breezeGet<BreezeAttendanceRecord[]>('/events/attendance/list', {
    instance_id: instanceId,
  })
  setCache(key, data, ATTENDANCE_CACHE_TTL)
  return data
}

// ── Account ─────────────────────────────────────────────────────────

export type BreezeAccountSummary = {
  id: string
  name: string
  subdomain: string
}

export async function getAccountSummary(): Promise<BreezeAccountSummary> {
  return breezeGet<BreezeAccountSummary>('/account/summary')
}
