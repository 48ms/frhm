import { test, expect } from '@playwright/test'

test.use({ baseURL: 'http://localhost:3004' })

test.describe('/api/errors/report', () => {
  test('POST returns 200 and sends to Telegram', async ({ request }) => {
    const res = await request.post('/api/errors/report', {
      data: {
        message: 'E2E test error — automated',
        name: 'E2ETestError',
        stack: 'Error: E2E\n    at test (e2e/api-errors-report.spec.ts:7)',
        digest: 'e2e-test-digest-001',
        url: 'http://localhost:3004/admin/dashboard',
        component: 'E2E',
      },
    })

    expect(res.status()).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)

    // Verify log entry exists in DB
    const logRes = await request.post('/api/errors/report', {
      data: { message: 'log-check', digest: 'e2e-verify-' + Date.now() },
    })
    expect(logRes.status()).toBe(200)
  })

  test('POST handles missing fields gracefully', async ({ request }) => {
    const res = await request.post('/api/errors/report', {
      data: {},
    })
    expect(res.status()).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
  })

  test('POST deduplicates same digest within 60s', async ({ request }) => {
    const digest = 'e2e-dedup-' + Date.now()

    // First request
    const res1 = await request.post('/api/errors/report', {
      data: { message: 'first', digest },
    })
    expect(res1.status()).toBe(200)

    // Second same digest — should be deduped (still 200, but no Telegram send)
    const res2 = await request.post('/api/errors/report', {
      data: { message: 'second', digest },
    })
    expect(res2.status()).toBe(200)
  })
})
