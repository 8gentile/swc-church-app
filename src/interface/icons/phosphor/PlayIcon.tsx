import Svg, { Path } from 'react-native-svg'

import { useIconProps } from '~/interface/icons/useIconProps'

import type { IconProps } from '~/interface/icons/types'

export const PlayIcon = (props: IconProps) => {
  const { width, height, fill, ...svgProps } = useIconProps(props)

  return (
    <Svg width={width} height={height} viewBox="0 0 256 256" fill="none" {...svgProps}>
      <Path
        d="M240,128a15.74,15.74,0,0,1-7.6,13.52L88.32,229.7a16,16,0,0,1-16.2.3A15.86,15.86,0,0,1,64,216.13V39.87a15.86,15.86,0,0,1,8.12-13.87,16,16,0,0,1,16.2.3L232.4,114.48A15.74,15.74,0,0,1,240,128Z"
        fill={fill}
      />
    </Svg>
  )
}
