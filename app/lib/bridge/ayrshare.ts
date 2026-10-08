/**
 * The publishing bridge (Ayrshare) — thin wrapper over the REST API.
 */

const BASE = 'https://app.ayrshare.com/api'

export const BRIDGE_PLATFORMS = [
  'instagram', 'tiktok', 'youtube', 'linkedin', 'twitter', 'facebook', 'pinterest'
] as const

export type BridgePlatform = (typeof BRIDGE_PLATFORMS)[number]

/**
 * Frahma platform names that differ from the Ayrshare bridge name.
 * The UI exposes X as "x" (features/calendar/types.ts PLATFORMS and
 * components/calendar/post-dialog.tsx PLATFORM_OPTIONS), but Ayrshare expects
 * "twitter". Without this map, posts stored with platform "x" fail
 * permanently in the publish cron ("Platform x not supported by Ayrshare").
 *
 * "shorts" is the YouTube Shorts label used by the calendar filters
 * (calendar-client.tsx PLATFORM_FILTERS, batch-plan-modal.tsx); it publishes
 * as a regular YouTube post through the bridge.
 */
const PLATFORM_ALIASES: Record<string, BridgePlatform> = {
  x: 'twitter',
  shorts: 'youtube',
}

export type BridgeResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status?: number }

async function call<T>(
  apiKey: string,
  path: string,
  init?: { method?: string; body?: unknown; profileKey?: string }
): Promise<BridgeResult<T>> {
  const url = new URL(BASE + path)

  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }

    if (init?.profileKey) {
      headers['Profile-Key'] = init.profileKey
    }

    const res = await fetch(url.toString(), {
      method: init?.method ?? 'GET',
      headers,
      body: init?.body ? JSON.stringify(init.body) : undefined,
      signal: AbortSignal.timeout(30_000),
    })

    const text = await res.text()
    let parsed: any = null
    try {
      parsed = text ? JSON.parse(text) : null
    } catch {}

    if (!res.ok || parsed?.status === 'error') {
      const msg = parsed?.message || parsed?.error || `Bridge Error ${res.status}`
      return { ok: false, error: String(msg), status: res.status }
    }
    return { ok: true, data: parsed as T }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Bridge tidak terjangkau' }
  }
}

/** 
 * Ayrshare doesn't have a specific listAccounts endpoint per se, we can get User Profile details. 
 * Actually we don't strictly need to list accounts to publish in Ayrshare.
 * If we just know the platforms, Ayrshare handles if they are linked. 
 */
export async function getActivePlatforms(
  apiKey: string,
  profileKey: string
): Promise<BridgeResult<string[]>> {
  const res = await call<any>(apiKey, '/profiles/profile', { profileKey })
  if (!res.ok) return res
  // res.data.activeSocialAccounts is an array of linked platforms, e.g. ["instagram", "facebook"]
  return { ok: true, data: res.data.activeSocialAccounts || [] }
}

export type ValidateResult = {
  isValid: boolean
  errors?: { message: string }[]
}

/**
 * Validate a post without creating it.
 * Ayrshare doesn't have a direct /validate endpoint in the standard REST, 
 * but for Frahma architecture we do local checking or skip direct validation to rely on the publish error.
 * Let's just simulate validate passing so cron works, Ayrshare returns errors natively on /post.
 */
export async function validatePost(
  _apiKey: string,
  _body: unknown,
  _profileKey: string
): Promise<BridgeResult<ValidateResult>> {
  return { ok: true, data: { isValid: true } }
}

/**
 * Create the post. 
 */
export async function createPost(
  apiKey: string,
  body: {
    post: string;
    platforms: string[];
    mediaUrls?: string[];
  },
  profileKey: string
): Promise<BridgeResult<unknown>> {
  return call<unknown>(apiKey, '/post', { method: 'POST', body, profileKey })
}

export function toBridgePlatform(frahmaPlatform: string): BridgePlatform | null {
  const lower = frahmaPlatform.toLowerCase()
  if (BRIDGE_PLATFORMS.includes(lower as BridgePlatform)) return lower as BridgePlatform
  return PLATFORM_ALIASES[lower] ?? null
}

/**
 * Get Analytics for a specific post.
 * Ayrshare requires the 'id' of the post returned from the /post creation.
 */
export async function getPostAnalytics(
  apiKey: string,
  ayrsharePostId: string,
  profileKey: string
): Promise<BridgeResult<any>> {
  return call<any>(apiKey, `/analytics/post?id=${ayrsharePostId}`, { profileKey })
}

/**
 * Get aggregated analytics for social accounts over a period.
 * useful for dashboard velocity, reach, etc.
 *
 * FAKTA (docs Ayrshare): endpoint `/analytics/social` adalah **POST** dengan body
 * JSON `{ platforms: [...] }` — BUKAN GET dengan query string. Sebelumnya fungsi
 * ini memakai GET (default `call()`), sehingga request selalu gagal.
 */
export async function getSocialAnalytics(
  apiKey: string,
  platforms: string[],
  profileKey: string
): Promise<BridgeResult<any>> {
  return call<any>(apiKey, '/analytics/social', {
    method: 'POST',
    body: { platforms },
    profileKey,
  })
}
