import { memo } from 'react'

import { TabPlaceholderScreen } from '~/features/church/TabPlaceholderScreen'

export default memo(function EventsTabPage() {
  return (
    <TabPlaceholderScreen title="Events">
      Upcoming events from WordPress will appear here (Ticket 03). Sign-up links will open in your
      system browser.
    </TabPlaceholderScreen>
  )
})
