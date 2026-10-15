import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getNotificationTargetForDeliverable,
  dispatchReviewNotification,
  testNotificationDispatch,
} from './service'

const mockSendTelegramMessage = vi.fn()
const mockSendWhatsAppNotification = vi.fn()
const mockLogAudit = vi.fn()

vi.mock('@/lib/telegram/service', () => ({
  sendTelegramMessage: (...args: unknown[]) => mockSendTelegramMessage(...args),
}))

vi.mock('@/lib/whatsapp/service', () => ({
  formatReviewNotificationMessage: vi.fn().mockReturnValue('Formatted WA Message'),
  normalizeWhatsAppPhone: vi.fn().mockImplementation((p: string) => p.replace(/\D/g, '')),
  sendWhatsAppNotification: (...args: unknown[]) => mockSendWhatsAppNotification(...args),
}))

vi.mock('@/lib/audit/log', () => ({
  logAudit: (...args: unknown[]) => mockLogAudit(...args),
}))

let mockDeliverable: any = null
let mockClient: any = null

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => {
            if (table === 'deliverables') return Promise.resolve({ data: mockDeliverable, error: null })
            if (table === 'clients') return Promise.resolve({ data: mockClient, error: null })
            return Promise.resolve({ data: null, error: null })
          },
        }),
      }),
    }),
  }),
}))

describe('features/notifications/api/service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDeliverable = {
      id: 'd1111111-1111-1111-1111-111111111111',
      client_id: 'c2222222-2222-2222-2222-222222222222',
      title: 'Feed Promo Akhir Pekan',
      type: 'content',
      status: 'sent',
      external_link: 'https://cdn.frhm.id/preview.jpg',
    }
    mockClient = {
      id: 'c2222222-2222-2222-2222-222222222222',
      name: 'Pawon Sengon',
      contact_phone: '081234567890',
      telegram_chat_id: '987654321',
      telegram_notif_enabled: true,
    }
    mockSendTelegramMessage.mockResolvedValue({ success: true, messageId: 101 })
    mockSendWhatsAppNotification.mockResolvedValue({
      success: true,
      status: 'ready',
      clickUrl: 'https://wa.me/6281234567890?text=test',
    })
  })

  describe('getNotificationTargetForDeliverable', () => {
    it('returns null if deliverableId is empty', async () => {
      const res = await getNotificationTargetForDeliverable('')
      expect(res).toBeNull()
    })

    it('returns null if deliverable is not found in database', async () => {
      mockDeliverable = null
      const res = await getNotificationTargetForDeliverable('d1111111-1111-1111-1111-111111111111')
      expect(res).toBeNull()
    })

    it('returns formatted notification target info with magic link', async () => {
      const res = await getNotificationTargetForDeliverable('d1111111-1111-1111-1111-111111111111')
      expect(res).not.toBeNull()
      expect(res?.title).toBe('Feed Promo Akhir Pekan')
      expect(res?.client.name).toBe('Pawon Sengon')
      expect(res?.client.contactPhone).toBe('081234567890')
      expect(res?.client.telegramChatId).toBe('987654321')
      expect(res?.reviewUrl).toContain('/review/d1111111-1111-1111-1111-111111111111')
      expect(res?.suggestedWhatsAppMessage).toBe('Formatted WA Message')
    })
  })

  describe('dispatchReviewNotification', () => {
    it('throws when deliverable target does not exist', async () => {
      mockDeliverable = null
      await expect(
        dispatchReviewNotification({
          deliverableId: 'd1111111-1111-1111-1111-111111111111',
          channels: ['whatsapp'],
        })
      ).rejects.toThrow('Deliverable atau klien tidak ditemukan.')
    })

    it('dispatches to both WhatsApp and Telegram and records audit log', async () => {
      const res = await dispatchReviewNotification({
        deliverableId: 'd1111111-1111-1111-1111-111111111111',
        channels: ['whatsapp', 'telegram'],
        customNote: 'Mohon direview sebelum jam 5 sore.',
      })

      expect(res.deliverableId).toBe('d1111111-1111-1111-1111-111111111111')
      expect(res.clientName).toBe('Pawon Sengon')
      expect(res.results).toHaveLength(2)

      expect(mockSendWhatsAppNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: '081234567890',
          deliverableId: 'd1111111-1111-1111-1111-111111111111',
        })
      )

      expect(mockSendTelegramMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          chatId: '987654321',
          recipientType: 'client',
        })
      )

      expect(mockLogAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'notification.review_dispatched',
          entityId: 'd1111111-1111-1111-1111-111111111111',
        })
      )
    })

    it('handles client without phone or without telegram chat ID gracefully', async () => {
      mockClient.contact_phone = null
      mockClient.telegram_chat_id = null

      const res = await dispatchReviewNotification({
        deliverableId: 'd1111111-1111-1111-1111-111111111111',
        channels: ['whatsapp', 'telegram'],
      })

      const waResult = res.results.find((r) => r.channel === 'whatsapp')
      const tgResult = res.results.find((r) => r.channel === 'telegram')

      expect(waResult?.success).toBe(false)
      expect(waResult?.status).toBe('failed')
      expect(waResult?.error).toContain('WhatsApp')

      expect(tgResult?.success).toBe(false)
      expect(tgResult?.status).toBe('skipped')
      expect(tgResult?.error).toContain('Telegram')
    })
  })

  describe('testNotificationDispatch', () => {
    it('sends telegram test ping', async () => {
      const res = await testNotificationDispatch({
        channel: 'telegram',
        destination: '12345678',
      })
      expect(res.success).toBe(true)
      expect(res.channel).toBe('telegram')
      expect(mockSendTelegramMessage).toHaveBeenCalled()
    })

    it('sends whatsapp test ping', async () => {
      const res = await testNotificationDispatch({
        channel: 'whatsapp',
        destination: '081299990000',
      })
      expect(res.success).toBe(true)
      expect(res.channel).toBe('whatsapp')
      expect(mockSendWhatsAppNotification).toHaveBeenCalled()
    })
  })
})
