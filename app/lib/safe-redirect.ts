/**
 * Safelist validator for auth `redirect` query parameter.
 *
 * Prevents open-redirect attacks. Validates server-side.
 */
export function safeRedirect(raw: string | null, fallback: string): string {
  if (!raw) return fallback

  const trimmed = raw.trim()
  if (!trimmed) return fallback

  // Reject javascript: / data: / vbscript: schemes
  if (/^\s*(javascript|data|vbscript)\s*:/i.test(trimmed)) return fallback

  // Relative path must start with /
  if (!trimmed.startsWith('/')) return fallback
  // Reject protocol-relative URLs
  if (trimmed.startsWith('//')) return fallback
  return trimmed
}
