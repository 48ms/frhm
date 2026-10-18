import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getRequestOrigin } from './request-origin'

describe('getRequestOrigin', () => {
  const originalEnv = process.env.NEXT_PUBLIC_APP_URL

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_APP_URL
  })

  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = originalEnv
  })

  it('extracts origin from x-forwarded-host and default https proto', () => {
    const req = new Request('http://127.0.0.1:3000/auth/signout', {
      headers: {
        'x-forwarded-host': 'frhm.web.id',
      },
    })
    expect(getRequestOrigin(req)).toBe('https://frhm.web.id')
  })

  it('respects x-forwarded-proto when provided', () => {
    const req = new Request('http://127.0.0.1:3000/auth/signout', {
      headers: {
        'x-forwarded-host': 'frhm.web.id',
        'x-forwarded-proto': 'http',
      },
    })
    expect(getRequestOrigin(req)).toBe('http://frhm.web.id')
  })

  it('falls back to NEXT_PUBLIC_APP_URL if proxy forwarded host is localhost', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://frhm.web.id'
    const req = new Request('http://localhost:3000/auth/signout', {
      headers: {
        host: 'localhost:3000',
      },
    })
    expect(getRequestOrigin(req)).toBe('https://frhm.web.id')
  })

  it('falls back to request.url origin in local dev environment without production app url', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
    const req = new Request('http://localhost:3000/auth/signout')
    expect(getRequestOrigin(req)).toBe('http://localhost:3000')
  })
})
