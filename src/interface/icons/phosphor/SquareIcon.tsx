import Svg, { Rect } from 'react-native-svg'

import { useIconProps } from '~/interface/icons/useIconProps'

import type { IconProps } from '~/interface/icons/types'

export const SquareIcon = (props: IconProps) => {
  const { width, height, fill, ...svgProps } = useIconProps(props)

  return (
    <Svg width={width} height={height} viewBox="0 0 256 256" fill="none" {...svgProps}>
      <Rect x="40" y="40" width="176" height="176" rx="16" stroke={fill} strokeWidth="16" fill="none" />
    </Svg>
  )
}
