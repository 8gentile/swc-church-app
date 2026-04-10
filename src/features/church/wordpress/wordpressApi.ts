import { getWordpressOrigin } from '~/config/churchEnv'

export type WordPressPage = {
  id: number
  title: { rendered: string }
  content: { rendered: string }
  modified: string
}

export async function fetchWordPressPage(pageId: string): Promise<WordPressPage> {
  const origin = getWordpressOrigin()
  if (!origin) {
    throw new Error('Missing WORDPRESS_ORIGIN')
  }
  const url = `${origin}/wp-json/wp/v2/pages/${pageId}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`WordPress ${res.status}: ${url}`)
  }
  return res.json() as Promise<WordPressPage>
}

export async function fetchWordPressPageBySlug(slug: string): Promise<WordPressPage | null> {
  const origin = getWordpressOrigin()
  if (!origin) {
    throw new Error('Missing WORDPRESS_ORIGIN')
  }
  const url = `${origin}/wp-json/wp/v2/pages?slug=${encodeURIComponent(slug)}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`WordPress ${res.status}: ${url}`)
  }
  const pages = (await res.json()) as WordPressPage[]
  return pages[0] ?? null
}