import { boolean, index, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core'

export const userPublic = pgTable(
  'userPublic',
  {
    id: text('id').primaryKey(),
    name: text('name'),
    username: text('username'),
    image: text('image'),
    joinedAt: timestamp('joinedAt', { mode: 'string' }).defaultNow().notNull(),
  },
  (table) => [index('userPublic_username_idx').on(table.username)],
)

export const userState = pgTable('userState', {
  userId: text('userId').primaryKey(),
  darkMode: boolean('darkMode').notNull().default(false),
})

export const eventCache = pgTable('eventCache', {
  instanceId: text('instanceId').primaryKey(),
  eventId: text('eventId').notNull(),
  name: text('name').notNull(),
  startDatetime: text('startDatetime').notNull(),
  endDatetime: text('endDatetime'),
  location: text('location'),
  description: text('description'),
  categoryId: text('categoryId'),
  syncedAt: timestamp('syncedAt', { mode: 'string' }).defaultNow().notNull(),
})

export const eventSignup = pgTable(
  'eventSignup',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    instanceId: text('instanceId').notNull(),
    status: text('status').notNull().default('pending_add'),
    createdAt: timestamp('createdAt', { mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updatedAt', { mode: 'string' }).defaultNow().notNull(),
    breezePersonId: text('breezePersonId'),
    breezeSyncedAt: timestamp('breezeSyncedAt', { mode: 'string' }),
  },
  (table) => [
    unique('eventSignup_user_instance_uniq').on(table.userId, table.instanceId),
    index('eventSignup_userId_idx').on(table.userId),
    index('eventSignup_status_idx').on(table.status),
  ],
)
