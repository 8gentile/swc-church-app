/**
 * Background worker that syncs Breeze ChMS data with our local Postgres tables.
 *
 * - Polls Breeze events every 15 min and upserts into `eventCache`
 * - Pushes pending signups/sign-outs to Breeze every 30s
 *
 * All Breeze API calls go through the rate limiter in breeze.ts.
 */

import { and, eq, gte, inArray, lte, ne } from 'drizzle-orm'

import { getDb } from '~/database'
import { eventCache, eventSignup } from '~/database/schema-public'
import { user as userTable } from '~/database/schema-private'
import {
  listEvents,
  listAttendance,
  findPersonByEmail,
  createPerson,
  addAttendance,
  removeAttendance,
} from '~/server/breeze'

const EVENT_POLL_INTERVAL = 15 * 60_000
const SIGNUP_PUSH_INTERVAL = 30_000
const ATTENDANCE_SYNC_INTERVAL = 15 * 60_000
const EVENT_LOOKAHEAD_DAYS = 60
const ATTENDANCE_LOOKAHEAD_DAYS = 14

let eventPollTimer: ReturnType<typeof setInterval> | null = null
let signupPushTimer: ReturnType<typeof setInterval> | null = null

function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// ── Events poll ──────────────────────────────────────────────────────

async function pollEvents() {
  try {
    const now = new Date()
    const start = formatDate(now)
    const end = new Date(now)
    end.setDate(end.getDate() + EVENT_LOOKAHEAD_DAYS)
    const endStr = formatDate(end)

    const breezeEvents = await listEvents(start, endStr)
    const db = getDb()

    for (const evt of breezeEvents) {
      await db
        .insert(eventCache)
        .values({
          instanceId: evt.id,
          eventId: evt.event_id,
          name: evt.name,
          startDatetime: evt.start_datetime,
          endDatetime: evt.end_datetime || null,
          location: evt.location || null,
          description: evt.description || null,
          categoryId: evt.category_id || null,
          syncedAt: new Date().toISOString(),
        })
        .onConflictDoUpdate({
          target: eventCache.instanceId,
          set: {
            eventId: evt.event_id,
            name: evt.name,
            startDatetime: evt.start_datetime,
            endDatetime: evt.end_datetime || null,
            location: evt.location || null,
            description: evt.description || null,
            categoryId: evt.category_id || null,
            syncedAt: new Date().toISOString(),
          },
        })
    }

    console.info(`[breeze-sync] polled ${breezeEvents.length} events`)
  } catch (err) {
    console.error('[breeze-sync] event poll failed:', err instanceof Error ? err.message : err)
  }
}

// ── Signup push ──────────────────────────────────────────────────────
//
// Designed for bursty load: 100 people × 2 events = 200 pending rows.
// Strategy:
//   1. Resolve each user's Breeze person ID once (cached in-memory + DB).
//   2. Drain all pending rows — no arbitrary batch limit.
//   3. Each addAttendance/removeAttendance call is rate-limited by the
//      queue in breeze.ts, so we just fire them all and the queue paces
//      them at ~17/min. A 200-signup burst drains in ~12 minutes.

const personIdCache = new Map<string, string | null>()

async function resolveBreezePerson(
  userId: string,
  existingPersonId: string | null,
): Promise<string | null> {
  if (existingPersonId) return existingPersonId

  const cached = personIdCache.get(userId)
  if (cached !== undefined) return cached

  const db = getDb()
  const rows = await db
    .select({ email: userTable.email, name: userTable.name })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1)

  const appUser = rows[0]
  if (!appUser?.email) {
    personIdCache.set(userId, null)
    return null
  }

  let person = await findPersonByEmail(appUser.email)
  if (!person) {
    const [first, ...rest] = (appUser.name ?? '').split(' ')
    person = await createPerson(first ?? 'Guest', rest.join(' '), appUser.email)
  }

  const personId = person?.id ?? null
  personIdCache.set(userId, personId)
  return personId
}

async function pushSignups() {
  try {
    const db = getDb()

    const pending = await db
      .select()
      .from(eventSignup)
      .where(inArray(eventSignup.status, ['pending_add', 'pending_remove']))

    if (pending.length === 0) return

    // group by user so we resolve each person once
    const byUser = new Map<string, typeof pending>()
    for (const row of pending) {
      const list = byUser.get(row.userId) ?? []
      list.push(row)
      byUser.set(row.userId, list)
    }

    let processed = 0
    let failed = 0

    for (const [userId, rows] of byUser) {
      const firstWithPerson = rows.find((r) => r.breezePersonId)
      let personId: string | null
      try {
        personId = await resolveBreezePerson(userId, firstWithPerson?.breezePersonId ?? null)
      } catch (err) {
        console.warn(
          `[breeze-sync] could not resolve Breeze person for user ${userId}:`,
          err instanceof Error ? err.message : err,
        )
        failed += rows.length
        continue
      }

      if (!personId) {
        console.warn(`[breeze-sync] no Breeze person found for user ${userId}`)
        failed += rows.length
        continue
      }

      for (const row of rows) {
        try {
          if (!row.breezePersonId) {
            await db
              .update(eventSignup)
              .set({ breezePersonId: personId })
              .where(eq(eventSignup.id, row.id))
          }

          if (row.status === 'pending_add') {
            await addAttendance(personId, row.instanceId)
            await db
              .update(eventSignup)
              .set({
                status: 'confirmed',
                breezeSyncedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              })
              .where(eq(eventSignup.id, row.id))
          } else if (row.status === 'pending_remove') {
            await removeAttendance(personId, row.instanceId)
            await db.delete(eventSignup).where(eq(eventSignup.id, row.id))
          }

          processed++
        } catch (err) {
          failed++
          console.error(
            `[breeze-sync] failed to sync signup ${row.id}:`,
            err instanceof Error ? err.message : err,
          )
        }
      }
    }

    console.info(
      `[breeze-sync] push: ${processed} synced` +
        (failed > 0 ? `, ${failed} failed` : '') +
        ` (${pending.length} total pending)`,
    )
  } catch (err) {
    console.error('[breeze-sync] signup push failed:', err instanceof Error ? err.message : err)
  }
}

// ── Attendance pull (Breeze → local) ─────────────────────────────────

async function syncAttendance() {
  try {
    const db = getDb()

    const appUsers = await db
      .select({ id: userTable.id, email: userTable.email, name: userTable.name })
      .from(userTable)

    console.info(`[breeze-sync] attendance: found ${appUsers.length} app users`)
    if (appUsers.length === 0) return

    // resolve Breeze person IDs for all app users
    const userPersonMap = new Map<string, { userId: string; email: string }>()
    for (const u of appUsers) {
      if (!u.email) continue
      const person = await findPersonByEmail(u.email)
      if (person) {
        userPersonMap.set(person.id, { userId: u.id, email: u.email })
      }
    }

    console.info(
      `[breeze-sync] attendance: resolved ${userPersonMap.size} Breeze person(s)`,
    )
    if (userPersonMap.size === 0) return

    // get upcoming event instances within the attendance window
    const now = new Date()
    const end = new Date(now)
    end.setDate(end.getDate() + ATTENDANCE_LOOKAHEAD_DAYS)

    const upcomingEvents = await db
      .select({ instanceId: eventCache.instanceId })
      .from(eventCache)
      .where(
        and(
          gte(eventCache.startDatetime, formatDate(now)),
          lte(eventCache.startDatetime, formatDate(end) + ' 23:59:59'),
        ),
      )

    console.info(
      `[breeze-sync] attendance: checking ${upcomingEvents.length} upcoming events`,
    )

    let synced = 0
    for (const evt of upcomingEvents) {
      const attendance = await listAttendance(evt.instanceId)
      for (const record of attendance) {
        const match = userPersonMap.get(record.person_id)
        if (!match) continue

        const existing = await db
          .select({ id: eventSignup.id, status: eventSignup.status })
          .from(eventSignup)
          .where(
            and(
              eq(eventSignup.userId, match.userId),
              eq(eventSignup.instanceId, evt.instanceId),
            ),
          )
          .limit(1)

        if (existing.length > 0) continue

        await db.insert(eventSignup).values({
          id: crypto.randomUUID(),
          userId: match.userId,
          instanceId: evt.instanceId,
          status: 'confirmed',
          breezePersonId: record.person_id,
          breezeSyncedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        synced++
      }
    }

    console.info(
      `[breeze-sync] attendance: done — synced ${synced} new records`,
    )
  } catch (err) {
    console.error(
      '[breeze-sync] attendance sync failed:',
      err instanceof Error ? err.message : err,
    )
  }
}

// ── Lifecycle ────────────────────────────────────────────────────────

let attendanceSyncTimer: ReturnType<typeof setInterval> | null = null

export async function initBreezeSync() {
  console.info('[breeze-sync] starting worker')

  // initial poll on startup, then sync attendance after events are loaded
  await pollEvents()
  void syncAttendance()

  eventPollTimer = setInterval(() => void pollEvents(), EVENT_POLL_INTERVAL)
  signupPushTimer = setInterval(() => void pushSignups(), SIGNUP_PUSH_INTERVAL)
  attendanceSyncTimer = setInterval(() => void syncAttendance(), ATTENDANCE_SYNC_INTERVAL)
}

export function stopBreezeSync() {
  if (eventPollTimer) clearInterval(eventPollTimer)
  if (signupPushTimer) clearInterval(signupPushTimer)
  if (attendanceSyncTimer) clearInterval(attendanceSyncTimer)
  eventPollTimer = null
  signupPushTimer = null
  attendanceSyncTimer = null
  console.info('[breeze-sync] worker stopped')
}
