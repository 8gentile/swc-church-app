import { useParams, createRoute } from 'one'
import { memo } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { isWeb, Paragraph, ScrollView, XStack, YStack } from 'tamagui'

import { SermonYoutubePlayer } from '~/features/church/youtube/SermonYoutubePlayer'
import { HeaderBackButton } from '~/interface/buttons/HeaderBackButton'
import { PageContainer } from '~/interface/layout/PageContainer'

const route = createRoute<'/(app)/home/(tabs)/sermons/[videoId]'>()

const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/

export default memo(function SermonDetailPage() {
  const { videoId = '' } = useParams<{ videoId: string }>()
  const insets = useSafeAreaInsets()
  const valid = VIDEO_ID_RE.test(videoId)

  const body = (
    <YStack flex={1} width="100%" maxW="100%" bg="$background">
      <PageContainer flex={1} maxW={960}>
        <XStack mb="$4" items="center" gap="$2">
          <HeaderBackButton />
        </XStack>
        {valid ? (
          <YStack gap="$4" width="100%">
            <SermonYoutubePlayer videoId={videoId} play />
          </YStack>
        ) : (
          <Paragraph color="$color11">This video link is not valid.</Paragraph>
        )}
      </PageContainer>
    </YStack>
  )

  if (isWeb) {
    return (
      <YStack flex={1} pt="$4" pb="$6">
        {body}
      </YStack>
    )
  }

  return (
    <ScrollView flex={1} pt={insets.top + 8} pb={insets.bottom + 24}>
      {body}
    </ScrollView>
  )
})
