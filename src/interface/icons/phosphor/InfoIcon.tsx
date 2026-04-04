import Svg, { Path } from 'react-native-svg'

import { useIconProps } from '~/interface/icons/useIconProps'

import type { IconProps } from '~/interface/icons/types'

export const InfoIcon = (props: IconProps) => {
  const { width, height, fill, ...svgProps } = useIconProps(props)

  return (
    <Svg width={width} height={height} viewBox="0 0 256 256" fill="none" {...svgProps}>
      <Path
        d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm0-144a8,8,0,0,0-8,8v48a8,8,0,0,0,16,0V88A8,8,0,0,0,128,72Zm0,32a12,12,0,1,0,12,12A12,12,0,0,0,128,104Z"
        fill={fill}
      />
    </Svg>
  )
}
