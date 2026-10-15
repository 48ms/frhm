import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  normalizeWhatsAppPhone,
  generateWhatsAppClickToChat,
  formatReviewNotificationMessage,
  sendWhatsAppNotification,
} from './service'

vi.mock('@/lib/supabase/service', () => ({
  createSupabaseServiceClient: vi.fn().mockReturnValue({
    from: () => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
  }),
}))

describe('lib/whatsapp/service', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env = { ...originalEnv }
    delete process.env.WHATSAPP_API_TOKEN
    delete process.env.WHATSAPP_PHONE_NUMBER_ID
    delete process.env.WHATSAPP_WEBHOOK_URL
  })

  afterEach(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  describe('normalizeWhatsAppPhone', () => {
    it('returns empty string for null or empty input', () => {
      expect(normalizeWhatsAppPhone('')).toBe('')
      expect(normalizeWhatsAppPhone('   ')).toBe('')
    })

    it('replaces leading 0 with country code 62', () => {
      expect(normalizeWhatsAppPhone('081234567890')).toBe('6281234567890')
    })

    it('strips dashes, spaces, and leading plus from +62 format', () => {
      expect(normalizeWhatsAppPhone('+62 812-3456-7890')).toBe('6281234567890')
    })

    it('prefixes 62 if phone starts with 8', () => {
      expect(normalizeWhatsAppPhone('812999888')).toBe('62812999888')
    })

    it('keeps already normalized international number unchanged', () => {
      expect(normalizeWhatsAppPhone('6281234567890')).toBe('6281234567890')
    })
  })

  describe('generateWhatsAppClickToChat', () => {
    it('generates a valid wa.me link with encoded text', () => {
      const url = generateWhatsAppClickToChat('081234567890', 'Halo Frhm')
      expect(url).toBe('https://wa.me/6281234567890?text=Halo%20Frhm')
    })

    it('handles phone numbers with formatting characters', () => {
      const url = generateWhatsAppClickToChat('+62 812-345-678', 'Review: http://app.com')
      expect(url).toBe('https://wa.me/62812345678?text=Review%3A%20http%3A%2F%2Fapp.com')
    })
  })

  describe('formatReviewNotificationMessage', () => {
    it('formats a clean notification message containing review URL and metadata', () => {
      const msg = formatReviewNotificationMessage({
        clientName: 'Pawon Sengon',
        title: 'Video Reels Promo Lebaran',
        reviewUrl: 'https://frhm.id/review/del-123',
        campaignTag: 'Lebaran 2026',
      })

      expect(msg).toContain('*Pawon Sengon*')
      expect(msg).toContain('Video Reels Promo Lebaran')
      expect(msg).toContain('Lebaran 2026')
      expect(msg).toContain('https://frhm.id/review/del-123')
      expect(msg).toContain('Frhm Creative Ops')
    })
  })

  describe('sendWhatsAppNotification', () => {
    it('returns failure when phone number is missing or invalid', async () => {
      const result = await sendWhatsAppNotification({
        phone: '',
        text: 'Hello',
      })

      expect(result.success).toBe(false)
      expect(result.status).toBe('failed')
      expect(result.error).toContain('tidak valid')
    })

    it('returns ready status with clickUrl when running in standard direct link mode', async () => {
      const result = await sendWhatsAppNotification({
        phone: '081234567890',
        text: 'Draft konten siap direview',
        recipientType: 'client',
        deliverableId: 'del-123',
      })

      expect(result.success).toBe(true)
      expect(result.status).toBe('ready')
      expect(result.clickUrl).toContain('https://wa.me/6281234567890')
      expect(result.clickUrl).toContain('Draft%20konten%20siap%20direview')
    })

    it('dispatches to custom webhook when WHATSAPP_WEBHOOK_URL is set', async () => {
      process.env.WHATSAPP_WEBHOOK_URL = 'https://webhook.site/test-endpoint'

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'queued' }),
      })
      global.fetch = fetchMock

      const result = await sendWhatsAppNotification({
        phone: '081234567890',
        text: 'Pemberitahuan konten baru',
      })

      expect(fetchMock).toHaveBeenCalledWith(
        'https://webhook.site/test-endpoint',
        expect.objectContaining({
          method: 'POST',
        })
      )
      expect(result.success).toBe(true)
      expect(result.status).toBe('sent')
    })

    it('dispatches to Meta WhatsApp Cloud API when credentials are set', async () => {
      process.env.WHATSAPP_API_TOKEN = 'meta-token-xyz'
      process.env.WHATSAPP_PHONE_NUMBER_ID = 'phone-id-999'

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          messages: [{ id: 'wamid.HBgLMTIzNDU2' }],
        }),
      })
      global.fetch = fetchMock

      const result = await sendWhatsAppNotification({
        phone: '081234567890',
        text: 'Review link: https://frhm.id/review/1',
      })

      expect(fetchMock).toHaveBeenCalledWith(
        'https://graph.facebook.com/v19.0/phone-id-999/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer meta-token-xyz',
          }),
        })
      )
      expect(result.success).toBe(true)
      expect(result.status).toBe('sent')
      expect(result.messageId).toBe('wamid.HBgLMTIzNDU2')
    })
  })
})
