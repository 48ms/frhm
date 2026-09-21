import { test, expect } from '@playwright/test'
import { execSync } from 'child_process'

test.use({ baseURL: 'http://localhost:3004' })

function dbq(path: string): string {
  return execSync(`python3 scripts/dbq.py "${path}"`, {
    cwd: process.cwd(), encoding: 'utf-8', timeout: 30000,
  }).trim()
}

test.describe('/api/errors/report', () => {
  test('POST returns 200 and writes audit_log system.error', async ({ request }) => {
    const digest = 'e2e-audit-' + Date.now()

    const res = await request.post('/api/errors/report', {
      data: {
        message: 'E2E audit trail test',
        name: 'E2ETestError',
        stack: 'Error: E2E\n    at test (e2e/api-errors-report.spec.ts:15)',
        digest,
        url: 'http://localhost:3004/admin/dashboard',
        component: 'E2E',
      },
    })

    expect(res.status()).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)

    // CRITICAL: verify audit_log got the row (forensic trail)
    await new Promise((r) => setTimeout(r, 1500))
    const audit = dbq(`audit_log?action=eq.system.error&metadata->>digest=eq.${digest}&select=id,action,summary`)
    console.log('AUDIT ROW:', audit)
    expect(audit, 'audit_log has system.error row').toContain('system.error')
    expect(audit, 'audit summary contains component').toContain('E2E')
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

    const res1 = await request.post('/api/errors/report', {
      data: { message: 'first', digest },
    })
    expect(res1.status()).toBe(200)

    const res2 = await request.post('/api/errors/report', {
      data: { message: 'second', digest },
    })
    expect(res2.status()).toBe(200)

    // Only ONE audit row should exist for this digest
    await new Promise((r) => setTimeout(r, 1500))
    const audit = dbq(`audit_log?action=eq.system.error&metadata->>digest=eq.${digest}&select=id`)
    // Count occurrences of 'id' in the JSON array — should be exactly 1
    const count = (audit.match(/'id'/g) || []).length
    console.log('DEDUP audit rows:', count, audit)
    expect(count, 'exactly 1 audit row for deduped digest').toBe(1)
  })
})
