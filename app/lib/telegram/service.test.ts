import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  escapeTelegramHtml,
  sendTelegramMessage,
  notifyClientContentReady,
  notifyAdminClientFeedback,
  notifyBudgetThresholdAlert,
} from "./service"

// Mock fetch global
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock env
vi.mock("@/lib/env", () => ({
  env: {
    server: {
      TELEGRAM_BOT_TOKEN: "mock-bot-token-12345",
      TELEGRAM_ADMIN_CHAT_ID: "admin-chat-999",
      NEXT_PUBLIC_APP_URL: "https://frhm.dev",
      NEXT_PUBLIC_TELEGRAM_BOT_USERNAME: "FrhmBot",
    },
  },
}))

// Mock Supabase service client
vi.mock("@/lib/supabase/service", () => ({
  createSupabaseServiceClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
  })),
}))

describe("Telegram Service & HTML Escaping Security", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, result: { message_id: 42 } }),
    })
  })

  describe("escapeTelegramHtml", () => {
    it("safely escapes &, <, and > characters", () => {
      expect(escapeTelegramHtml("Promo Q3 <Spesial> & Diskon")).toBe(
        "Promo Q3 &lt;Spesial&gt; &amp; Diskon"
      )
    })

    it("handles null, undefined, and empty string without errors", () => {
      expect(escapeTelegramHtml(null)).toBe("")
      expect(escapeTelegramHtml(undefined)).toBe("")
      expect(escapeTelegramHtml("")).toBe("")
    })

    it("leaves safe strings untouched", () => {
      expect(escapeTelegramHtml("Kopi Taraju Regular")).toBe("Kopi Taraju Regular")
    })
  })

  describe("sendTelegramMessage", () => {
    it("sends request with correct Telegram Bot API payload", async () => {
      const res = await sendTelegramMessage({
        chatId: "12345678",
        text: "<b>Halo</b>",
        eventType: "test_event",
      })

      expect(res.success).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.telegram.org/botmock-bot-token-12345/sendMessage",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: "12345678",
            text: "<b>Halo</b>",
            parse_mode: "HTML",
            disable_web_page_preview: false,
          }),
        })
      )
    })
  })

  describe("Notification Template Escaping", () => {
    it("escapes user input in notifyClientContentReady without breaking tags", async () => {
      await notifyClientContentReady({
        clientChatId: "client-chat-1",
        clientId: "c-1",
        clientName: "Brand <A&B>",
        title: "Promo Kopi & Teh <Spesial>",
        deliverableId: "del-1",
        campaignTag: "Q3 <Gajian>",
      })

      expect(mockFetch).toHaveBeenCalledTimes(1)
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.text).toContain("Halo tim <b>Brand &lt;A&amp;B&gt;</b>")
      expect(callBody.text).toContain("<b>Judul:</b> Promo Kopi &amp; Teh &lt;Spesial&gt;")
      expect(callBody.text).toContain("<b>Kampanye:</b> Q3 &lt;Gajian&gt;")
      expect(callBody.text).not.toContain("<Spesial>")
    })

    it("escapes revision notes in notifyAdminClientFeedback", async () => {
      await notifyAdminClientFeedback({
        clientName: "Pawon & Sengon",
        title: "Banner IG <Reels>",
        deliverableId: "del-2",
        action: "revision_requested",
        notes: "Tolong ganti warna tombol <merah> & tambahkan logo",
      })

      expect(mockFetch).toHaveBeenCalledTimes(1)
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.text).toContain("<b>Brand:</b> Pawon &amp; Sengon")
      expect(callBody.text).toContain("<b>Konten:</b> Banner IG &lt;Reels&gt;")
      expect(callBody.text).toContain("<i>Tolong ganti warna tombol &lt;merah&gt; &amp; tambahkan logo</i>")
    })

    it("escapes category in notifyBudgetThresholdAlert", async () => {
      await notifyBudgetThresholdAlert({
        clientName: "Taraju <Official>",
        clientId: "c-3",
        totalBudget: 10000000,
        remainingBalance: 500000,
        spentPercentage: 95,
        expenseAmount: 2000000,
        category: "Ads & Promotion <Meta>",
      })

      expect(mockFetch).toHaveBeenCalledTimes(1)
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.text).toContain("<b>Brand / Klien:</b> Taraju &lt;Official&gt;")
      expect(callBody.text).toContain("(Ads &amp; Promotion &lt;Meta&gt;)")
    })
  })
})
