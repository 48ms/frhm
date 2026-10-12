import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createHmac } from 'node:crypto'
import {
  createTelegramLinkToken,
  verifyTelegramLinkToken,
} from './link-token'

const SECRET = 'test-secret-token-abc123'

describe('telegram link-token', () => {
  beforeEach(() => {
    process.env.TELEGRAM_BOT_SECRET_TOKEN = SECRET
    delete process.env.TELEGRAM_LINK_SECRET
  })

  afterEach(() => {
    delete process.env.TELEGRAM_BOT_SECRET_TOKEN
    delete process.env.TELEGRAM_LINK_SECRET
  })

  it('creates a token that verifies back to the same payload', () => {
    const token = createTelegramLinkToken('client', 'client-123')
    expect(token).toBeTruthy()
    const payload = verifyTelegramLinkToken(token)
    expect(payload).toEqual(
      expect.objectContaining({ type: 'client', id: 'client-123' }),
    )
  })

  it('rejects the legacy raw `client_<uuid>` payload (hijack vector)', () => {
    expect(verifyTelegramLinkToken('client_11111111-2222-3333-4444-555555555555')).toBeNull()
    expect(verifyTelegramLinkToken('admin_99999999-8888-7777-6666-555555555555')).toBeNull()
  })

  it('rejects a tampered payload (signature mismatch)', () => {
    const token = createTelegramLinkToken('client', 'client-123')!
    const [body, sig] = token.split('.')
    // Forge a different id while keeping the original signature.
    const forgedBody = Buffer.from(
      JSON.stringify({ type: 'client', id: 'victim-client', exp: Date.now() + 60_000 }),
    )
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    expect(verifyTelegramLinkToken(`${forgedBody}.${sig}`)).toBeNull()
    expect(verifyTelegramLinkToken(`${body}.deadbeef`)).toBeNull()
  })

  it('rejects an expired token', () => {
    const expired = Buffer.from(
      JSON.stringify({ type: 'admin', id: 'admin-1', exp: Date.now() - 1000 }),
    )
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    // Need a valid signature for the expired body to isolate the expiry check.
    const sig = createHmac('sha256', SECRET)
      .update(expired)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    expect(verifyTelegramLinkToken(`${expired}.${sig}`)).toBeNull()
  })

  it('returns null when no secret is configured (fail-closed)', () => {
    delete process.env.TELEGRAM_BOT_SECRET_TOKEN
    delete process.env.TELEGRAM_LINK_SECRET
    expect(createTelegramLinkToken('client', 'client-123')).toBeNull()
    expect(verifyTelegramLinkToken('anything')).toBeNull()
  })

  it('handles empty / malformed input safely', () => {
    expect(verifyTelegramLinkToken(null)).toBeNull()
    expect(verifyTelegramLinkToken(undefined)).toBeNull()
    expect(verifyTelegramLinkToken('')).toBeNull()
    expect(verifyTelegramLinkToken('not-a-token')).toBeNull()
    expect(verifyTelegramLinkToken('a.b.c')).toBeNull()
  })
})
