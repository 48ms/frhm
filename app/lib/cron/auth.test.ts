import { describe, it, expect } from 'vitest'
import { verifyCronSecret } from './auth'

describe('verifyCronSecret', () => {
  it('accepts a matching bearer token', () => {
    expect(verifyCronSecret('s3cr3t', 'Bearer s3cr3t')).toEqual({ ok: true })
  })

  it('rejects when no secret is configured (fail-closed)', () => {
    const r = verifyCronSecret(undefined, 'Bearer test_cron_secret')
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('not_configured')
  })

  it('rejects an empty-string secret (fail-closed)', () => {
    const r = verifyCronSecret('', 'Bearer anything')
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('not_configured')
  })

  it('rejects a missing header', () => {
    const r = verifyCronSecret('s3cr3t', null)
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('missing_header')
  })

  it('rejects a mismatched token', () => {
    const r = verifyCronSecret('s3cr3t', 'Bearer wrong')
    expect(r.ok).toBe(false)
    expect(r.reason).toBe('mismatch')
  })

  it('rejects the guessable default literal when secret is unset', () => {
    const r = verifyCronSecret(undefined, 'Bearer test_cron_secret')
    expect(r.ok).toBe(false)
  })
})
