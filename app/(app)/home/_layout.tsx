import { Slot, Stack } from 'one'
import { YStack } from 'tamagui'

import { HomeShell } from '~/features/app/HomeShell'

export function AppLayout() {
  return (
    <HomeShell>
      {process.env.VITE_PLATFORM === 'web' ? (
        <Slot />
      ) : (
        <YStack flex={1}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="settings" />
          </Stack>
        </YStack>
      )}
    </HomeShell>
  )
}
