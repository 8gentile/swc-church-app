import { useMemo, useState } from 'react'
import { FlatList } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  isWeb,
  Paragraph,
  Separator,
  Sheet,
  SizableText,
  XStack,
  YStack,
} from 'tamagui'

import { useAuth } from '~/features/auth/client/authClient'
import { Input } from '~/interface/forms/Input'
import { Pressable } from '~/interface/buttons/Pressable'
import { PageContainer } from '~/interface/layout/PageContainer'
import { H1, H3 } from '~/interface/text/Headings'
import { CheckSquareIcon } from '~/interface/icons/phosphor/CheckSquareIcon'
import { SquareIcon } from '~/interface/icons/phosphor/SquareIcon'

import { useEventsFromZero, type CachedEvent } from './useEventsFromZero'
import { useSignupsFromZero } from './useSignupsFromZero'

function formatEventDate(dt: string): string {
  const d = new Date(dt)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatEventTime(dt: string): string {
  const d = new Date(dt)
  const h = d.getHours()
  const m = d.getMinutes()
  if (h === 0 && m === 0) return 'All day'
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function matchesSearch(event: CachedEvent, query: string): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  const haystack = [event.name, event.location, event.description].filter(Boolean).join(' ').toLowerCase()
  return words.every((w) => haystack.includes(w))
}

type DateGroup = { dateKey: string; label: string; events: CachedEvent[] }

function groupByDate(events: CachedEvent[]): DateGroup[] {
  const map = new Map<string, CachedEvent[]>()
  for (const e of events) {
    const key = e.startDatetime?.slice(0, 10) ?? 'unknown'
    const list = map.get(key) ?? []
    list.push(e)
    map.set(key, list)
  }
  return [...map.entries()].map(([dateKey, evts]) => ({
    dateKey,
    label: formatEventDate(evts[0]!.startDatetime),
    events: evts,
  }))
}

function SignupToggle({
  signedUp,
  pending,
  onToggle,
}: {
  signedUp: boolean
  pending: boolean
  onToggle: () => void
}) {
  return (
    <Pressable
      onPress={(e) => {
        e.stopPropagation?.()
        onToggle()
      }}
      p="$2"
      rounded="$10"
      hoverStyle={{ bg: '$color3' }}
      pressStyle={{ bg: '$color4' }}
      opacity={pending ? 0.7 : 1}
    >
      {signedUp ? (
        <CheckSquareIcon size={24} color="$blue9" />
      ) : (
        <SquareIcon size={24} color="$blue9" />
      )}
    </Pressable>
  )
}

function EventRow({
  event,
  onPress,
  signedUp,
  pending,
  onToggle,
  showToggle,
}: {
  event: CachedEvent
  onPress: () => void
  signedUp: boolean
  pending: boolean
  onToggle: () => void
  showToggle: boolean
}) {
  const time = formatEventTime(event.startDatetime)

  return (
    <Pressable
      py="$3"
      px="$3"
      rounded="$3"
      hoverStyle={{ bg: '$color3' }}
      pressStyle={{ bg: '$color4' }}
      onPress={onPress}
    >
      <XStack items="center" gap="$3">
        <YStack
          width={48}
          height={48}
          rounded="$3"
          bg="$blue3"
          items="center"
          justify="center"
        >
          <SizableText size="$2" fontWeight="700" color="$blue11">
            {time}
          </SizableText>
        </YStack>
        <YStack flex={1} gap="$1">
          <SizableText size="$4" fontWeight="600" color="$color12">
            {event.name}
          </SizableText>
          {event.location ? (
            <SizableText size="$2" color="$color10">
              {event.location}
            </SizableText>
          ) : null}
        </YStack>
        {showToggle ? (
          <SignupToggle signedUp={signedUp} pending={pending} onToggle={onToggle} />
        ) : null}
      </XStack>
    </Pressable>
  )
}

function EventDetailSheet({
  event,
  open,
  onOpenChange,
  isSignedUp,
  isPending,
  onToggle,
  showToggle,
}: {
  event: CachedEvent | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isSignedUp: boolean
  isPending: boolean
  onToggle: () => void
  showToggle: boolean
}) {
  if (!event) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal dismissOnSnapToBottom snapPoints={[55]}>
      <Sheet.Overlay
        bg="$shadow6"
        transition="quick"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
      />
      <Sheet.Frame bg="$color2" p="$4">
        <YStack gap="$3" flex={1}>
          <H3 size="$6" fontWeight="700">
            {event.name}
          </H3>

          <XStack gap="$3" items="center">
            <SizableText size="$3" color="$blue11" fontWeight="600">
              {formatEventDate(event.startDatetime)}
            </SizableText>
            <SizableText size="$3" color="$color10">
              {formatEventTime(event.startDatetime)}
            </SizableText>
          </XStack>

          {event.location ? (
            <SizableText size="$3" color="$color10">
              {event.location}
            </SizableText>
          ) : null}

          {event.description ? (
            <>
              <Separator />
              <Paragraph size="$3" color="$color11">
                {event.description}
              </Paragraph>
            </>
          ) : null}

          <YStack flex={1} />

          {showToggle ? (
            <Pressable
              py="$3"
              px="$4"
              rounded="$3"
              bg={isSignedUp ? '$green3' : '$blue3'}
              hoverStyle={{ bg: isSignedUp ? '$green4' : '$blue4' }}
              pressStyle={{ bg: isSignedUp ? '$green5' : '$blue5' }}
              items="center"
              opacity={isPending ? 0.7 : 1}
              onPress={() => onToggle()}
            >
              <XStack gap="$2" items="center">
                {isSignedUp ? (
                  <CheckSquareIcon size={20} color="$blue9" />
                ) : (
                  <SquareIcon size={20} color="$blue9" />
                )}
                <SizableText
                  size="$4"
                  fontWeight="600"
                  color={isSignedUp ? '$green11' : '$blue11'}
                >
                  {isSignedUp ? 'Signed up — tap to remove' : 'Tap to sign up'}
                </SizableText>
              </XStack>
            </Pressable>
          ) : (
            <YStack items="center">
              <Paragraph size="$2" color="$color10">
                Sign in to register for events
              </Paragraph>
            </YStack>
          )}
        </YStack>
      </Sheet.Frame>
    </Sheet>
  )
}

function DateGroupSection({
  group,
  onEventPress,
  isSignedUp,
  isPending,
  onToggle,
  showToggle,
}: {
  group: DateGroup
  onEventPress: (e: CachedEvent) => void
  isSignedUp: (id: string) => boolean
  isPending: (id: string) => boolean
  onToggle: (id: string) => void
  showToggle: boolean
}) {
  return (
    <YStack gap="$1" mb="$3">
      <SizableText
        size="$3"
        fontWeight="700"
        color="$blue11"
        px="$3"
        py="$1"
        textTransform="uppercase"
      >
        {group.label}
      </SizableText>
      <YStack
        bg="$color2"
        rounded="$4"
        borderWidth={1}
        borderColor="$borderColor"
        overflow="hidden"
      >
        {group.events.map((event, i) => (
          <YStack key={event.instanceId}>
            {i > 0 ? <Separator /> : null}
            <EventRow
              event={event}
              onPress={() => onEventPress(event)}
              signedUp={isSignedUp(event.instanceId)}
              pending={isPending(event.instanceId)}
              onToggle={() => onToggle(event.instanceId)}
              showToggle={showToggle}
            />
          </YStack>
        ))}
      </YStack>
    </YStack>
  )
}

export function EventsTabContent() {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const { events } = useEventsFromZero()
  const signups = useSignupsFromZero(user?.id)
  const [selectedEvent, setSelectedEvent] = useState<CachedEvent | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [search, setSearch] = useState('')

  const topPad = isWeb ? '$3' : insets.top + 8
  const showToggle = !!user?.id

  const filtered = useMemo(() => {
    if (!search.trim()) return events
    return events.filter((e) => matchesSearch(e, search))
  }, [events, search])

  const groups = useMemo(() => groupByDate(filtered), [filtered])

  const handleEventPress = (event: CachedEvent) => {
    setSelectedEvent(event)
    setSheetOpen(true)
  }

  return (
    <YStack flex={1} width="100%" maxW="100%" bg="$background">
      <PageContainer flex={1} maxW={960}>
        {/* Sticky header */}
        <YStack pt={topPad} pb="$2" bg="$background">
          <XStack items="center" justify="space-between" mb="$3">
            <H1 size="$8" fontWeight="700">
              Events
            </H1>
          </XStack>
          <Input
            placeholder="Search events..."
            value={search}
            onChangeText={setSearch}
            height={40}
            size="$3"
            bg="$color2"
            borderColor="$borderColor"
            rounded="$3"
          />
        </YStack>

        {/* Scrollable content */}
        {events.length === 0 ? (
          <Paragraph color="$color11">
            {search.trim() ? 'No events match your search.' : 'No upcoming events.'}
          </Paragraph>
        ) : filtered.length === 0 ? (
          <Paragraph color="$color11">No events match your search.</Paragraph>
        ) : (
          <FlatList
            style={{ flex: 1 }}
            data={groups}
            keyExtractor={(group) => group.dateKey}
            renderItem={({ item: group }) => (
              <DateGroupSection
                group={group}
                onEventPress={handleEventPress}
                isSignedUp={signups.isSignedUp}
                isPending={signups.isPending}
                onToggle={signups.toggle}
                showToggle={showToggle}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: isWeb ? 24 : insets.bottom + 8 }}
          />
        )}
      </PageContainer>

      <EventDetailSheet
        event={selectedEvent}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        isSignedUp={selectedEvent ? signups.isSignedUp(selectedEvent.instanceId) : false}
        isPending={selectedEvent ? signups.isPending(selectedEvent.instanceId) : false}
        onToggle={() => {
          if (selectedEvent) signups.toggle(selectedEvent.instanceId)
        }}
        showToggle={showToggle}
      />
    </YStack>
  )
}
