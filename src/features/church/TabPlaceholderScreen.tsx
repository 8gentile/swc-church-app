import type { ReactNode } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { isWeb, Paragraph, ScrollView, YStack } from 'tamagui'

import { PageContainer } from '~/interface/layout/PageContainer'
import { H1 } from '~/interface/text/Headings'

type Props = {
  title: string
  children: ReactNode
}

/**
 * Scrollable placeholder for church tabs until YouTube/WordPress are wired (Tickets 02–04).
 */
export function TabPlaceholderScreen({ title, children }: Props) {
  const insets = useSafeAreaInsets()

  const body = (
    <YStack flex={1} width="100%" maxW="100%" bg="$background">
      <PageContainer flex={1} maxW={960}>
        <YStack pt="$5" pb="$6" gap="$3" width="100%">
          <H1 size="$8" fontWeight="700">
            {title}
          </H1>
          <Paragraph size="$4" color="$color11">
            {children}
          </Paragraph>
        </YStack>
      </PageContainer>
    </YStack>
  )

  if (isWeb) {
    return body
  }

  return (
    <ScrollView flex={1} pt={insets.top + 12}>
      {body}
    </ScrollView>
  )
}
