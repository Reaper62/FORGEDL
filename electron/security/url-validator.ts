// ponytail: URL validation for download pipeline entry points
// Accepts http/https targets including playlists, channels, and query-param variants.

const MAX_URL_LENGTH = 8192

export function validateDownloadUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    throw new Error('URL is required')
  }

  const trimmed = url.trim()
  if (trimmed.length === 0) {
    throw new Error('URL is required')
  }
  if (trimmed.length > MAX_URL_LENGTH) {
    throw new Error('URL exceeds maximum length')
  }

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    throw new Error('Invalid URL format')
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('URL must use http or https')
  }

  if (!parsed.hostname) {
    throw new Error('URL must include a hostname')
  }

  // Return the trimmed input so query strings (playlists, timestamps, etc.) stay intact.
  return trimmed
}
