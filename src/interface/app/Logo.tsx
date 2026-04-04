import { SizableText, XStack } from 'tamagui'

import { APP_NAME } from '~/constants/app'
import { LogoIcon } from './LogoIcon'

export const Logo = ({ height = 24 }: { height?: number }) => {
  return (
    <XStack items="center" gap={height / 2}>
      <LogoIcon size={height} />
      <SizableText
        select="none"
        fontFamily="$mono"
        fontSize={height * 0.65}
        lineHeight={height * 0.65}
        $max-md={{ display: 'none' }}
      >
        {APP_NAME}
      </SizableText>
    </XStack>
  )
}
