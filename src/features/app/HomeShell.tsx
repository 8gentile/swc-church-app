import type { ReactNode } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { isWeb, YStack } from 'tamagui'

import { MAIN_BOTTOM_BAR_BASE_HEIGHT, MainBottomBar } from './MainBottomBar'

/**
 * Wraps home routes: main content + bottom tab bar. Reserves bottom inset on web where the bar is fixed.
 */
export function HomeShell({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets()
  const bottomReserve = isWeb
    ? MAIN_BOTTOM_BAR_BASE_HEIGHT + Math.max(insets.bottom, 12)
    : 0

  return (
    <YStack
      flex={1}
      width="100%"
      maxW="100%"
      bg="$background"
      position="relative"
      style={{ minHeight: '100dvh' }}
    >
      <YStack flex={1} width="100%" maxW="100%" pb={bottomReserve}>
        {children}
      </YStack>
      <MainBottomBar />
    </YStack>
  )
}
