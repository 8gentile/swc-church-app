/**
 * Lightweight HTML → plain-text conversion for WordPress `content.rendered`.
 * Handles the common patterns from WP block editor / Gutenverse without
 * pulling in a full DOM parser (keeps bundle small for mobile).
 */

/** Decode common HTML entities. */
function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

/** Strip HTML tags and return readable plain text, preserving line breaks. */
export function stripHtml(html: string): string {
  let text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')

  text = decodeEntities(text)
  text = text.replace(/[ \t]+/g, ' ')
  text = text.replace(/\n{3,}/g, '\n\n')
  return text.trim()
}

/** Extract structured sections from service-times-style WP content. */
export function extractTextSections(html: string): { heading: string; body: string }[] {
  const parts = html.split(/<h[1-6][^>]*>/gi)
  const sections: { heading: string; body: string }[] = []

  for (const part of parts) {
    const headingMatch = part.match(/^(.*?)<\/h[1-6]>/i)
    if (headingMatch) {
      const heading = stripHtml(headingMatch[1]!)
      const body = stripHtml(part.slice(headingMatch[0].length))
      if (heading || body) {
        sections.push({ heading, body })
      }
    } else {
      const body = stripHtml(part)
      if (body) {
        sections.push({ heading: '', body })
      }
    }
  }

  return sections
}
