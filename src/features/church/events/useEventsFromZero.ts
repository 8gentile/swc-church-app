import { useMemo } from 'react'

import { useQuery } from '~/zero/client'
import { allEvents } from '~/data/queries/events'

export type CachedEvent = {
  instanceId: string
  eventId: string
  name: string
  startDatetime: string
  endDatetime: string | null
  location: string | null
  description: string | null
  categoryId: string | null
}

export function useEventsFromZero() {
  const [rows] = useQuery(allEvents)

  const events = useMemo(
    () =>
      (rows as CachedEvent[] | undefined ?? []).map(
        (r): CachedEvent => ({
          instanceId: r.instanceId,
          eventId: r.eventId,
          name: r.name,
          startDatetime: r.startDatetime,
          endDatetime: r.endDatetime ?? null,
          location: r.location ?? null,
          description: r.description ?? null,
          categoryId: r.categoryId ?? null,
        }),
      ),
    [rows],
  )

  return { events, loading: false }
}
