import { Redirect } from 'one'

/** `/home` → primary tab (sermons). */
export default function HomeIndexRedirect() {
  return <Redirect href="/home/sermons" />
}
