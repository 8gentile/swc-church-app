import { Link, usePathname } from 'one'
import { SizableText, useMedia, XStack, YStack } from 'tamagui'

import { getEngageGiveUrl } from '~/config/churchEnv'
import { openExternalUrl } from '~/features/church/openExternalUrl'
import { Pressable } from '~/interface/buttons/Pressable'
import { CalendarBlankIcon } from '~/interface/icons/phosphor/CalendarBlankIcon'
import { HeartIcon } from '~/interface/icons/phosphor/HeartIcon'
import { InfoIcon } from '~/interface/icons/phosphor/InfoIcon'
import { PlayIcon } from '~/interface/icons/phosphor/PlayIcon'
import { showToast } from '~/interface/toast/helpers'

import type { Href } from 'one'

type TabRoute =
  | {
      kind: 'link'
      name: string
      label: string
      href: Href
      icon: typeof PlayIcon
    }
  | {
      kind: 'give'
      name: string
      label: string
      icon: typeof HeartIcon
    }

const routes: TabRoute[] = [
  { kind: 'link', name: 'sermons', label: 'Sermons', href: '/home/sermons', icon: PlayIcon },
  { kind: 'link', name: 'events', label: 'Events', href: '/home/events', icon: CalendarBlankIcon },
  { kind: 'give', name: 'give', label: 'Give', icon: HeartIcon },
  { kind: 'link', name: 'about', label: 'About', href: '/home/about', icon: InfoIcon },
]

export function NavigationTabs() {
  const pathname = usePathname()
  const media = useMedia()
  const iconSize = media.sm ? 24 : 20
  const giveIconSize = media.sm ? 28 : 24

  const currentTab =
    routes.find((r) => r.kind === 'link' && pathname.startsWith(r.href as string))?.name ??
    'sermons'

  const onGivePress = () => {
    const url = getEngageGiveUrl()
    if (!url) {
      showToast('Set VITE_ENGAGE_GIVE_URL in your environment to enable giving.', { type: 'error' })
      return
    }
    void openExternalUrl(url).catch(() => {
      showToast('Could not open the giving page.', { type: 'error' })
    })
  }

  return (
    <XStack gap="$2" flex={1} maxW={480} mx="auto" justify="space-between" width="100%" items="flex-end">
      {routes.map((route) => {
        if (route.kind === 'give') {
          const Icon = route.icon
          return (
            <Pressable
              key={route.name}
              flex={1}
              maxW={120}
              py="$1"
              items="center"
              justify="center"
              aria-label={route.label}
              onPress={onGivePress}
            >
              <YStack
                items="center"
                justify="center"
                rounded="$10"
                px="$3"
                py="$2"
                bg="$blue10"
                borderWidth={1}
                borderColor="$blue8"
                elevation="$2"
                $platform-web={{
                  boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
                }}
                hoverStyle={{ bg: '$blue9' }}
                pressStyle={{ scale: 0.97 }}
              >
                <Icon size={giveIconSize} color="$color1" />
                <SizableText size="$1" fontWeight="700" color="$color1" mt="$1">
                  {route.label}
                </SizableText>
              </YStack>
            </Pressable>
          )
        }

        const Icon = route.icon
        const isActive = currentTab === route.name
        return (
          <Link key={route.name} href={route.href}>
            <Pressable
              flex={1}
              maxW={120}
              py="$2"
              rounded="$4"
              items="center"
              justify="center"
              bg={isActive ? '$color3' : 'transparent'}
              hoverStyle={{ bg: '$color2' }}
              aria-label={route.label}
            >
              <YStack items="center" gap="$1">
                <Icon size={iconSize} color={isActive ? '$color12' : '$color10'} />
                <SizableText
                  size="$1"
                  fontWeight={isActive ? '600' : '500'}
                  color={isActive ? '$color12' : '$color10'}
                >
                  {route.label}
                </SizableText>
              </YStack>
            </Pressable>
          </Link>
        )
      })}
    </XStack>
  )
}
