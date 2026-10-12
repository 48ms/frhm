import { describe, it, expect, vi } from 'vitest'
import { createOAuthState, verifyOAuthState } from './oauth-state'

describe('OAuth State', () => {
  it('signs and verifies a valid payload', () => {
    vi.stubEnv('OAUTH_STATE_SECRET', 'test-secret')
    const token = createOAuthState({ clientId: 'c1', platform: 'twitter', userId: 'u1' })
    expect(token).toBeTruthy()

    const payload = verifyOAuthState(token)
    expect(payload).toEqual(expect.objectContaining({
      clientId: 'c1',
      platform: 'twitter',
      userId: 'u1'
    }))
  })

  it('rejects tampered payload', () => {
    vi.stubEnv('OAUTH_STATE_SECRET', 'test-secret')
    const token = createOAuthState({ clientId: 'c1', platform: 'twitter', userId: 'u1' })
    // Tamper the payload: split, modify body, re-sign with same secret
    const [body, sig] = token!.split('.')
    const decoded = JSON.parse(Buffer.from(body.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString())
    decoded.clientId = 'c2'
    const tamperedBody = Buffer.from(JSON.stringify(decoded)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    const tamperedToken = `${tamperedBody}.${sig}`
    expect(verifyOAuthState(tamperedToken)).toBeNull()
  })
})
