import { useWindowDimensions } from 'react-native'
import YoutubePlayer from 'react-native-youtube-iframe'
import { YStack } from 'tamagui'

type Props = {
  videoId: string
  /** Start playing when mounted (may still require user gesture on some browsers). */
  play?: boolean
}

/**
 * 16:9 player; width capped for readability (PRD: avoid 100vw overflow on web).
 */
export function SermonYoutubePlayer({ videoId, play = false }: Props) {
  const { width: windowWidth } = useWindowDimensions()
  const maxW = Math.min(windowWidth - 32, 960)
  const height = Math.round((maxW * 9) / 16)

  return (
    <YStack width="100%" maxW={maxW} mx="auto" overflow="hidden" rounded="$4">
      <YoutubePlayer height={height} width={maxW} videoId={videoId} play={play} />
    </YStack>
  )
}
