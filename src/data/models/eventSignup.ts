import { number, string, table } from '@rocicorp/zero'
import { mutations, serverWhere } from 'on-zero'

import type { TableInsertRow } from 'on-zero'

export type EventSignup = TableInsertRow<typeof schema>

export const schema = table('eventSignup')
  .columns({
    id: string(),
    userId: string(),
    instanceId: string(),
    status: string(),
    createdAt: number(),
    updatedAt: number(),
    breezePersonId: string().optional(),
    breezeSyncedAt: number().optional(),
  })
  .primaryKey('id')

const permissions = serverWhere('eventSignup', (_, auth) => {
  return _.cmp('userId', auth?.id || '')
})

export const mutate = mutations(schema, permissions)
