import { describe, it, expect, vi, beforeEach } from "vitest"
import { generateHooks, generateCarousel, validatePlatformPost, generateVisualPrompt, evaluateTrend, repurposeCrossPlatform } from "./service"

const mockChatJson = vi.fn()
const mockChat = vi.fn()
const mockChatJsonDetailed = vi.fn().mockImplementation(async (...args: unknown[]) => {
  const data = await mockChatJson(...args)
  return {
    data,
    usage: { promptTokens: 120, completionTokens: 60, totalTokens: 180 },
  }
})
const mockChatDetailed = vi.fn().mockImplementation(async (...args: unknown[]) => {
  const text = await mockChat(...args)
  return {
    text,
    usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
  }
})
const mockResolveProvider = vi.fn()
const mockLoadSkillBundle = vi.fn()
const mockLoadClientFiles = vi.fn()

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "test-user-1" } } }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: { name: "Test Brand" } }),
        }),
      }),
    }),
  }),
}))

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock("@/lib/auth/guard", () => ({
  assertClientAccess: vi.fn().mockResolvedValue({
    userId: "test-user-1",
    role: "admin",
    clientId: "client-1",
  }),
}))

vi.mock("@/lib/ai/server", () => ({
  resolveProvider: (...args: unknown[]) => mockResolveProvider(...args),
  loadSkillBundle: (...args: unknown[]) => mockLoadSkillBundle(...args),
  loadClientFiles: (...args: unknown[]) => mockLoadClientFiles(...args),
  brandContext: vi.fn().mockReturnValue("# Brand Profile Mock"),
}))

vi.mock("@/lib/ai/usage", () => ({
  logAiUsage: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/ai/providers", () => ({
  chatJson: (...args: unknown[]) => mockChatJson(...args),
  chatJsonDetailed: (...args: unknown[]) => mockChatJsonDetailed(...args),
  chat: (...args: unknown[]) => mockChat(...args),
  chatDetailed: (...args: unknown[]) => mockChatDetailed(...args),
}))

describe("Copilot Social Media Skills Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockResolveProvider.mockResolvedValue({ kind: "gemini", model: "gemini-2.0-flash", api_key: "key", base_url: null })
    mockLoadSkillBundle.mockResolvedValue("# Skill Playbook & References")
    mockLoadClientFiles.mockResolvedValue({ "brand-profile.md": "# Profile" })
  })

  describe("generateHooks (hook-writer)", () => {
    it("returns error if topic is too short (< 3 chars)", async () => {
      const res = await generateHooks({
        clientId: "client-1",
        topic: "hi",
        platform: "instagram",
      })
      expect(res.error).toBeDefined()
      expect(res.hooks).toEqual([])
    })

    it("successfully calls hook-writer and returns distinct hooks", async () => {
      mockChatJson.mockResolvedValueOnce({
        hooks: [
          { angle: "Curiosity", text: "Sebagian besar bisnis kuliner gagal di 3 bulan pertama karena 1 hal ini.", explanation: "Membuka open loop rasa penasaran." },
          { angle: "Contrarian", text: "Berhenti posting menu tiap hari di Instagram.", explanation: "Menantang asumsi umum audiens." },
        ],
      })

      const res = await generateHooks({
        clientId: "client-1",
        topic: "Kesalahan umum bisnis F&B",
        platform: "instagram",
      })

      expect(res.error).toBeUndefined()
      expect(res.hooks).toHaveLength(2)
      expect(res.hooks[0].angle).toBe("Curiosity")
      expect(mockLoadSkillBundle).toHaveBeenCalledWith(expect.anything(), "hook-writer")
    })
  })

  describe("generateCarousel (carousel-writer)", () => {
    it("generates slide-by-slide structure with visual directions", async () => {
      mockChatJson.mockResolvedValueOnce({
        title: "5 Cara Scaling Agensi",
        targetAudienceAngle: "Agency founders",
        accompanyingCaption: "Simpan panduan ini untuk evaluasi kuartal depan.",
        slides: [
          { slideNumber: 1, role: "hook_cover", headline: "Rahasia Scaling Agensi Tanpa Burnout", bodyText: "Swipe untuk breakdown langkahnya 👉", visualDirection: "Bold typography, minimal dark mode background" },
          { slideNumber: 2, role: "content_value", headline: "1. Standardisasi Deliverables", bodyText: "Jangan buat paket kustom untuk tiap klien.", visualDirection: "Diagram alur proses terstandarisasi" },
          { slideNumber: 3, role: "cta_end", headline: "Siap Terapkan di Agensi Anda?", bodyText: "Komen 'SCALE' untuk template SOP.", visualDirection: "Bookmark icon + CTA button mockup" },
        ],
      })

      const res = await generateCarousel({
        clientId: "client-1",
        topic: "Cara scaling agensi digital",
        slideCount: 3,
        platform: "instagram",
      })

      expect(res.error).toBeUndefined()
      expect(res.carousel?.slides).toHaveLength(3)
      expect(res.carousel?.slides[0].role).toBe("hook_cover")
      expect(res.carousel?.slides[2].role).toBe("cta_end")
      expect(mockLoadSkillBundle).toHaveBeenCalledWith(expect.anything(), "carousel-writer")
    })
  })

  describe("validatePlatformPost (platform-specs-and-validation)", () => {
    it("audits content against platform specs and returns score + issues", async () => {
      mockChatJson.mockResolvedValueOnce({
        valid: true,
        score: 88,
        firstLinePreview: "Ini adalah baris pertama yang terlihat di feed...",
        issues: [
          { severity: "tip", rule: "hashtag_count", message: "Gunakan 3-5 hashtag tertarget untuk SEO modern." },
        ],
        recommendations: ["Tambahkan CTA di kalimat terakhir."],
      })

      const res = await validatePlatformPost({
        platform: "linkedin",
        content: "Ini adalah baris pertama yang terlihat di feed...\n\nBerikut penjabaran detailnya...",
        mediaType: "text",
      })

      expect(res.error).toBeUndefined()
      expect(res.result?.score).toBe(88)
      expect(res.result?.issues[0].rule).toBe("hashtag_count")
      expect(mockLoadSkillBundle).toHaveBeenCalledWith(expect.anything(), "platform-specs-and-validation")
    })
  })

  describe("generateVisualPrompt (image-prompt)", () => {
    it("generates natural-language prompt routed to the right tool", async () => {
      mockChatJson.mockResolvedValueOnce({
        brief: "Bold typographic quote graphic for Instagram feed",
        recommendedTool: "ideogram",
        aspectRatio: "4:5 Portrait",
        prompt: "A minimalist studio shot of a modern ceramic coffee cup, soft morning side lighting, subtle sage green background, negative space for text",
        textOverlay: "Kopi Terbaik Diseduh Santai",
        brandColorNotes: "Warm cream, deep espresso brown, and sage green",
        aiDisclosureRequired: true,
      })

      const res = await generateVisualPrompt({
        clientId: "client-1",
        topic: "Peluncuran Menu Baru",
        mediaType: "image",
      })

      expect(res.error).toBeUndefined()
      expect(res.result?.recommendedTool).toBe("ideogram")
      expect(res.result?.aspectRatio).toBe("4:5 Portrait")
      expect(mockLoadSkillBundle).toHaveBeenCalledWith(expect.anything(), "image-prompt")
    })
  })

  describe("evaluateTrend (trend-jacking)", () => {
    it("runs three gates and approves brand-safe rising trends", async () => {
      mockChatJson.mockResolvedValueOnce({
        gateFit: { pass: true, reason: "Cocok dengan audiens penikmat kuliner" },
        gateSafety: { pass: true, reason: "Aman, murni tren hiburan kuliner tanpa muatan kontroversi" },
        gateTiming: { status: "rising", verdict: "Tren sedang naik di TikTok dan Reels" },
        overallApproved: true,
        remixAngle: "Tampilkan versi dapur otentik Pawon Sengon dengan sound viral",
        recommendedFormat: "Reels",
        draftPremise: "POV: Ketika pelanggan pertama kali mencoba sambal rahasia",
      })

      const res = await evaluateTrend({
        clientId: "client-1",
        trendDescription: "Format video 'POV: Mencoba rasa baru'",
      })

      expect(res.error).toBeUndefined()
      expect(res.evaluation?.overallApproved).toBe(true)
      expect(res.evaluation?.gateTiming.status).toBe("rising")
      expect(mockLoadSkillBundle).toHaveBeenCalledWith(expect.anything(), "trend-jacking")
    })
  })

  describe("repurposeCrossPlatform (cross-platform-repurposing)", () => {
    it("atomizes source content and adapts natively per target platform", async () => {
      mockChatJson.mockResolvedValueOnce({
        coreAtom: "Disiplin SOP harian jauh lebih menentukan retensi pelanggan daripada diskon promosi besar-besaran.",
        results: [
          {
            platform: "linkedin",
            format: "Thought Leadership Post",
            hook: "Diskon 50% bisa mendatangkan 100 pelanggan hari ini. Tapi hanya SOP yang membuat 80 di antaranya kembali bulan depan.",
            content: "Banyak pemilik bisnis terjebak dalam ilusi traffic...",
            callToAction: "Bagaimana sistem retensi pelanggan di tim Anda saat ini?",
            registerNote: "Authoritative, analytical, spaced lines",
          },
          {
            platform: "instagram",
            format: "Carousel Outline",
            hook: "Kenapa promo besar-besaran sering membunuh bisnis pelan-pelan? (Slide to find out)",
            content: "Slide 1: Realita promo vs retensi...",
            callToAction: "Save post ini untuk evaluasi strategi kampanye Anda.",
            registerNote: "Visual-led, curiosity-inducing, concise",
          },
        ],
      })

      const res = await repurposeCrossPlatform({
        clientId: "client-1",
        baseContent: "Artikel panjang mengenai bahaya diskon berulang tanpa retensi SOP dapur yang rapi...",
        platforms: ["linkedin", "instagram"],
      })

      expect(res.error).toBeUndefined()
      expect(res.repurposed?.coreAtom).toContain("Disiplin SOP")
      expect(res.repurposed?.results).toHaveLength(2)
      expect(res.repurposed?.results[0].platform).toBe("linkedin")
      expect(res.repurposed?.results[0].format).toBe("Thought Leadership Post")
      expect(mockLoadSkillBundle).toHaveBeenCalledWith(expect.anything(), "cross-platform-repurposing")
    })
  })
})


