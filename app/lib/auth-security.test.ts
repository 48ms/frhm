import { describe, it, expect } from 'vitest'
import { safeRedirect } from '@/lib/safe-redirect'
import { checkRateLimit } from '@/lib/middleware/rate-limit'

describe('safeRedirect', () => {
  const FB = '/admin/dashboard'

  it('returns fallback for null/empty', () => {
    expect(safeRedirect(null, FB)).toBe(FB)
    expect(safeRedirect('', FB)).toBe(FB)
    expect(safeRedirect('   ', FB)).toBe(FB)
  })

  it('allows internal relative paths', () => {
    expect(safeRedirect('/client/dashboard', FB)).toBe('/client/dashboard')
    expect(safeRedirect('/admin/clients?sort=name', FB)).toBe('/admin/clients?sort=name')
    expect(safeRedirect('  /client  ', FB)).toBe('/client')
  })

  it('blocks external absolute URLs', () => {
    expect(safeRedirect('https://evil.com', FB)).toBe(FB)
    expect(safeRedirect('http://evil.com/x', FB)).toBe(FB)
  })

  it('blocks protocol-relative URLs', () => {
    expect(safeRedirect('//evil.com', FB)).toBe(FB)
    expect(safeRedirect('///evil.com', FB)).toBe(FB)
  })

  it('blocks dangerous schemes', () => {
    expect(safeRedirect('javascript:alert(1)', FB)).toBe(FB)
    expect(safeRedirect('data:text/html,<script>', FB)).toBe(FB)
    expect(safeRedirect('vbscript:msgbox(1)', FB)).toBe(FB)
    expect(safeRedirect('  javascript:alert(1)', FB)).toBe(FB)
  })
})

describe('checkRateLimit', () => {
  it('allows up to `limit` then blocks', () => {
    const route = 'test-' + Math.random()
    const LIMIT = 5
    for (let i = 1; i <= LIMIT; i++) {
      expect(checkRateLimit('9.9.9.9', route, LIMIT, 60_000).limited).toBe(false)
    }
    const blocked = checkRateLimit('9.9.9.9', route, LIMIT, 60_000)
    expect(blocked.limited).toBe(true)
    expect(blocked.retryAfter).toBeGreaterThan(0)
  })

  it('isolates counters per IP', () => {
    const route = 'test-' + Math.random()
    for (let i = 0; i < 5; i++) checkRateLimit('1.1.1.1', route, 5, 60_000)
    expect(checkRateLimit('1.1.1.1', route, 5, 60_000).limited).toBe(true)
    expect(checkRateLimit('2.2.2.2', route, 5, 60_000).limited).toBe(false)
  })
})
