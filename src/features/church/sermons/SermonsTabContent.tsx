import { Link } from 'one'
import { useEffect, useMemo, useState } from 'react'
import { FlatList, RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { isWeb, Paragraph, Spinner, XStack, YStack, SizableText } from 'tamagui'

import { getYoutubeApiKey, getYoutubeChannelId } from '~/config/churchEnv'
import { useLiveBroadcast } from '~/features/church/youtube/useLiveBroadcast'
import { useSermonsFeed } from '~/features/church/youtube/useSermonsFeed'
import type { YouTubePlaylistItem } from '~/features/church/youtube/types'
import { Button } from '~/interface/buttons/Button'
import { Pressable } from '~/interface/buttons/Pressable'
import { Image } from '~/interface/image/Image'
import { PageContainer } from '~/interface/layout/PageContainer'
import { H1, H3 } from '~/interface/text/Headings'

function formatPublishedAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(iso))
  } catch {
    return ''
  }
}

function useIsOnline(): boolean {
  const [online, setOnline] = useState(true)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return
    const sync = () => setOnline(navigator.onLine)
    sync()
    window.addEventListener('online', sync)
    window.addEventListener('offline', sync)
    return () => {
      window.removeEventListener('online', sync)
      window.removeEventListener('offline', sync)
    }
  }, [])
  return online
}

function SermonRow({ item }: { item: YouTubePlaylistItem }) {
  const videoId = item.snippet.resourceId.videoId
  const thumb =
    item.snippet.thumbnails?.medium?.url ??
    item.snippet.thumbnails?.high?.url ??
    item.snippet.thumbnails?.default?.url

  return (
    <Link href={`/home/sermons/${videoId}`}>
      <Pressable py="$3" px="$2" rounded="$4" hoverStyle={{ bg: '$color3' }} pressStyle={{ bg: '$color4' }}>
        <XStack gap="$3" width="100%" items="flex-start">
          {thumb ? (
            <Image
              source={{ uri: thumb }}
              width={120}
              height={68}
              rounded="$2"
              alt=""
            />
          ) : (
            <YStack width={120} height={68} bg="$color4" rounded="$2" />
          )}
          <YStack flex={1} gap="$1">
            <H3 size="$3" fontWeight="600" numberOfLines={3}>
              {item.snippet.title}
            </H3>
            <SizableText size="$2" color="$color10">
              {formatPublishedAt(item.snippet.publishedAt)}
            </SizableText>
          </YStack>
        </XStack>
      </Pressable>
    </Link>
  )
}

export function SermonsTabContent() {
  const insets = useSafeAreaInsets()
  const online = useIsOnline()
  const hasConfig = !!(getYoutubeApiKey() && getYoutubeChannelId())
  const { liveVideoId } = useLiveBroadcast()
  const { items, loading, loadingMore, refreshing, error, hasMore, reload, loadMore } = useSermonsFeed()

  const listHeader = useMemo(() => {
    if (!liveVideoId) return null
    return (
      <YStack mb="$4" p="$4" rounded="$4" bg="$color3" borderWidth={1} borderColor="$borderColor">
        <XStack justify="space-between" items="center" flexWrap="wrap" gap="$3">
          <YStack flex={1} gap="$1">
            <SizableText size="$2" fontWeight="700" opacity={0.95}>
              LIVE NOW
            </SizableText>
            <SizableText size="$4" fontWeight="600">
              Join Sunday Service
            </SizableText>
          </YStack>
          <Link href={`/home/sermons/${liveVideoId}`}>
            <Button size="$3" theme="blue">
              Watch live
            </Button>
          </Link>
        </XStack>
      </YStack>
    )
  }, [liveVideoId])

  if (!hasConfig) {
    return (
      <YStack flex={1} pt={isWeb ? '$5' : insets.top + 12} width="100%" maxW="100%">
        <PageContainer maxW={960}>
          <H1 size="$8" fontWeight="700" mb="$3">
            Sermons
          </H1>
          <Paragraph color="$color11">
            Add <SizableText fontFamily="$mono">YOUTUBE_API_KEY</SizableText> and{' '}
            <SizableText fontFamily="$mono">YOUTUBE_CHANNEL_ID</SizableText> to your environment to load
            videos from YouTube.
          </Paragraph>
        </PageContainer>
      </YStack>
    )
  }

  if (!online) {
    return (
      <YStack flex={1} pt={isWeb ? '$5' : insets.top + 12} px="$4" maxW={960} mx="auto" width="100%">
        <H1 size="$8" fontWeight="700" mb="$3">
          Sermons
        </H1>
        <Paragraph color="$color11" mb="$4">
          You appear to be offline. Check your connection and try again.
        </Paragraph>
        <Button onPress={() => reload()}>Retry</Button>
      </YStack>
    )
  }

  return (
    <YStack flex={1} width="100%" maxW="100%" bg="$background">
      <YStack flex={1} pt={isWeb ? '$3' : insets.top + 8} pb={isWeb ? '$4' : insets.bottom + 8}>
        <PageContainer flex={1} maxW={960}>
          <H1 size="$8" fontWeight="700" mb="$4">
            Sermons
          </H1>

          {loading && items.length === 0 ? (
            <YStack py="$8" items="center">
              <Spinner size="large" />
            </YStack>
          ) : (
            <FlatList
              style={{ flex: 1 }}
              data={items}
              keyExtractor={(row) => row.snippet.resourceId.videoId}
              ListHeaderComponent={listHeader}
              renderItem={({ item }) => <SermonRow item={item} />}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={() => reload()} enabled={!loading} />
              }
              onEndReached={() => {
                if (hasMore && !loadingMore) void loadMore()
              }}
              onEndReachedThreshold={0.4}
              ListFooterComponent={
                loadingMore ? (
                  <YStack py="$4" items="center">
                    <Spinner />
                  </YStack>
                ) : null
              }
              ListEmptyComponent={
                !loading ? (
                  <Paragraph color="$color11">
                    {error ?? 'No sermons found.'}
                  </Paragraph>
                ) : null
              }
            />
          )}

          {error && items.length > 0 ? (
            <YStack py="$3">
              <Paragraph color="$red10" mb="$2">
                {error}
              </Paragraph>
              <Button size="$3" onPress={() => reload()}>
                Retry
              </Button>
            </YStack>
          ) : null}
        </PageContainer>
      </YStack>
    </YStack>
  )
}
