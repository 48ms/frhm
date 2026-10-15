import { createHmac, timingSafeEqual } from 'node:crypto'
import { env } from '@/lib/env'

/**
 * One-time Telegram account-linking token.
 *
 * The /start payload used to be `client_<uuid>` / `admin_<uuid>`: the raw
 * tenant id, which is visible in every `?clientId=` URL. Anyone who knew a
 * client's id could send `/start client_<id>` and bind their own Telegram chat
 * to that tenant, receiving all of its private notifications.
 *
 * Fix: the deep link now carries an HMAC-signed, short-lived token bound to
 * { type, id, exp }. The webhook verifies the signature before touching the
 * database, so a forged or stale payload is rejected. Stateless (no table).
 */

const TTL_MS = 30 * 60 * 1000 // 30 minutes

export type LinkTokenType = 'client' | 'admin'

export interface LinkTokenPayload {
  type: LinkTokenType
  id: string
  exp: number
}

function getSecret(): string | null {
  return (
    env.server.TELEGRAM_LINK_SECRET ||
    env.server.TELEGRAM_BOT_SECRET_TOKEN ||
    null
  )
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

export function createTelegramLinkToken(type: LinkTokenType, id: string): string | null {
  const secret = getSecret()
  if (!secret) return null
  const payload: LinkTokenPayload = { type, id, exp: Date.now() + TTL_MS }
  const body = b64url(Buffer.from(JSON.stringify(payload)))
  return `${body}.${sign(body, secret)}`
}

export function verifyTelegramLinkToken(token: string | null | undefined): LinkTokenPayload | null {
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

  let payload: LinkTokenPayload
  try {
    payload = JSON.parse(fromB64url(body).toString('utf8'))
  } catch {
    return null
  }

  if (!payload || typeof payload.exp !== 'number' || payload.exp < Date.now()) return null
  if (payload.type !== 'client' && payload.type !== 'admin') return null
  if (!payload.id) return null
  return payload
}
