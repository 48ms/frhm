/**
 * In-memory rate limiter for Next.js API routes.
 *
 * Uses sliding window counter per IP + route. Not distributed across instances
 * (Vercel Edge/Serverless cold starts reset the map), but sufficient for a
 * single-region SaaS. For true distributed rate limiting, migrate to Redis.
 */

type Entry = { count: number; windowStart: number }
const store = new Map<string, Entry>()

// Periodic cleanup: every 5 min, drop windows older than 10 min.
let lastCleanup = Date.now()
function cleanup() {
  if (Date.now() - lastCleanup < 5 * 60_000) return
  lastCleanup = Date.now()
  const cutoff = Date.now() - 10 * 60_000
  for (const [key, val] of store) {
    if (val.windowStart < cutoff) store.delete(key)
  }
}

/**
 * Check and increment the rate limit counter.
 *
 * @returns { limited: true, retryAfter } when the limit is exceeded.
 */
export function checkRateLimit(
  ip: string,
  route: string,
  limit: number,
  windowMs: number = 60_000,
): { limited: boolean; retryAfter?: number; remaining?: number } {
  cleanup()

  const windowStart = Math.floor(Date.now() / windowMs) * windowMs
  const key = `${ip}:${route}`
  const entry = store.get(key)

  if (!entry || entry.windowStart !== windowStart) {
    store.set(key, { count: 1, windowStart })
    return { limited: false, remaining: limit - 1 }
  }

  entry.count++
  const remaining = limit - entry.count

  if (entry.count > limit) {
    const retryAfter = Math.ceil((windowStart + windowMs - Date.now()) / 1000)
    return { limited: true, retryAfter: Math.max(retryAfter, 1) }
  }

  return { limited: false, remaining }
}

/**
 * Helper: get client IP from request headers (works in Vercel / Cloudflare / local dev).
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  )
}

/** Preset limits for different route types. */
export const RATE_LIMITS = {
  /** Login / auth endpoints — tight. */
  auth: { limit: 5, windowMs: 60_000 },     // 5 per minute
  /** Write-heavy mutations — moderate. */
  mutation: { limit: 20, windowMs: 60_000 }, // 20 per minute
  /** AI generation endpoints — expensive. */
  ai: { limit: 3, windowMs: 60_000 },        // 3 per minute
  /** General read endpoints — generous. */
  read: { limit: 60, windowMs: 60_000 },      // 60 per minute
} as const
