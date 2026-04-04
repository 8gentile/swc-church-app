import { Link, usePathname } from 'one'
import { useState } from 'react'
import { SizableText, XStack, YStack } from 'tamagui'

import { getEngageGiveUrl } from '~/config/churchEnv'
import { openExternalUrl } from '~/features/church/openExternalUrl'
import { MainHeaderMenu } from './MainHeader'
import { Pressable } from '~/interface/buttons/Pressable'
import { CalendarBlankIcon } from '~/interface/icons/phosphor/CalendarBlankIcon'
import { DotsThreeIcon } from '~/interface/icons/phosphor/DotsThreeIcon'
import { HeartIcon } from '~/interface/icons/phosphor/HeartIcon'
import { InfoIcon } from '~/interface/icons/phosphor/InfoIcon'
import { PlayIcon } from '~/interface/icons/phosphor/PlayIcon'
import { showToast } from '~/interface/toast/helpers'

import type { Href } from 'one'

type TabRoute =
  | { kind: 'link'; name: string; label: string; href: Href; icon: typeof PlayIcon }
  | { kind: 'give'; name: string; label: string; icon: typeof HeartIcon }
  | { kind: 'menu'; name: string; label: string; icon: typeof DotsThreeIcon }

const routes: TabRoute[] = [
  { kind: 'link', name: 'sermons', label: 'Sermons', href: '/home/sermons', icon: PlayIcon },
  { kind: 'link', name: 'events', label: 'Events', href: '/home/events', icon: CalendarBlankIcon },
  { kind: 'give', name: 'give', label: 'Give', icon: HeartIcon },
  { kind: 'link', name: 'about', label: 'About', href: '/home/about', icon: InfoIcon },
  { kind: 'menu', name: 'more', label: 'More', icon: DotsThreeIcon },
]

const ICON_SIZE = 22

export function NavigationTabs() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const currentTab =
    routes.find((r) => r.kind === 'link' && pathname.startsWith(r.href as string))?.name ??
    'sermons'

  const onGivePress = () => {
    const url = getEngageGiveUrl()
    if (!url) {
      showToast('Set ENGAGE_GIVE_URL in your environment to enable giving.', { type: 'error' })
      return
    }
    void openExternalUrl(url).catch(() => {
      showToast('Could not open the giving page.', { type: 'error' })
    })
  }

  return (
    <XStack flex={1} maxW={500} mx="auto" width="100%" items="center" justify="space-evenly">
      {routes.map((route) => {
        if (route.kind === 'give') {
          const Icon = route.icon
          return (
            <Pressable
              key={route.name}
              py="$1.5"
              px="$2"
              items="center"
              justify="center"
              aria-label={route.label}
              onPress={onGivePress}
            >
              <YStack items="center" gap="$1">
                <Icon size={ICON_SIZE} color="$color10" />
                <SizableText size="$1" fontWeight="500" color="$color10">
                  {route.label}
                </SizableText>
              </YStack>
            </Pressable>
          )
        }

        if (route.kind === 'menu') {
          const Icon = route.icon
          return (
            <MainHeaderMenu
              key={route.name}
              open={menuOpen}
              onOpenChange={setMenuOpen}
              trigger={
                <Pressable
                  py="$1.5"
                  px="$2"
                  items="center"
                  justify="center"
                  aria-label={route.label}
                  onPress={() => setMenuOpen(true)}
                >
                  <YStack items="center" gap="$1">
                    <Icon size={ICON_SIZE} color="$color10" />
                    <SizableText size="$1" fontWeight="500" color="$color10">
                      {route.label}
                    </SizableText>
                  </YStack>
                </Pressable>
              }
            />
          )
        }

        const Icon = route.icon
        const isActive = currentTab === route.name
        return (
          <Link key={route.name} href={route.href}>
            <Pressable
              py="$1.5"
              px="$2"
              rounded="$3"
              items="center"
              justify="center"
              bg={isActive ? '$color3' : 'transparent'}
              hoverStyle={{ bg: '$color2' }}
              aria-label={route.label}
            >
              <YStack items="center" gap="$1">
                <Icon size={ICON_SIZE} color={isActive ? '$color12' : '$color10'} />
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
