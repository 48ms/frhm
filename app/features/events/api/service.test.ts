import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getEvents, createEvent, updateEvent, deleteEvent } from './service'

const mockQueryBuilder = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  single: vi.fn(),
}

const mockSupabase = {
  from: vi.fn(() => mockQueryBuilder),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabase),
}))

vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn() }
}))

vi.mock('@/lib/audit/log', () => ({
  logAudit: vi.fn(),
}))

describe('Events Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQueryBuilder.select.mockReturnThis()
    mockQueryBuilder.eq.mockReturnThis()
    mockQueryBuilder.order.mockReturnThis()
    mockQueryBuilder.insert.mockReturnThis()
    mockQueryBuilder.update.mockReturnThis()
    mockQueryBuilder.delete.mockReturnThis()
  })

  it('getEvents returns empty array if clientId is missing', async () => {
    const result = await getEvents('')
    expect(result).toEqual([])
  })

  it('getEvents returns data ordered by event_date ascending', async () => {
    const mockData = [{ id: '1', name: 'Launch' }]
    mockQueryBuilder.order.mockResolvedValue({ data: mockData, error: null })

    const result = await getEvents('client-1')

    expect(result).toEqual(mockData)
    expect(mockSupabase.from).toHaveBeenCalledWith('events')
    expect(mockQueryBuilder.order).toHaveBeenCalledWith('event_date', { ascending: true })
  })

  it('getEvents returns empty array on error and logs it', async () => {
    const { logger } = await import('@/lib/logger')
    mockQueryBuilder.order.mockResolvedValue({ data: null, error: new Error('db error') })

    const result = await getEvents('client-1')

    expect(result).toEqual([])
    expect(logger.error).toHaveBeenCalled()
  })

  it('createEvent inserts and returns success with data', async () => {
    const inserted = { id: 'ev-1', client_id: 'c1', name: 'Grand Opening', status: 'upcoming' }
    mockQueryBuilder.single.mockResolvedValue({ data: inserted, error: null })

    const res = await createEvent({ client_id: 'c1', name: 'Grand Opening' })

    expect(res.success).toBe(true)
    expect(res.data).toEqual(inserted)
    expect(mockQueryBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Grand Opening', status: 'upcoming' })
    )
  })

  it('createEvent returns failure with error message when insert fails', async () => {
    mockQueryBuilder.single.mockResolvedValue({ data: null, error: { message: 'RLS denied' } })

    const res = await createEvent({ client_id: 'c1', name: 'X' })

    expect(res.success).toBe(false)
    expect(res.error).toBe('RLS denied')
  })

  it('updateEvent updates and returns success with data', async () => {
    const updated = { id: 'ev-1', client_id: 'c1', name: 'Updated Grand Opening', status: 'ongoing' }
    mockQueryBuilder.single.mockResolvedValue({ data: updated, error: null })

    const res = await updateEvent({ id: 'ev-1', name: 'Updated Grand Opening', status: 'ongoing' })

    expect(res.success).toBe(true)
    expect(res.data).toEqual(updated)
    expect(mockQueryBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Updated Grand Opening', status: 'ongoing' })
    )
    expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'ev-1')
  })

  it('updateEvent returns error when update fails', async () => {
    mockQueryBuilder.single.mockResolvedValue({ data: null, error: { message: 'Update failed' } })

    const res = await updateEvent({ id: 'ev-1', name: 'Broken' })

    expect(res.success).toBe(false)
    expect(res.error).toBe('Update failed')
  })

  it('deleteEvent deletes row and returns success', async () => {
    mockQueryBuilder.eq.mockResolvedValue({ error: null })

    const res = await deleteEvent('ev-1')

    expect(res.success).toBe(true)
    expect(mockSupabase.from).toHaveBeenCalledWith('events')
    expect(mockQueryBuilder.delete).toHaveBeenCalled()
    expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'ev-1')
  })

  it('deleteEvent returns error when delete fails', async () => {
    mockQueryBuilder.eq.mockResolvedValue({ error: { message: 'Delete failed' } })

    const res = await deleteEvent('ev-1')

    expect(res.success).toBe(false)
    expect(res.error).toBe('Delete failed')
  })
})
