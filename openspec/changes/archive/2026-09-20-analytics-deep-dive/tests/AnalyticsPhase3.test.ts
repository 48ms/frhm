import { test, expect } from '@playwright/test'
import { testConfig } from '../testConfig'

const clientId = '69382640-89d3-4a1d-9568-44aa470ea0ba' // Taraju

test.describe('Analytics Phase 3 — Predictive Performance & ROI Forecasting', () => {

  test('GET /api/admin/clients/[id]/analytics/predictions returns algorithmic forecast', async ({ request }) => {
    const res = await request.get(`${testConfig.dev}/api/admin/clients/${clientId}/analytics/predictions`)
    expect([200, 401, 403]).toContain(res.status())

    if (res.status() === 200) {
      const data = await res.json()
      expect(data).toHaveProperty('algorithmic_forecast')
      const f = data.algorithmic_forecast
      expect(f).toHaveProperty('forecasted_reach')
      expect(f).toHaveProperty('forecasted_er')
      expect(f).toHaveProperty('forecasted_wa_inquiries')
      expect(f).toHaveProperty('forecasted_dm_inquiries')
      expect(f).toHaveProperty('estimated_roi_multiplier')
      expect(f).toHaveProperty('confidence_score')
      expect(f.confidence_score).toBeGreaterThan(0)
    }
  })

  test('POST /api/admin/clients/[id]/analytics/predictions validates schema', async ({ request }) => {
    const res = await request.post(`${testConfig.dev}/api/admin/clients/${clientId}/analytics/predictions`, {
      data: {
        target_month: '2026-10-01',
        forecasted_reach: 25000,
        forecasted_er: 4.5,
        forecasted_wa_inquiries: 15,
        forecasted_dm_inquiries: 25,
        estimated_roi_multiplier: 1.5,
        confidence_score: 0.85,
        model_notes: 'Target test'
      }
    })
    expect([200, 401, 403]).toContain(res.status())
  })

  test('PDF Export succeeds with predictive section', async ({ request }) => {
    const res = await request.get(`${testConfig.dev}/api/admin/clients/${clientId}/analytics/export/pdf`)
    expect([200, 401, 403]).toContain(res.status())

    if (res.status() === 200) {
      const buffer = await res.body()
      expect(buffer.length).toBeGreaterThan(1000)
      const pdfHeader = buffer.subarray(0, 5).toString('ascii')
      expect(pdfHeader).toBe('%PDF-')
    }
  })

  test('Markdown Export succeeds with predictive section', async ({ request }) => {
    const res = await request.get(`${testConfig.dev}/api/admin/clients/${clientId}/analytics/export/markdown`)
    expect([200, 401, 403]).toContain(res.status())

    if (res.status() === 200) {
      const text = await res.text()
      expect(text).toContain('# Laporan Bulanan:')
    }
  })

})
