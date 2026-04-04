import { Stack } from 'one'

export function SermonsTabLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[videoId]" />
    </Stack>
  )
}
