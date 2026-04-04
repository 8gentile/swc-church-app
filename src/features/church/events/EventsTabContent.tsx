import { Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { isWeb, Paragraph, Spinner, SizableText, YStack } from 'tamagui'

import { openExternalUrl } from '~/features/church/openExternalUrl'
import { useEventsCalendarUrl } from './useEventsCalendarUrl'
import { Button } from '~/interface/buttons/Button'
import { PageContainer } from '~/interface/layout/PageContainer'
import { H1 } from '~/interface/text/Headings'

export function EventsTabContent() {
  const insets = useSafeAreaInsets()
  const { calendarUrl, webUrl, loading, error } = useEventsCalendarUrl()

  const topPad = isWeb ? '$5' : insets.top + 12

  if (loading) {
    return (
      <YStack flex={1} pt={topPad} width="100%" maxW="100%" bg="$background">
        <PageContainer maxW={960}>
          <H1 size="$8" fontWeight="700" mb="$4">
            Events
          </H1>
          <YStack py="$8" items="center">
            <Spinner size="large" />
          </YStack>
        </PageContainer>
      </YStack>
    )
  }

  if (error || !calendarUrl) {
    return (
      <YStack flex={1} pt={topPad} width="100%" maxW="100%" bg="$background">
        <PageContainer maxW={960}>
          <H1 size="$8" fontWeight="700" mb="$3">
            Events
          </H1>
          <Paragraph color="$color11" mb="$4">
            {error ?? 'Events calendar is not available right now.'}
          </Paragraph>
          {webUrl ? (
            <Button
              size="$4"
              onPress={() => void openExternalUrl(webUrl)}
            >
              View events on website
            </Button>
          ) : null}
        </PageContainer>
      </YStack>
    )
  }

  if (Platform.OS === 'web') {
    return (
      <YStack flex={1} width="100%" maxW="100%" bg="$background">
        <PageContainer flex={1} maxW={960} pt={topPad} pb="$4">
          <H1 size="$8" fontWeight="700" mb="$4">
            Events
          </H1>
          <YStack
            flex={1}
            width="100%"
            rounded="$4"
            overflow="hidden"
            borderWidth={1}
            borderColor="$borderColor"
            style={{ minHeight: 600 }}
          >
            <iframe
              src={calendarUrl}
              style={{
                border: 'none',
                width: '100%',
                height: '100%',
                minHeight: 600,
                display: 'block',
                background: 'white',
              }}
              title="Church events calendar"
            />
          </YStack>
          {webUrl ? (
            <SizableText
              size="$3"
              color="$color10"
              mt="$3"
              cursor="pointer"
              textDecorationLine="underline"
              onPress={() => void openExternalUrl(webUrl)}
            >
              View full calendar on website
            </SizableText>
          ) : null}
        </PageContainer>
      </YStack>
    )
  }

  // Native: use WebView for the Breeze calendar embed
  const WebView = require('react-native-webview').default
  return (
    <YStack flex={1} bg="$background" pt={insets.top}>
      <PageContainer maxW={960}>
        <H1 size="$8" fontWeight="700" mb="$3" px="$2">
          Events
        </H1>
      </PageContainer>
      <YStack flex={1} mx="$2" mb={insets.bottom} rounded="$4" overflow="hidden">
        <WebView
          source={{ uri: calendarUrl }}
          style={{ flex: 1 }}
          startInLoadingState
          javaScriptEnabled
        />
      </YStack>
    </YStack>
  )
}
