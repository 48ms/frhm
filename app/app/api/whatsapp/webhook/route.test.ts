import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from './route'

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('@/lib/audit/log', () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}))

describe('app/api/whatsapp/webhook', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env = { ...originalEnv }
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = 'secret-verify-123'
  })

  describe('GET', () => {
    it('returns 403 when verify token does not match', async () => {
      const req = new Request(
        'http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=7788'
      )
      const res = await GET(req)
      expect(res.status).toBe(403)
    })

    it('returns challenge text when verify token matches', async () => {
      const req = new Request(
        'http://localhost:3000/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=secret-verify-123&hub.challenge=7788'
      )
      const res = await GET(req)
      expect(res.status).toBe(200)
      const text = await res.text()
      expect(text).toBe('7788')
    })
  })

  describe('POST', () => {
    it('returns 401 when signature/secret header is missing in production or strict mode', async () => {
      const req = new Request('http://localhost:3000/api/whatsapp/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ object: 'whatsapp_business_account' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(401)
    })

    it('accepts payload when valid secret header is supplied', async () => {
      const req = new Request('http://localhost:3000/api/whatsapp/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-whatsapp-webhook-secret': 'secret-verify-123',
        },
        body: JSON.stringify({
          entry: [{ id: 'wa-account-1', changes: [] }],
        }),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.ok).toBe(true)
    })

    it('extracts inbound message and logs whatsapp.message_received audit trail', async () => {
      const { logAudit } = await import('@/lib/audit/log')
      const req = new Request('http://localhost:3000/api/whatsapp/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-whatsapp-webhook-secret': 'secret-verify-123',
        },
        body: JSON.stringify({
          entry: [
            {
              changes: [
                {
                  value: {
                    contacts: [{ profile: { name: 'Bunda' } }],
                    messages: [
                      {
                        from: '62812345678',
                        id: 'wamid.123',
                        text: { body: 'Halo tim Frhm' },
                      },
                    ],
                  },
                },
              ],
            },
          ],
        }),
      })

      const res = await POST(req)
      expect(res.status).toBe(200)
      expect(logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'whatsapp.message_received',
          summary: expect.stringContaining('Pesan WhatsApp dari Bunda (62812345678)'),
        })
      )
    })

    it('extracts delivery status and logs whatsapp.status_delivered audit trail', async () => {
      const { logAudit } = await import('@/lib/audit/log')
      const req = new Request('http://localhost:3000/api/whatsapp/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-whatsapp-webhook-secret': 'secret-verify-123',
        },
        body: JSON.stringify({
          entry: [
            {
              changes: [
                {
                  value: {
                    statuses: [
                      {
                        id: 'wamid.123',
                        status: 'delivered',
                        recipient_id: '62812345678',
                      },
                    ],
                  },
                },
              ],
            },
          ],
        }),
      })

      const res = await POST(req)
      expect(res.status).toBe(200)
      expect(logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'whatsapp.status_delivered',
        })
      )
    })
  })
})
