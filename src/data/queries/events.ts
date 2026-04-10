import { serverWhere, zql } from 'on-zero'

const eventCachePermission = serverWhere('eventCache', () => {
  return true
})

const eventSignupPermission = serverWhere('eventSignup', (_, auth) => {
  return _.cmp('userId', auth?.id || '')
})

export const allEvents = () => {
  return zql.eventCache.where(eventCachePermission).orderBy('startDatetime', 'asc')
}

export const mySignups = (props: { userId: string }) => {
  return zql.eventSignup.where(eventSignupPermission).where('userId', props.userId)
}
