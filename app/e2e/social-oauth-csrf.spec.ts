import { test, expect } from '@playwright/test'

/**
 * The Ayrshare OAuth callback used to trust ?clientId= straight from the query
 * string and write to client_channels with the service-role client. These tests
 * assert the callback now refuses any request that lacks the signed state token
 * minted by /api/social/oauth-url.
 */
test.describe('Social OAuth callback CSRF guard', () => {
  test('rejects a callback with no state token', async ({ request }) => {
    const res = await request.get(
      '/api/social/callback?clientId=00000000-0000-0000-0000-000000000000&platform=twitter',
      { maxRedirects: 0 },
    )
    // Should redirect (3xx) to the error page, never perform the write.
    expect(res.status()).toBeGreaterThanOrEqual(300)
    expect(res.status()).toBeLessThan(400)
    expect(res.headers()['location'] ?? '').toContain('error=invalid_oauth_state')
  })

  test('rejects a callback with a forged state token', async ({ request }) => {
    const res = await request.get(
      '/api/social/callback?clientId=00000000-0000-0000-0000-000000000000&platform=twitter&state=forged.token',
      { maxRedirects: 0 },
    )
    expect(res.status()).toBeGreaterThanOrEqual(300)
    expect(res.status()).toBeLessThan(400)
    expect(res.headers()['location'] ?? '').toContain('error=invalid_oauth_state')
  })
})
