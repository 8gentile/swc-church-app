import { Link, usePathname } from 'one'
import { SizableText, useMedia, XStack, YStack } from 'tamagui'

import { Pressable } from '~/interface/buttons/Pressable'
import { HouseIcon } from '~/interface/icons/phosphor/HouseIcon'
import { UserCircleIcon } from '~/interface/icons/phosphor/UserCircleIcon'

import type { Href } from 'one'

type TabRoute = {
  name: string
  label: string
  href: Href
  icon: typeof HouseIcon
}

const routes: TabRoute[] = [
  { name: 'home', label: 'Home', href: '/home/feed', icon: HouseIcon },
  { name: 'profile', label: 'Profile', href: '/home/settings', icon: UserCircleIcon },
]

export function NavigationTabs() {
  const pathname = usePathname()
  const media = useMedia()
  const iconSize = media.sm ? 26 : 22

  const currentTab =
    routes.find((r) => pathname.startsWith(r.href as string))?.name ?? 'home'

  return (
    <XStack gap="$1" flex={1} maxW={320} mx="auto" justify="space-around" width="100%">
      {routes.map((route) => {
        const Icon = route.icon
        const isActive = currentTab === route.name
        return (
          <Link key={route.name} href={route.href}>
            <Pressable
              flex={1}
              maxW={140}
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
                <SizableText size="$1" fontWeight={isActive ? '600' : '500'} color={isActive ? '$color12' : '$color10'}>
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
