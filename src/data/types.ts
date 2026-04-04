import type { User, UserState } from './generated/types'

export type * from './generated/types'

export type UserWithState = User & {
  state?: UserState
}

export type UserWithRelations = User & {
  state?: UserState
}
