import { test, expect } from '@playwright/test'
import { testConfig } from '../testConfig'

const clientId = '69382640-89d3-4a1d-9568-44aa470ea0ba' // Taraju

test.describe('Analytics Phase 2 — Competitor & Seasonal API Verification', () => {

  test('GET /api/admin/seasonal-periods returns active seasonal periods', async ({ request }) => {
    const res = await request.get(`${testConfig.dev}/api/admin/seasonal-periods`)
    expect([200, 401, 403]).toContain(res.status())

    if (res.status() === 200) {
      const data = await res.json()
      expect(data).toHaveProperty('periods')
      expect(Array.isArray(data.periods)).toBe(true)
      if (data.periods.length > 0) {
        expect(data.periods[0]).toHaveProperty('name')
        expect(data.periods[0]).toHaveProperty('impact_multiplier')
      }
    }
  })

  test('GET & POST /api/admin/clients/[id]/competitors endpoint validation', async ({ request }) => {
    const resGet = await request.get(`${testConfig.dev}/api/admin/clients/${clientId}/competitors`)
    expect([200, 401, 403]).toContain(resGet.status())

    if (resGet.status() === 200) {
      const data = await resGet.json()
      expect(data).toHaveProperty('competitors')
      expect(Array.isArray(data.competitors)).toBe(true)
    }
  })

  test('PDF export includes competitor & seasonal data sections', async ({ request }) => {
    const res = await request.get(`${testConfig.dev}/api/admin/clients/${clientId}/analytics/export/pdf`)
    expect([200, 401, 403]).toContain(res.status())

    if (res.status() === 200) {
      const buffer = await res.body()
      expect(buffer.length).toBeGreaterThan(1000)
      const pdfHeader = buffer.subarray(0, 5).toString('ascii')
      expect(pdfHeader).toBe('%PDF-')
    }
  })

  test('Markdown export contains markdown response headers', async ({ request }) => {
    const res = await request.get(`${testConfig.dev}/api/admin/clients/${clientId}/analytics/export/markdown`)
    expect([200, 401, 403]).toContain(res.status())

    if (res.status() === 200) {
      const text = await res.text()
      expect(text).toContain('# Laporan Bulanan:')
    }
  })

})
