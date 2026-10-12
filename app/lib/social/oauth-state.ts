import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto'

/**
 * CSRF/authorization state for the Ayrshare social-linking flow.
 *
 * The callback route previously trusted `clientId` straight from the query
 * string and wrote to `client_channels` with the service-role client (RLS
 * bypass). Any caller could therefore attach/replace a social channel for an
 * arbitrary tenant by hitting /api/social/callback?clientId=<victim>.
 *
 * Fix: the initiate route mints a short-lived HMAC-signed token bound to
 * { clientId, platform, userId, exp } and stores it in an httpOnly cookie
 * scoped to the callback path. The callback only trusts the signed payload —
 * never the raw query string — so a request without a valid token is rejected.
 *
 * Stateless: no DB table or server session store required.
 */

export const OAUTH_STATE_COOKIE = 'social_oauth_state'
const TTL_MS = 10 * 60 * 1000 // 10 minutes

export type OAuthStatePayload = {
  clientId: string
  platform: string
  userId: string
  exp: number
  nonce: string
}

function getSecret(): string | null {
  // Server-only secrets; never part of the client bundle.
  return process.env.OAUTH_STATE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || null
}

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromB64url(s: string): Buffer {
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
}

function sign(body: string, secret: string): string {
  return b64url(createHmac('sha256', secret).update(body).digest())
}

export function createOAuthState(input: {
  clientId: string
  platform: string
  userId: string
}): string | null {
  const secret = getSecret()
  if (!secret) return null
  const payload: OAuthStatePayload = {
    clientId: input.clientId,
    platform: input.platform,
    userId: input.userId,
    exp: Date.now() + TTL_MS,
    nonce: randomBytes(16).toString('hex'),
  }
  const body = b64url(Buffer.from(JSON.stringify(payload)))
  return `${body}.${sign(body, secret)}`
}

export function verifyOAuthState(token: string | null | undefined): OAuthStatePayload | null {
  if (!token) return null
  const secret = getSecret()
  if (!secret) return null

  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [body, sig] = parts

  const expected = sign(body, secret)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  let payload: OAuthStatePayload
  try {
    payload = JSON.parse(fromB64url(body).toString('utf8'))
  } catch {
    return null
  }

  if (!payload || typeof payload.exp !== 'number' || payload.exp < Date.now()) return null
  if (!payload.clientId || !payload.platform || !payload.userId) return null
  return payload
}

export const OAUTH_STATE_TTL_SECONDS = TTL_MS / 1000
