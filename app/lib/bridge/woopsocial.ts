/**
 * The publishing bridge (WoopSocial) — thin wrapper over the REST API.
 *
 * Contract source: tools/integrations/woopsocial.md, which pins the capability surface and warns
 * "always treat [the live docs] as the source of truth" for field schemas:
 *
 *   - Health / discover Projects + Social Accounts (Step 0), degrade gracefully if unreachable
 *   - Validate each post before committing
 *   - After explicit user confirmation, create the scheduled/published Post(s)
 *   - "There is no analytics/metrics domain" — never claim performance data from here
 *   - "One content item per post (maxItems: 1)"
 *
 * The API key is a production credential: it stays server-side and is never logged or returned.
 */

const BASE = 'https://api.woopsocial.com/v1'

/** Platforms the bridge accepts (SocialPlatform enum in their OpenAPI spec). */
export const BRIDGE_PLATFORMS = [
  'PINTEREST', 'LINKEDIN', 'LINKEDIN_PAGES', 'INSTAGRAM', 'FACEBOOK',
  'THREADS', 'TIKTOK', 'X', 'YOUTUBE',
] as const
export type BridgePlatform = (typeof BRIDGE_PLATFORMS)[number]

export type SocialAccount = {
  id: string
  externalAccountId: string
  platform: BridgePlatform
  username: string
  imageUrl: string
  status: string
}

export type Project = { id: string; name: string }

export type BridgeResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status?: number }

async function call<T>(
  apiKey: string,
  path: string,
  init?: { method?: string; body?: unknown; query?: Record<string, string> }
): Promise<BridgeResult<T>> {
  const url = new URL(BASE + path)
  for (const [k, v] of Object.entries(init?.query ?? {})) url.searchParams.set(k, v)

  try {
    const res = await fetch(url.toString(), {
      method: init?.method ?? 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: init?.body ? JSON.stringify(init.body) : undefined,
      signal: AbortSignal.timeout(30_000),
    })

    const text = await res.text()
    let parsed: unknown = null
    try {
      parsed = text ? JSON.parse(text) : null
    } catch {
      /* non-JSON error body */
    }

    if (!res.ok) {
      // never echo the key; surface the API's own message when there is one.
      // Their error bodies use `error_message` (not `error`/`message`).
      const body = parsed as
        | { message?: string; error?: string; error_message?: string }
        | null
      const msg =
        body?.error_message ?? body?.message ?? body?.error ?? `Bridge ${res.status}`
      return { ok: false, error: String(msg), status: res.status }
    }
    return { ok: true, data: parsed as T }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Bridge tidak terjangkau' }
  }
}

/** Step 0 — confirm the connection is alive before doing anything else. */
export async function health(apiKey: string): Promise<BridgeResult<unknown>> {
  // Their docs list Health as "Good first call to confirm the connection in Step 0".
  // Listing projects is the documented, guaranteed-present read that proves auth works.
  return call<unknown>(apiKey, '/projects')
}

export function listProjects(apiKey: string): Promise<BridgeResult<Project[]>> {
  return call<Project[]>(apiKey, '/projects')
}

export function listSocialAccounts(
  apiKey: string,
  projectId?: string
): Promise<BridgeResult<SocialAccount[]>> {
  return call<SocialAccount[]>(apiKey, '/social-accounts', {
    query: projectId ? { projectId } : undefined,
  })
}

/**
 * "Generate OAuth URL ... useful for multi-user integrations where your application lets your
 * own users, clients, or brands connect their social accounts to WoopSocial without giving them
 * access to your WoopSocial account."
 *
 * That is exactly our per-client model: one project per client, the client approves in their own
 * browser. We never ask the user to paste IDs (woopsocial.md).
 *
 * Path and casing verified against the live OpenAPI contract: POST /social-accounts/authorization-url,
 * platform as the uppercase SocialPlatform enum. `redirectUrl` is optional and must be omitted when
 * empty — the schema types it as a URI and rejects a blank string.
 */
export async function generateOAuthUrl(
  apiKey: string,
  projectId: string,
  platform: BridgePlatform,
  redirectUrl?: string
): Promise<BridgeResult<{ url: string }>> {
  const body: Record<string, unknown> = { projectId, platform }
  if (redirectUrl && redirectUrl.trim()) body.redirectUrl = redirectUrl.trim()
  return call<{ url: string }>(apiKey, '/social-accounts/authorization-url', {
    method: 'POST',
    body,
  })
}

/**
 * Validate a post without creating it — the repo requires this before committing.
 *
 * Verified against the live API: this genuinely creates nothing, and returns the bridge's own
 * verdict, e.g. `{ isValid: false, errors: [{ field: 'MEDIA', message: 'Instagram posts require
 * at least one media item' }] }`. That is the honest gate between "we have copy" and "we can post".
 */
export type ValidateResult = {
  isValid: boolean
  errors?: { path?: string; field?: string; message: string }[]
  warnings?: string[]
}

export async function validatePost(
  apiKey: string,
  body: unknown
): Promise<BridgeResult<ValidateResult>> {
  return call<ValidateResult>(apiKey, '/posts/validate', { method: 'POST', body })
}

/**
 * Create the post. Only ever called after explicit user confirmation (AGENTS.md ground truth 4).
 * "One content item per post (maxItems: 1)" — the caller passes one item.
 *
 * Shape (from their OpenAPI examples):
 *   { content: [{ text, media: [{ type, mediaId }] }],
 *     schedule: { type: PUBLISH_NOW | SCHEDULE_FOR_LATER | DRAFT, ... },
 *     socialAccounts: [{ platform, socialAccountId, postType }] }
 */
export async function createPost(
  apiKey: string,
  body: unknown
): Promise<BridgeResult<unknown>> {
  return call<unknown>(apiKey, '/posts', { method: 'POST', body })
}

export type MediaItem = {
  id: string
  type?: string
  url?: string
  mimeType?: string
}

/** The media library — Instagram requires at least one item, so Publish must be able to check it. */
export async function listMedia(
  apiKey: string,
  projectId?: string
): Promise<BridgeResult<MediaItem[]>> {
  const res = await call<
    MediaItem[] | { media?: MediaItem[]; items?: MediaItem[] }
  >(apiKey, '/media', { query: projectId ? { projectId } : undefined })
  if (!res.ok) return res
  const data = Array.isArray(res.data) ? res.data : (res.data?.media ?? res.data?.items ?? [])
  return { ok: true, data }
}

/**
 * The bridge's post list — what was scheduled, drafted or published.
 *
 * `GET /social-account-posts` returns the per-account delivery records, which is where the honest
 * status lives (`NOT_STARTED` until the platform accepts it, then `PUBLISHED` plus the real
 * `externalPostUrl`). Without this the skill could only say what it *had* created, never what
 * actually went out.
 */
export type SocialAccountPost = {
  socialAccountPostId?: string
  postId?: string
  platform?: string
  deliveryStatus?: string
  deliveryCompletedAt?: string
  externalPostId?: string
  externalPostUrl?: string
  createdAt?: string
  postType?: string
}

export async function listPosts(
  apiKey: string,
  projectId?: string
): Promise<BridgeResult<SocialAccountPost[]>> {
  const res = await call<
    SocialAccountPost[] | { socialAccountPosts?: SocialAccountPost[] }
  >(apiKey, '/social-account-posts', { query: projectId ? { projectId } : undefined })
  if (!res.ok) return res
  const data = Array.isArray(res.data)
    ? res.data
    : (res.data?.socialAccountPosts ?? [])
  return { ok: true, data }
}

/**
 * Disconnect a social account from the bridge.
 *
 * Their contract is explicit: this "removes the associated OAuth grant, including stored access and
 * refresh tokens, so the account no longer counts toward the organization's active
 * connected-account allowance." So it genuinely revokes access rather than just clearing a row —
 * which is why the UI confirms before calling it.
 */
export async function disconnectAccount(
  apiKey: string,
  socialAccountId: string
): Promise<BridgeResult<null>> {
  return call<null>(apiKey, `/social-accounts/${encodeURIComponent(socialAccountId)}`, {
    method: 'DELETE',
  })
}

/** Map the app's lowercase platform keys to the bridge's enum. */
export function toBridgePlatform(platform: string): BridgePlatform | null {
  const p = platform.trim().toUpperCase()
  if (p === 'TWITTER') return 'X'
  return (BRIDGE_PLATFORMS as readonly string[]).includes(p) ? (p as BridgePlatform) : null
}
