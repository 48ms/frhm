import { describe, it, expect } from 'vitest'
import {
  verifyWhatsAppWebhookGet,
  verifyWhatsAppWebhookPost,
} from './verify-webhook'

describe('verifyWhatsAppWebhookGet', () => {
  it('returns not_configured when configured token is undefined or empty', () => {
    const res = verifyWhatsAppWebhookGet(undefined, 'subscribe', 'token123', 'chal456')
    expect(res.ok).toBe(false)
    expect(res.reason).toBe('not_configured')
  })

  it('rejects when mode is not subscribe', () => {
    const res = verifyWhatsAppWebhookGet('secret-token', 'unsubscribe', 'secret-token', 'chal456')
    expect(res.ok).toBe(false)
    expect(res.reason).toBe('invalid_mode')
  })

  it('rejects when token mismatches', () => {
    const res = verifyWhatsAppWebhookGet('secret-token', 'subscribe', 'wrong-token', 'chal456')
    expect(res.ok).toBe(false)
    expect(res.reason).toBe('token_mismatch')
  })

  it('rejects when challenge is missing', () => {
    const res = verifyWhatsAppWebhookGet('secret-token', 'subscribe', 'secret-token', null)
    expect(res.ok).toBe(false)
    expect(res.reason).toBe('missing_challenge')
  })

  it('accepts valid handshake and returns challenge', () => {
    const res = verifyWhatsAppWebhookGet('secret-token', 'subscribe', 'secret-token', '11223344')
    expect(res.ok).toBe(true)
    expect(res.challenge).toBe('11223344')
  })
})

describe('verifyWhatsAppWebhookPost', () => {
  it('validates matching secret header when configured', () => {
    const res = verifyWhatsAppWebhookPost('my-post-secret', 'my-post-secret')
    expect(res.ok).toBe(true)
  })

  it('rejects when header is missing', () => {
    const res = verifyWhatsAppWebhookPost('my-post-secret', null)
    expect(res.ok).toBe(false)
    expect(res.reason).toBe('missing_secret_header')
  })

  it('rejects when header mismatches', () => {
    const res = verifyWhatsAppWebhookPost('my-post-secret', 'wrong-secret')
    expect(res.ok).toBe(false)
    expect(res.reason).toBe('secret_mismatch')
  })
})
