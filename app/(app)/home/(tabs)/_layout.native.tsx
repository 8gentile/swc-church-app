import { Tabs } from 'one'

export function TabsLayout() {
  return (
    <Tabs
      initialRouteName="sermons"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="sermons" />
      <Tabs.Screen name="events" />
      <Tabs.Screen name="feed" />
      <Tabs.Screen name="about" />
    </Tabs>
  )
}
