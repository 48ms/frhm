import { describe, it, expect } from 'vitest'
import { verifyTelegramWebhookSecret } from './verify-webhook'

describe('verifyTelegramWebhookSecret', () => {
  it('accepts a matching secret', () => {
    expect(verifyTelegramWebhookSecret('s3cr3t', 's3cr3t')).toEqual({ ok: true })
  })

  it('rejects when no secret is configured (fail-closed)', () => {
    const r = verifyTelegramWebhookSecret(undefined, 'anything')
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('not_configured')
  })

  it('rejects an empty-string configured secret (fail-closed)', () => {
    const r = verifyTelegramWebhookSecret('', 'anything')
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('not_configured')
  })

  it('rejects a missing header', () => {
    const r = verifyTelegramWebhookSecret('s3cr3t', null)
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('missing_header')
  })

  it('rejects a mismatched secret', () => {
    const r = verifyTelegramWebhookSecret('s3cr3t', 'wrong')
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('mismatch')
  })
})
