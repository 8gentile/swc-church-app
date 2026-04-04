import Svg, { Circle } from 'react-native-svg'

import { useIconProps } from '~/interface/icons/useIconProps'

import type { IconProps } from '~/interface/icons/types'

export const DotsThreeIcon = (props: IconProps) => {
  const { width, height, fill, ...svgProps } = useIconProps(props)

  return (
    <Svg width={width} height={height} viewBox="0 0 256 256" fill="none" {...svgProps}>
      <Circle cx="128" cy="128" r="16" fill={fill} />
      <Circle cx="64" cy="128" r="16" fill={fill} />
      <Circle cx="192" cy="128" r="16" fill={fill} />
    </Svg>
  )
}
