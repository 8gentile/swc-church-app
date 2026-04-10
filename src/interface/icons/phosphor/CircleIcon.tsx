import Svg, { Circle as SvgCircle } from 'react-native-svg'

import { useIconProps } from '~/interface/icons/useIconProps'

import type { IconProps } from '~/interface/icons/types'

export const CircleIcon = (props: IconProps) => {
  const { width, height, fill, ...svgProps } = useIconProps(props)

  return (
    <Svg width={width} height={height} viewBox="0 0 256 256" fill="none" {...svgProps}>
      <SvgCircle cx="128" cy="128" r="96" stroke={fill} strokeWidth="16" fill="none" />
    </Svg>
  )
}
