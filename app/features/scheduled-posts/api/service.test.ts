import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createScheduledPost, deleteScheduledPost } from './service'
import { CreateScheduledPostSchema, type CreateScheduledPostInput } from './types'

// ---------------------------------------------------------------------------
// Mock Supabase client — mirrors the chain API the service actually calls.
// ---------------------------------------------------------------------------

const insertedRows: Array<Record<string, unknown>> = []
const deleteFilters: Array<{ column: string; value: unknown }> = []

function mockSupabase() {
  return {
    select: () => mockSupabase(),
    eq: (column: string, value: unknown) => {
      deleteFilters.push({ column, value })
      return mockSupabase()
    },
    delete: () => mockSupabase(),
    insert: (rows: unknown[]) => {
      rows.forEach((row) => insertedRows.push(row as Record<string, unknown>))
      return mockSupabase()
    },
    order: () => mockSupabase(),
    single: async () => ({
      data: { id: 'post-mocked', client_id: 'client-1111', created_at: new Date().toISOString() },
      error: null,
    }),
    then: (resolve: (v: { error: null }) => void) => resolve({ error: null }),
  }
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    from: () => mockSupabase(),
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  insertedRows.length = 0
  deleteFilters.length = 0
})

function validPayload(): CreateScheduledPostInput {
  const { client_id, title, content, platform, scheduled_at, status } =
    CreateScheduledPostSchema.parse({
      client_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      title: 'Campaign Natal',
      content: 'Caption promo akhir tahun',
      platform: 'instagram',
      scheduled_at: new Date(Date.now() + 3600_000).toISOString(),
      status: 'scheduled',
    })
  return { client_id, title, content, platform, scheduled_at, status }
}

describe('createScheduledPost', () => {
  it('accepts a valid payload and inserts a row', async () => {
    const result = await createScheduledPost(validPayload())

    expect(result).toBeDefined()
    expect(result.id).toBe('post-mocked')
    expect(insertedRows.length).toBe(1)
    expect(insertedRows[0]).toMatchObject({
      client_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      title: 'Campaign Natal',
      platform: 'instagram',
      status: 'scheduled',
    })
  })

  // --- Zod validation gates (fail-closed) ---

  it('rejects missing client_id (UUID required)', async () => {
    const payload = { ...validPayload(), client_id: '' as any }
    await expect(createScheduledPost(payload)).rejects.toThrow(/client_id/i)
  })

  it('rejects missing title', async () => {
    const payload = { ...validPayload(), title: undefined as any }
    await expect(createScheduledPost(payload)).rejects.toThrow(/title/i)
  })

  it('rejects missing content', async () => {
    const payload = { ...validPayload(), content: undefined as any }
    await expect(createScheduledPost(payload)).rejects.toThrow(/content/i)
  })

  it('rejects missing platform', async () => {
    const payload = { ...validPayload(), platform: undefined as any }
    await expect(createScheduledPost(payload)).rejects.toThrow(/platform/i)
  })

  it('rejects missing scheduled_at', async () => {
    const payload = { ...validPayload(), scheduled_at: undefined as any }
    await expect(createScheduledPost(payload)).rejects.toThrow(/scheduled_at/i)
  })

  it('rejects missing status', async () => {
    const payload = { ...validPayload(), status: undefined as any }
    await expect(createScheduledPost(payload)).rejects.toThrow(/status/i)
  })

  it('rejects invalid status value (not in enum)', async () => {
    const payload = { ...validPayload(), status: 'in-progress' as any }
    await expect(createScheduledPost(payload)).rejects.toThrow(/status|invalid_enum/i)
  })

  it('allows optional fields (media_url, author) when provided', async () => {
    const payload = { ...validPayload(), media_url: 'https://example.com/img.jpg', author: 'Budi' }
    const result = await createScheduledPost(payload)
    expect(result).toBeDefined()
    expect(insertedRows[0]).toMatchObject({ media_url: 'https://example.com/img.jpg', author: 'Budi' })
  })
})

describe('deleteScheduledPost', () => {
  it('scopes the delete by client_id when provided (defense-in-depth vs IDOR)', async () => {
    await deleteScheduledPost('post-123', 'client-abc')

    const columns = deleteFilters.map((f) => f.column)
    expect(columns).toContain('id')
    expect(columns).toContain('client_id')
    expect(deleteFilters).toContainEqual({ column: 'id', value: 'post-123' })
    expect(deleteFilters).toContainEqual({ column: 'client_id', value: 'client-abc' })
  })

  it('still deletes by id alone when no client_id is supplied', async () => {
    await deleteScheduledPost('post-123')

    const columns = deleteFilters.map((f) => f.column)
    expect(columns).toContain('id')
    expect(columns).not.toContain('client_id')
  })
})
