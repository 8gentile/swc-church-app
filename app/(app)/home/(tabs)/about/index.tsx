import { memo } from 'react'

import { TabPlaceholderScreen } from '~/features/church/TabPlaceholderScreen'

export default memo(function AboutTabPage() {
  return (
    <TabPlaceholderScreen title="About">
      Service times, description, and location from WordPress will load here (Ticket 04).
    </TabPlaceholderScreen>
  )
})
