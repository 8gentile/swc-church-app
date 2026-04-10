import { useCallback, useMemo } from 'react'

import { useQuery, zero } from '~/zero/client'
import { mySignups } from '~/data/queries/events'

export function useSignupsFromZero(userId: string | undefined) {
  const uid = userId ?? ''
  const [rows] = useQuery(mySignups, { userId: uid })

  const signupMap = useMemo(() => {
    const map = new Map<string, { id: string; status: string }>()
    for (const row of rows ?? []) {
      map.set(row.instanceId, { id: row.id, status: row.status })
    }
    return map
  }, [rows])

  const isSignedUp = useCallback(
    (instanceId: string): boolean => {
      const signup = signupMap.get(instanceId)
      if (!signup) return false
      return signup.status === 'pending_add' || signup.status === 'confirmed'
    },
    [signupMap],
  )

  const isPending = useCallback(
    (instanceId: string): boolean => {
      const signup = signupMap.get(instanceId)
      if (!signup) return false
      return signup.status === 'pending_add' || signup.status === 'pending_remove'
    },
    [signupMap],
  )

  const toggle = useCallback(
    (instanceId: string) => {
      if (!userId) return

      const existing = signupMap.get(instanceId)
      const now = Date.now()

      if (!existing) {
        const id = crypto.randomUUID()
        void zero.mutate.eventSignup.insert({
          id,
          userId,
          instanceId,
          status: 'pending_add',
          createdAt: now,
          updatedAt: now,
        })
      } else if (existing.status === 'pending_add') {
        void zero.mutate.eventSignup.delete({ id: existing.id })
      } else if (existing.status === 'confirmed') {
        void zero.mutate.eventSignup.update({
          id: existing.id,
          status: 'pending_remove',
          updatedAt: now,
        })
      } else if (existing.status === 'pending_remove') {
        void zero.mutate.eventSignup.update({
          id: existing.id,
          status: 'confirmed',
          updatedAt: now,
        })
      }
    },
    [userId, signupMap],
  )

  return {
    isSignedUp,
    isPending,
    toggle,
  }
}
