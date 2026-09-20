import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const insertMock = vi.fn().mockResolvedValue({ error: null })
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ from: vi.fn(() => ({ insert: insertMock })) }),
}))

import { logAiUsage } from './usage'

describe('logAiUsage', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    process.env = { ...OLD_ENV }
    insertMock.mockClear()
  })

  afterEach(() => {
    process.env = OLD_ENV
  })

  it('skips silently without env (never throws)', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    await expect(
      logAiUsage({ userId: null, clientId: 'c1', route: 'r', model: 'm', providerKind: 'k', promptTokens: 1, completionTokens: 2 })
    ).resolves.toBeUndefined()
    expect(insertMock).not.toHaveBeenCalled()
  })

  it('inserts a row with token counts and null user_id for cron', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'sk'
    await logAiUsage({
      userId: null,
      clientId: 'c1',
      route: 'api/cron/daily-insight',
      model: 'gpt-4o-mini',
      providerKind: 'custom',
      promptTokens: 100,
      completionTokens: 50,
      latencyMs: 1234,
    })
    expect(insertMock).toHaveBeenCalledTimes(1)
    const row = insertMock.mock.calls[0][0]
    expect(row.user_id).toBeNull()
    expect(row.client_id).toBe('c1')
    expect(row.prompt_tokens).toBe(100)
    expect(row.completion_tokens).toBe(50)
    expect(row.latency_ms).toBe(1234)
    expect(row.success).toBe(true)
    expect(row.error_message).toBeNull()
  })

  it('marks failure + error_message when errorMessage is given', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'sk'
    await logAiUsage({
      userId: 'u1',
      route: 'api/admin/run',
      model: 'model',
      providerKind: 'openai',
      promptTokens: 0,
      completionTokens: 0,
      errorMessage: 'AI returned empty',
    })
    const row = insertMock.mock.calls[0][0]
    expect(row.success).toBe(false)
    expect(row.error_message).toBe('AI returned empty')
    expect(row.user_id).toBe('u1')
    expect(row.cost_estimate).toBe(0)
  })

  it('swallows insert errors (never throws)', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'sk'
    insertMock.mockResolvedValueOnce({ error: { message: 'boom' } })
    await expect(
      logAiUsage({ userId: null, route: 'r', model: 'm', providerKind: 'k', promptTokens: 1, completionTokens: 1 })
    ).resolves.toBeUndefined()
  })
})