import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Mirror of the bodySchema declared in app/api/trends/generate/route.ts.
// Re-declared here so the test asserts the contract without importing the
// route (which pulls in next/headers + supabase at module scope).
const bodySchema = z.object({
  clientId: z.string().min(1, 'clientId wajib diisi'),
  trendTopic: z.string().min(1, 'trendTopic wajib diisi'),
  trendSnippet: z.string().optional(),
  providerId: z.string().uuid().optional(),
  campaignTag: z.string().optional(),
})

describe('POST /api/trends/generate body schema', () => {
  it('accepts a valid payload with required fields only', () => {
    const r = bodySchema.safeParse({
      clientId: '5044af9e-0af1-4ec6-83ba-dacba4cfebf2',
      trendTopic: 'Kopi single-origin viral',
    })
    expect(r.success).toBe(true)
  })

  it('accepts optional fields when provided with correct types', () => {
    const r = bodySchema.safeParse({
      clientId: '5044af9e-0af1-4ec6-83ba-dacba4cfebf2',
      trendTopic: 'Kopi single-origin viral',
      trendSnippet: 'Snippet teks tren',
      providerId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      campaignTag: 'q4-2026',
    })
    expect(r.success).toBe(true)
  })

  it('rejects missing clientId', () => {
    const r = bodySchema.safeParse({ trendTopic: 'topik' })
    expect(r.success).toBe(false)
  })

  it('rejects missing trendTopic', () => {
    const r = bodySchema.safeParse({
      clientId: '5044af9e-0af1-4ec6-83ba-dacba4cfebf2',
    })
    expect(r.success).toBe(false)
  })

  it('rejects trendSnippet that is not a string', () => {
    const r = bodySchema.safeParse({
      clientId: '5044af9e-0af1-4ec6-83ba-dacba4cfebf2',
      trendTopic: 'topik',
      trendSnippet: 12345,
    })
    expect(r.success).toBe(false)
  })

  it('rejects providerId that is not a valid UUID', () => {
    const r = bodySchema.safeParse({
      clientId: '5044af9e-0af1-4ec6-83ba-dacba4cfebf2',
      trendTopic: 'topik',
      providerId: 'not-a-uuid',
    })
    expect(r.success).toBe(false)
  })

  it('treats an empty object as invalid (both required fields missing)', () => {
    const r = bodySchema.safeParse({})
    expect(r.success).toBe(false)
  })
})
