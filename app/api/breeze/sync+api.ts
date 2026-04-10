import type { Endpoint } from 'one'
import { initBreezeSync } from '~/server/breezeSyncWorker'

let started = false

export const GET: Endpoint = async () => {
  if (!started) {
    started = true
    await initBreezeSync()
  }
  return Response.json({ status: 'sync-started', timestamp: new Date().toISOString() })
}
