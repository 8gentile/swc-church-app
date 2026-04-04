import { Slot } from 'one'
import { YStack } from 'tamagui'

import { PageMainContainer } from '~/interface/layout/PageContainer'

export const SettingLayout = () => {
  return (
    <YStack flex={1}>
      <PageMainContainer flex={1} $xl={{ maxW: 760 }}>
        <Slot />
      </PageMainContainer>
    </YStack>
  )
}
