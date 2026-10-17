import { describe, it, expect, vi, beforeEach } from "vitest"
import { POST } from "./route"
import { sendTelegramMessage } from "@/lib/telegram/service"

// Mock dependencies
vi.mock("@/lib/telegram/service", () => ({
  sendTelegramMessage: vi.fn().mockResolvedValue({ success: true }),
  escapeTelegramHtml: vi.fn((str) =>
    str ? str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : ""
  ),
}))

vi.mock("@/lib/audit/log", () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/middleware/rate-limit", () => ({
  checkRateLimit: vi.fn().mockReturnValue({ limited: false }),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
  RATE_LIMITS: { mutation: { limit: 10, windowMs: 60000 } },
}))

vi.mock("@/lib/env", () => ({
  env: {
    server: {
      TELEGRAM_ADMIN_CHAT_ID: "admin-999",
    },
  },
}))

const mockGetUser = vi.fn()
const mockSelect = vi.fn()
const mockInsert = vi.fn()

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: vi.fn((table: string) => {
      if (table === "users") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: mockSelect,
            })),
          })),
        }
      }
      if (table === "support_tickets") {
        return {
          insert: vi.fn((data: unknown) => {
            mockInsert(data)
            return {
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { id: "ticket-123" },
                  error: null,
                }),
              })),
            }
          }),
        }
      }
      return {}
    }),
  })),
}))

describe("POST /api/support/submit Route Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 401 when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    const req = new Request("http://localhost/api/support/submit", {
      method: "POST",
      body: JSON.stringify({ subject: "Help", message: "Need assistance", priority: "normal" }),
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it("returns 400 when payload is missing required fields", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u-1", email: "client@brand.com" } } })
    mockSelect.mockResolvedValue({
      data: { role: "client", client_id: "c-1", full_name: "Client Brand", email: "client@brand.com" },
    })

    const req = new Request("http://localhost/api/support/submit", {
      method: "POST",
      body: JSON.stringify({ subject: "" }), // missing message & priority
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("forces non-admin client to their own client_id and sends Telegram notification", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u-1", email: "client@brand.com" } } })
    mockSelect.mockResolvedValue({
      data: { role: "client", client_id: "c-1", full_name: "Client Brand", email: "client@brand.com" },
    })

    const req = new Request("http://localhost/api/support/submit", {
      method: "POST",
      body: JSON.stringify({
        subject: "Revisi Desain & Font <Q3>",
        message: "Tolong ubah ukuran headline di slide <2>",
        priority: "Urgent",
        clientId: "different-client-id", // attempt to impersonate another tenant
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.ticketId).toBe("ticket-123")

    // Assert that client_id was enforced to "c-1" and NOT "different-client-id"
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        client_id: "c-1",
        created_by: "u-1",
        priority: "Urgent",
      })
    )

    // Assert Telegram notification was dispatched with HTML escaping
    expect(sendTelegramMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        chatId: "admin-999",
        recipientType: "admin",
        eventType: "support_request_submitted",
        text: expect.stringContaining("Revisi Desain &amp; Font &lt;Q3&gt;"),
      })
    )
  })
})
