import { Redirect } from 'one'

/** Legacy `/home/feed` → sermons tab. */
export default function FeedRedirect() {
  return <Redirect href="/home/sermons" />
}
