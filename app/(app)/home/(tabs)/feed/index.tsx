import { memo } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  isWeb,
  Paragraph,
  ScrollView,
  Separator,
  SizableText,
  Theme,
  XStack,
  YStack,
} from 'tamagui'

import { APP_NAME } from '~/constants/app'
import { useAuth } from '~/features/auth/client/authClient'
import { PageContainer } from '~/interface/layout/PageContainer'
import { H1, H3 } from '~/interface/text/Headings'

export const HomePage = memo(() => {
  const { user } = useAuth()
  const insets = useSafeAreaInsets()

  const content = (
    <YStack position="relative" flexBasis="auto" bg="$background" flex={1} width="100%" maxW="100%">
      <Theme name="blue">
        <XStack
          bg="$color3"
          py="$3"
          width="100%"
          borderBottomWidth={1}
          borderColor="$borderColor"
        >
          <PageContainer>
            <SizableText size="$3" opacity={0.9}>
              Signed-in shell · header tabs above · this column is the main surface for
              your app.
            </SizableText>
          </PageContainer>
        </XStack>
      </Theme>

      <YStack
        pb={isWeb ? '$10' : insets.bottom + 40}
        gap="$6"
        px="$4"
        width="100%"
        maxW={960}
        mx="auto"
        flex={1}
      >
        <YStack pt="$6" gap="$3">
          <H1 size="$8" fontWeight="700">
            {APP_NAME}
          </H1>
          <Paragraph size="$5" color="$color11" maxW={560}>
            {user?.name
              ? `Welcome back, ${user.name}.`
              : 'Welcome. Replace this screen with your church app home: announcements, events, and links.'}
          </Paragraph>
        </YStack>

        <Separator />

        <Theme name="dark_blue">
          <YStack
            p="$5"
            gap="$4"
            rounded="$6"
            bg="$color2"
            borderWidth={1}
            borderColor="$borderColor"
            elevation="$1"
            $platform-native={{
              shadowColor: '$shadowColor',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 12,
            }}
          >
            <H3 size="$5" color="$color12">
              Content area
            </H3>
            <Paragraph size="$4" color="$color11" lineHeight="$1">
              Stack primary content here: weekly message, next service time, quick
              actions. Use Tamagui tokens ($color, $space, Theme) so light/dark and themes
              stay consistent.
            </Paragraph>
            <XStack gap="$3" flexWrap="wrap" pt="$2">
              <YStack
                flex={1}
                minW={200}
                p="$4"
                rounded="$4"
                bg="$background"
                borderWidth={1}
                borderColor="$borderColor"
              >
                <SizableText fontWeight="600" size="$3" mb="$2">
                  Secondary panel
                </SizableText>
                <SizableText size="$3" opacity={0.85}>
                  Cards, lists, or a calendar preview—same column grid on narrow screens.
                </SizableText>
              </YStack>
              <YStack
                flex={1}
                minW={200}
                p="$4"
                rounded="$4"
                bg="$background"
                borderWidth={1}
                borderColor="$borderColor"
              >
                <SizableText fontWeight="600" size="$3" mb="$2">
                  Another slot
                </SizableText>
                <SizableText size="$3" opacity={0.85}>
                  Wire each block to Zero queries or static config as you add features.
                </SizableText>
              </YStack>
            </XStack>
          </YStack>
        </Theme>
      </YStack>
    </YStack>
  )

  if (isWeb) {
    return content
  }

  return (
    <ScrollView flex={1} pt={insets.top + 16}>
      {content}
    </ScrollView>
  )
})
