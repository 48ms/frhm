import { describe, it, expect } from 'vitest'
import { checkRateLimit } from './rate-limit'

describe('checkRateLimit', () => {
  it('allows requests under the limit', () => {
    const r = checkRateLimit('1.2.3.4', '/api/test', 3, 60_000)
    expect(r.limited).toBe(false)
    expect(r.remaining).toBe(2)
  })

  it('blocks requests over the limit', () => {
    checkRateLimit('1.2.3.4', '/api/test', 2, 60_000)
    checkRateLimit('1.2.3.4', '/api/test', 2, 60_000)
    const r = checkRateLimit('1.2.3.4', '/api/test', 2, 60_000)
    expect(r.limited).toBe(true)
    expect(r.retryAfter).toBeGreaterThan(0)
  })

  it('different IPs have separate buckets', () => {
    checkRateLimit('1.1.1.1', '/api/test', 1, 60_000)
    const r = checkRateLimit('2.2.2.2', '/api/test', 1, 60_000)
    expect(r.limited).toBe(false)
  })

  it('different routes have separate buckets', () => {
    checkRateLimit('1.1.1.1', '/api/a', 1, 60_000)
    const r = checkRateLimit('1.1.1.1', '/api/b', 1, 60_000)
    expect(r.limited).toBe(false)
  })
})
