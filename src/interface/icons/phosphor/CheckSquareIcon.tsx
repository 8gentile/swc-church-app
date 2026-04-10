import Svg, { Path, Rect } from 'react-native-svg'

import { useIconProps } from '~/interface/icons/useIconProps'

import type { IconProps } from '~/interface/icons/types'

export const CheckSquareIcon = (props: IconProps) => {
  const { width, height, fill, ...svgProps } = useIconProps(props)

  return (
    <Svg width={width} height={height} viewBox="0 0 256 256" fill="none" {...svgProps}>
      <Rect x="40" y="40" width="176" height="176" rx="16" stroke={fill} strokeWidth="16" fill="none" />
      <Path
        d="M108 172a8 8 0 0 1-5.66-2.34l-36-36a8 8 0 0 1 11.32-11.32L108 152.69l70.34-70.35a8 8 0 0 1 11.32 11.32l-76 76A8 8 0 0 1 108 172Z"
        fill={fill}
      />
    </Svg>
  )
}
