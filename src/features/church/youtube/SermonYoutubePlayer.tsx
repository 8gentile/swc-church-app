import { useEffect, useState } from 'react'
import { Dimensions, Platform, useWindowDimensions } from 'react-native'
import { YStack } from 'tamagui'

type Props = {
  videoId: string
  play?: boolean
}

function usePlayerWidth(): number {
  const { width: w } = useWindowDimensions()
  const [measured, setMeasured] = useState(() => Dimensions.get('window').width)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const sync = () => setMeasured(window.innerWidth)
    sync()
    window.addEventListener('resize', sync)
    return () => window.removeEventListener('resize', sync)
  }, [])

  const effective = Math.max(w || 0, measured || 0, 320)
  return Math.min(effective - 32, 960)
}

/**
 * Web: plain YouTube embed iframe (react-native-web-webview doesn't work in this stack).
 * Native: react-native-youtube-iframe (WebView-based).
 */
export function SermonYoutubePlayer({ videoId, play = false }: Props) {
  const maxW = usePlayerWidth()
  const height = Math.max(Math.round((maxW * 9) / 16), 180)

  if (Platform.OS === 'web') {
    const autoplay = play ? 1 : 0
    const src = `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay}&rel=0`
    return (
      <YStack width="100%" maxW={maxW} mx="auto" overflow="hidden" rounded="$4" bg="$color3">
        <iframe
          src={src}
          width={maxW}
          height={height}
          style={{ border: 'none', display: 'block' }}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          title="YouTube video player"
        />
      </YStack>
    )
  }

  // Native — lazy-import to avoid bundling WebView on web
  const YoutubePlayer = require('react-native-youtube-iframe').default
  return (
    <YStack width="100%" maxW={maxW} mx="auto" overflow="hidden" rounded="$4" bg="$color3">
      <YoutubePlayer height={height} width={maxW} videoId={videoId} play={play} />
    </YStack>
  )
}
