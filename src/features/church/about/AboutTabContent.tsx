import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  isWeb,
  Paragraph,
  ScrollView,
  Separator,
  SizableText,
  Spinner,
  XStack,
  YStack,
} from 'tamagui'

import { getChurchDisplayName, getWordpressOrigin } from '~/config/churchEnv'
import { openExternalUrl } from '~/features/church/openExternalUrl'
import { extractTextSections } from '~/features/church/wordpress/stripHtml'
import { useAboutPage } from './useAboutPage'
import { Button } from '~/interface/buttons/Button'
import { PageContainer } from '~/interface/layout/PageContainer'
import { H1, H3 } from '~/interface/text/Headings'

function InfoCard({ children }: { children: React.ReactNode }) {
  return (
    <YStack
      bg="$color3"
      rounded="$4"
      p="$4"
      gap="$3"
      borderWidth={1}
      borderColor="$borderColor"
    >
      {children}
    </YStack>
  )
}

function LinkRow({ label, url }: { label: string; url: string }) {
  return (
    <XStack
      items="center"
      justify="space-between"
      py="$2"
      px="$1"
      cursor="pointer"
      hoverStyle={{ bg: '$color4' }}
      rounded="$2"
      onPress={() => void openExternalUrl(url)}
    >
      <SizableText size="$4" color="$color12">
        {label}
      </SizableText>
      <SizableText size="$3" color="$color10">
        &rsaquo;
      </SizableText>
    </XStack>
  )
}

function ServiceTimesSection({ html }: { html: string }) {
  const sections = extractTextSections(html)

  if (sections.length === 0) {
    return (
      <Paragraph color="$color11" size="$4">
        Service times are not available right now.
      </Paragraph>
    )
  }

  return (
    <YStack gap="$2">
      {sections.map((s, i) => (
        <YStack key={i} gap="$1">
          {s.heading ? (
            <SizableText size="$5" fontWeight="700" color="$color12">
              {s.heading}
            </SizableText>
          ) : null}
          {s.body ? (
            <Paragraph size="$4" color="$color11" whiteSpace="pre-wrap">
              {s.body}
            </Paragraph>
          ) : null}
        </YStack>
      ))}
    </YStack>
  )
}

export function AboutTabContent() {
  const insets = useSafeAreaInsets()
  const { page, loading, error } = useAboutPage()
  const churchName = getChurchDisplayName()
  const origin = getWordpressOrigin()

  const topPad = isWeb ? '$5' : insets.top + 12

  const content = (
    <YStack flex={1} width="100%" maxW="100%" bg="$background">
      <PageContainer flex={1} maxW={960} pt={topPad} pb="$6">
        <H1 size="$8" fontWeight="700" mb="$5">
          About
        </H1>

        {/* Service Times */}
        <InfoCard>
          <H3 size="$6" fontWeight="600">
            Service Times
          </H3>
          {loading ? (
            <YStack py="$4" items="center">
              <Spinner size="small" />
            </YStack>
          ) : error ? (
            <Paragraph color="$color11" size="$4">
              {error}
            </Paragraph>
          ) : page ? (
            <ServiceTimesSection html={page.content.rendered} />
          ) : null}
        </InfoCard>

        <YStack height="$1" />

        {/* Location */}
        <InfoCard>
          <H3 size="$6" fontWeight="600">
            Location
          </H3>
          <Paragraph size="$4" color="$color11">
            {churchName}
          </Paragraph>
          <Paragraph size="$4" color="$color11">
            535 Stroud Street{'\n'}Stroudsburg, PA 18360
          </Paragraph>
          <Button
            size="$3"
            mt="$1"
            onPress={() =>
              void openExternalUrl(
                'https://maps.google.com/?q=535+Stroud+Street,+Stroudsburg,+PA+18360'
              )
            }
          >
            Open in Maps
          </Button>
        </InfoCard>

        <YStack height="$1" />

        {/* Quick Links */}
        <InfoCard>
          <H3 size="$6" fontWeight="600">
            Links
          </H3>
          <Separator />
          {origin ? (
            <>
              <LinkRow label="Church Website" url={origin} />
              <Separator />
            </>
          ) : null}
          <LinkRow
            label="Facebook"
            url="https://www.facebook.com/groups/stroudsburgwesleyan"
          />
          <Separator />
          <LinkRow
            label="YouTube"
            url="https://www.youtube.com/@stroudsburgwesleyanchurch8704"
          />
          <Separator />
          <LinkRow label="Contact Us" url="https://www.stroudsburgwesleyan.org/contact-us-2/" />
        </InfoCard>
      </PageContainer>
    </YStack>
  )

  if (isWeb) {
    return (
      <YStack flex={1} overflow="scroll">
        {content}
      </YStack>
    )
  }

  return (
    <ScrollView flex={1} showsVerticalScrollIndicator={false}>
      {content}
    </ScrollView>
  )
}
