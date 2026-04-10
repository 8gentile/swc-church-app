import { number, string, table } from '@rocicorp/zero'
import { mutations, serverWhere } from 'on-zero'

import type { TableInsertRow } from 'on-zero'

export type EventCache = TableInsertRow<typeof schema>

export const schema = table('eventCache')
  .columns({
    instanceId: string(),
    eventId: string(),
    name: string(),
    startDatetime: string(),
    endDatetime: string().optional(),
    location: string().optional(),
    description: string().optional(),
    categoryId: string().optional(),
    syncedAt: number(),
  })
  .primaryKey('instanceId')

const permissions = serverWhere('eventCache', () => {
  return true
})

export const mutate = mutations(schema, permissions)
