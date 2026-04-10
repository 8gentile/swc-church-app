import { relationships } from '@rocicorp/zero'

import * as tables from './generated/tables'

export const userRelationships = relationships(tables.userPublic, ({ one }) => ({
  state: one({
    sourceField: ['id'],
    destSchema: tables.userState,
    destField: ['userId'],
  }),
}))

export const userStateRelationships = relationships(tables.userState, ({ one }) => ({
  user: one({
    sourceField: ['userId'],
    destSchema: tables.userPublic,
    destField: ['id'],
  }),
}))

export const eventSignupRelationships = relationships(tables.eventSignup, ({ one }) => ({
  user: one({
    sourceField: ['userId'],
    destSchema: tables.userPublic,
    destField: ['id'],
  }),
  event: one({
    sourceField: ['instanceId'],
    destSchema: tables.eventCache,
    destField: ['instanceId'],
  }),
}))

export const allRelationships = [
  userRelationships,
  userStateRelationships,
  eventSignupRelationships,
]
