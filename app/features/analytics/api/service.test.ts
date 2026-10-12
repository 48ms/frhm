import { describe, it, expect, vi, beforeEach } from "vitest"
import { auditPerformanceAndIterate } from "./service"

const mockChatJson = vi.fn()
const mockResolveProvider = vi.fn()
const mockLoadSkillBundle = vi.fn()
const mockLoadClientFiles = vi.fn()
const mockInsert = vi.fn().mockResolvedValue({ error: null })

let mockMetricsData: any[] = []
let mockPostsData: any[] = []

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: table === "post_metrics" ? mockMetricsData : mockPostsData }),
          maybeSingle: () => Promise.resolve({ data: { name: "Pawon Sengon" } }),
        }),
      }),
      insert: (...args: unknown[]) => mockInsert(...args),
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

vi.mock("@/lib/ai/server", () => ({
  resolveProvider: (...args: unknown[]) => mockResolveProvider(...args),
  loadSkillBundle: (...args: unknown[]) => mockLoadSkillBundle(...args),
  loadClientFiles: (...args: unknown[]) => mockLoadClientFiles(...args),
  brandContext: vi.fn().mockReturnValue("# Brand Profile Pawon Sengon"),
}))

vi.mock("@/lib/ai/providers", () => ({
  chatJson: (...args: unknown[]) => mockChatJson(...args),
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockResolveProvider.mockResolvedValue({ kind: "gemini", model: "gemini-2.0-flash", api_key: "key", base_url: null })
  mockLoadSkillBundle.mockResolvedValue("# METER Analytics Framework")
  mockLoadClientFiles.mockResolvedValue({ "brand-profile.md": "# Pawon Sengon" })
})

describe("Analytics Service (METER Framework)", () => {
  it("returns factual error when no metrics exist for client (no fabrication rule)", async () => {
    mockMetricsData = []
    mockPostsData = []

    const res = await auditPerformanceAndIterate({
      clientId: "client-empty",
    })

    expect(res.error).toBeDefined()
    expect(res.error).toContain("Belum ada data metrik faktual")
    expect(res.report).toBeUndefined()
  })

  it("successfully performs METER audit on factual post metrics and returns actionable iterations", async () => {
    mockMetricsData = [
      {
        id: "m-1",
        post_id: "p-1",
        client_id: "client-pawon",
        platform: "instagram",
        reach: 5000,
        likes: 350,
        comments: 42,
        shares: 88,
        saves: 140,
        clicks: 95,
        wa_inquiries: 12,
        dm_inquiries: 6,
        recorded_at: "2026-10-01T10:00:00Z",
      },
      {
        id: "m-2",
        post_id: "p-2",
        client_id: "client-pawon",
        platform: "tiktok",
        reach: 1200,
        likes: 45,
        comments: 2,
        shares: 4,
        saves: 5,
        clicks: 8,
        wa_inquiries: 0,
        dm_inquiries: 1,
        recorded_at: "2026-10-05T10:00:00Z",
      },
    ]

    mockPostsData = [
      { id: "p-1", title: "Resep Rahasia Sambal Bawang", platform: "instagram", campaign_tag: "Edukasi" },
      { id: "p-2", title: "Promo Diskon Khusus Hari Senin", platform: "tiktok", campaign_tag: "Promo" },
    ]

    mockChatJson.mockResolvedValueOnce({
      overallHealth: "STABLE",
      signalScore: 78,
      summary: "Konten edukasi kuliner menghasilkan saves & shares tinggi, sementara konten promo hard-sell di TikTok mengalami penurunan engagement.",
      signalAnalysis: {
        reachSignal: "Reach Instagram stabil di 5.000 dengan rasio jangkauan organik kuat.",
        engagementSignal: "Saves (140) dan Shares (88) pada konten resep membuktikan sinyal retensi tinggi.",
        conversionSignal: "18 total inquiries membuktikan konten edukasi memicu konversi langsung ke WhatsApp/DM.",
      },
      winners: [
        {
          title: "Resep Rahasia Sambal Bawang",
          reason: "Tingginya saves (140) dan shares (88) menandakan nilai utilitas nyata bagi audiens.",
        },
      ],
      underperformers: [
        {
          title: "Promo Diskon Khusus Hari Senin",
          rootCause: "Hard-sell tanpa hook kuat di 3 detik pertama TikTok.",
          fixAngle: "Ubah menjadi format storytelling 'Kenapa kami berikan diskon ini untuk pelanggan setia'.",
        },
      ],
      actionableIterations: [
        {
          action: "Recycle resep sambal bawang menjadi Carousel IG 5 slide",
          targetPlatform: "instagram",
          priority: "HIGH",
          recommendedPrompt: "5 Rahasia SOP Sambal Bawang yang bikin pelanggan ketagihan",
        },
        {
          action: "Ubah angle TikTok promo menjadi POV drama dapur",
          targetPlatform: "tiktok",
          priority: "MEDIUM",
          recommendedPrompt: "POV: Ketika dapur kehabisan stok sambal jam 12 siang",
        },
        {
          action: "Eksperimen posting di jam 19.00 saat audiens aktif mencari makan malam",
          targetPlatform: "instagram",
          priority: "LOW",
          recommendedPrompt: "Rekomendasi menu santap malam autentik",
        },
      ],
    })

    const res = await auditPerformanceAndIterate({
      clientId: "client-pawon",
      period: "30d",
    })

    expect(res.error).toBeUndefined()
    expect(res.report).toBeDefined()
    expect(res.report?.overallHealth).toBe("STABLE")
    expect(res.report?.signalScore).toBe(78)
    expect(res.report?.winners).toHaveLength(1)
    expect(res.report?.underperformers).toHaveLength(1)
    expect(res.report?.actionableIterations).toHaveLength(3)
    expect(mockLoadSkillBundle).toHaveBeenCalledWith(expect.anything(), "analytics-and-reporting")
  })
})
