import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getContentProductions,
  createContentProduction,
  updateContentProduction,
  deleteContentProduction,
} from './service'
import type { CreateContentProductionInput } from './types'

const mockQueryBuilder = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  single: vi.fn(),
}

const mockSupabase = { from: vi.fn(() => mockQueryBuilder) }

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn(() => mockSupabase) }))
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }))
vi.mock('@/lib/audit/log', () => ({ logAudit: vi.fn() }))

describe('Content Production Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQueryBuilder.select.mockReturnThis()
    mockQueryBuilder.eq.mockReturnThis()
    mockQueryBuilder.order.mockReturnThis()
    mockQueryBuilder.insert.mockReturnThis()
    mockQueryBuilder.update.mockReturnThis()
    mockQueryBuilder.delete.mockReturnThis()
  })

  describe('getContentProductions', () => {
    it('returns empty array if clientId is missing', async () => {
      expect(await getContentProductions('')).toEqual([])
    })

    it('returns rows ordered by due_date ascending', async () => {
      const rows = [{ id: '1', title: 'Reel' }]
      mockQueryBuilder.order.mockResolvedValue({ data: rows, error: null })

      expect(await getContentProductions('c1')).toEqual(rows)
      expect(mockSupabase.from).toHaveBeenCalledWith('content_productions')
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('due_date', { ascending: true })
    })

    it('degrades to [] and logs on db error', async () => {
      const { logger } = await import('@/lib/logger')
      mockQueryBuilder.order.mockResolvedValue({ data: null, error: { message: 'boom' } })

      expect(await getContentProductions('c1')).toEqual([])
      expect(logger.error).toHaveBeenCalled()
    })
  })

  describe('createContentProduction', () => {
    it('inserts and returns the created row', async () => {
      const input: CreateContentProductionInput = {
        client_id: 'c1',
        title: 'Reel',
        platform: 'Instagram',
        stage: 'idea',
        priority: 'normal',
        assignee: null,
        due_date: null,
        assets: [],
        notes: null,
      }
      mockQueryBuilder.single.mockResolvedValue({ data: { id: 'new', ...input }, error: null })

      const result = await createContentProduction(input)
      expect(result.id).toBe('new')
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(input)
    })

    it('throws on db error (fail-closed)', async () => {
      const input: CreateContentProductionInput = {
        client_id: 'c1',
        title: 'Reel',
        platform: 'Instagram',
        stage: 'idea',
        priority: 'normal',
        assignee: null,
        due_date: null,
        assets: [],
        notes: null,
      }
      mockQueryBuilder.single.mockResolvedValue({ data: null, error: { message: 'constraint' } })
      await expect(createContentProduction(input)).rejects.toThrow('constraint')
    })
  })

  describe('updateContentProduction', () => {
    it('updates the row by id', async () => {
      mockQueryBuilder.single.mockResolvedValue({ data: { id: 'x', title: 'Updated' }, error: null })
      const result = await updateContentProduction('x', { title: 'Updated' })
      expect(result.title).toBe('Updated')
      expect(mockQueryBuilder.update).toHaveBeenCalledWith({ title: 'Updated' })
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'x')
    })
  })

  describe('deleteContentProduction', () => {
    it('deletes by id', async () => {
      mockQueryBuilder.eq.mockResolvedValue({ error: null })
      await deleteContentProduction('id-1')
      expect(mockQueryBuilder.delete).toHaveBeenCalled()
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'id-1')
    })

    it('throws on db error', async () => {
      mockQueryBuilder.eq.mockResolvedValue({ error: { message: 'fk violation' } })
      await expect(deleteContentProduction('id-1')).rejects.toThrow('fk violation')
    })
  })
})
