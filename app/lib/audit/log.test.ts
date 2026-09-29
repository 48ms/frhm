import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock supabase-js BEFORE importing the module under test.
const insertMock = vi.fn().mockResolvedValue({ error: null })
const maybeSingleMock = vi.fn().mockResolvedValue({ data: null })
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ from: vi.fn((table) => {
    if (table === 'users') return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock }) }) }
    return { insert: insertMock }
  }) }),
}))

import { logAudit } from './log'

describe('logAudit', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    process.env = { ...OLD_ENV }
    insertMock.mockClear()
  })

  afterEach(() => {
    process.env = OLD_ENV
  })

  it('skips silently when SUPABASE env is missing (never throws)', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    await expect(logAudit({ action: 'test', summary: 'x' })).resolves.toBeUndefined()
    expect(insertMock).not.toHaveBeenCalled()
  })

  it('inserts an audit row when env is present', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'
    await logAudit({ action: 'delete.user', summary: 'User deleted' })
    expect(insertMock).toHaveBeenCalledTimes(1)
    const row = insertMock.mock.calls[0][0]
    expect(row.action).toBe('delete.user')
    expect(row.summary).toBe('User deleted')
  })

  it('forwards metadata and optional fields', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'
    await logAudit({
      action: 'update.budget',
      summary: 'Budget updated',
      clientId: 'client-123',
      entityId: 'budget-1',
      entityType: 'budget',
      metadata: { amount: 5000, currency: 'IDR' },
    })
    const row = insertMock.mock.calls[0][0]
    expect(row.client_id).toBe('client-123')
    expect(row.entity_id).toBe('budget-1')
    expect(row.metadata).toEqual({ amount: 5000, currency: 'IDR' })
  })

  it('does not throw when the insert fails (swallows errors)', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'
    insertMock.mockResolvedValueOnce({ error: { message: 'boom' } })
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await expect(logAudit({ action: 'x', summary: 'y' })).resolves.toBeUndefined()
    expect(errSpy).toHaveBeenCalled()
    errSpy.mockRestore()
  })

  it('extracts forensic ip/user-agent/request-id from the request headers', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'
    const req = new Request('http://localhost/api/x', {
      headers: {
        'x-forwarded-for': '203.0.113.7, 10.0.0.1',
        'user-agent': 'Mozilla/5.0 (Test)',
        'x-request-id': 'req-abc-123',
      },
    })
    await logAudit({ action: 'login', summary: 'User logged in', request: req })
    const row = insertMock.mock.calls[0][0]
    expect(row.ip_address).toBe('203.0.113.7') // first hop only
    expect(row.user_agent).toBe('Mozilla/5.0 (Test)')
    expect(row.request_id).toBe('req-abc-123')
  })

  it('lets explicit forensic values override the request headers', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'
    const req = new Request('http://localhost/api/x', {
      headers: { 'x-forwarded-for': '1.2.3.4' },
    })
    await logAudit({ action: 'x', summary: 'y', request: req, ipAddress: '9.9.9.9' })
    const row = insertMock.mock.calls[0][0]
    expect(row.ip_address).toBe('9.9.9.9')
  })

  it('leaves forensic fields null when no request is given', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'
    await logAudit({ action: 'x', summary: 'y' })
    const row = insertMock.mock.calls[0][0]
    expect(row.ip_address).toBeNull()
    expect(row.user_agent).toBeNull()
    expect(row.request_id).toBeNull()
  })
})