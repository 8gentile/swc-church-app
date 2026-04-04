import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { isWeb, XStack, YStack } from 'tamagui'

import { PageContainer } from '~/interface/layout/PageContainer'

import { MainHeaderMenu } from './MainHeader'
import { NavigationTabs } from './NavigationTabs'

/** Total chrome height for padding scroll areas when the bar is fixed (web). */
export const MAIN_BOTTOM_BAR_BASE_HEIGHT = 56

export function MainBottomBar() {
  const insets = useSafeAreaInsets()
  const safeBottom = Math.max(insets.bottom, 0)

  return (
    <YStack
      {...(isWeb
        ? {
            position: 'fixed' as const,
            b: 0,
            l: 0,
            r: 0,
            zIndex: 100,
          }
        : {})}
      borderTopWidth={1}
      borderColor="$borderColor"
      bg="$background"
      pb={safeBottom}
    >
      <PageContainer>
        <XStack
          width="100%"
          items="center"
          justify="space-between"
          py="$2"
          px="$1"
          height={MAIN_BOTTOM_BAR_BASE_HEIGHT}
        >
          <XStack flex={1} items="center" justify="center">
            <NavigationTabs />
          </XStack>
          <MainHeaderMenu />
        </XStack>
      </PageContainer>
    </YStack>
  )
}
