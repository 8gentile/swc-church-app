import { memo } from 'react'

import { TabPlaceholderScreen } from '~/features/church/TabPlaceholderScreen'

export default memo(function SermonsTabPage() {
  return (
    <TabPlaceholderScreen title="Sermons">
      Sermon archive and live stream will load here from YouTube (Ticket 02). This tab is the default
      home for engagement.
    </TabPlaceholderScreen>
  )
})
