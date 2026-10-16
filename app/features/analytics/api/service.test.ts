import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  auditPerformanceAndIterate,
  getMultiAccountAnalytics,
  syncMultiAccountSocialData,
} from "./service"

const mockChatJson = vi.fn()
const mockResolveProvider = vi.fn()
const mockLoadSkillBundle = vi.fn()
const mockLoadClientFiles = vi.fn()
const mockInsert = vi.fn().mockResolvedValue({ error: null })
const mockUpdate = vi.fn().mockResolvedValue({ error: null })
const mockLogAudit = vi.fn()
const mockListSocialAccounts = vi.fn()

let mockMetricsData: any[] = []
let mockPostsData: any[] = []
let mockChannelsData: any[] = []
let mockClientData: any = { id: "client-pawon", name: "Pawon Sengon", ayrshare_profile_key: "ws-proj-123" }

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    from: (table: string) => {
      const queryBuilder: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockImplementation(() => {
          if (table === "post_metrics") return Promise.resolve({ data: mockMetricsData })
          if (table === "scheduled_posts") return Promise.resolve({ data: mockPostsData })
          if (table === "client_channels") return Promise.resolve({ data: mockChannelsData })
          return Promise.resolve({ data: [] })
        }),
        maybeSingle: vi.fn().mockImplementation(() => {
          if (table === "clients") return Promise.resolve({ data: mockClientData })
          if (table === "client_channels") return Promise.resolve({ data: mockChannelsData[0] || null })
          return Promise.resolve({ data: null })
        }),
        single: vi.fn().mockImplementation(() => {
          if (table === "clients") return Promise.resolve({ data: mockClientData, error: null })
          return Promise.resolve({ data: null, error: null })
        }),
        insert: (...args: unknown[]) => mockInsert(...args),
        update: (...args: unknown[]) => ({
          eq: () => mockUpdate(...args),
        }),
        then: (resolve: any) => {
          let data: any = []
          if (table === "post_metrics") data = mockMetricsData
          else if (table === "scheduled_posts") data = mockPostsData
          else if (table === "client_channels") data = mockChannelsData
          else if (table === "clients") data = mockClientData ? [mockClientData] : []
          return Promise.resolve({ data, error: null }).then(resolve)
        },
      }
      return queryBuilder
    },
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
    clientId: "client-pawon",
  }),
}))

vi.mock("@/lib/audit/log", () => ({
  logAudit: (...args: unknown[]) => mockLogAudit(...args),
}))

vi.mock("@/lib/bridge/config", () => ({
  getBridgeKey: vi.fn().mockResolvedValue("test-bridge-key"),
}))

vi.mock("@/lib/bridge/woopsocial", () => ({
  listSocialAccounts: (...args: unknown[]) => mockListSocialAccounts(...args),
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
  mockClientData = { id: "client-pawon", name: "Pawon Sengon", ayrshare_profile_key: "ws-proj-123" }
})

describe("Analytics Service (METER Framework)", () => {
  it("returns factual error when no metrics exist for client (no fabrication rule)", async () => {
    mockMetricsData = []
    mockPostsData = []
    mockChannelsData = []

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
      summary: "Konten edukasi kuliner menghasilkan saves & shares tinggi.",
      signalAnalysis: {
        reachSignal: "Reach Instagram stabil di 5.000.",
        engagementSignal: "Saves (140) dan Shares (88) kuat.",
        conversionSignal: "18 total inquiries membuktikan konversi tinggi.",
      },
      winners: [
        {
          title: "Resep Rahasia Sambal Bawang",
          reason: "Tingginya saves (140) dan shares (88).",
        },
      ],
      underperformers: [
        {
          title: "Promo Diskon Khusus Hari Senin",
          rootCause: "Hard-sell tanpa hook kuat.",
          fixAngle: "Ubah menjadi storytelling.",
        },
      ],
      actionableIterations: [
        {
          action: "Recycle resep sambal bawang menjadi Carousel IG 5 slide",
          targetPlatform: "instagram",
          priority: "HIGH",
          recommendedPrompt: "5 Rahasia SOP Sambal Bawang",
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
  })
})

describe("Multi-Account Analytics Aggregator", () => {
  it("aggregates factual metrics across platforms including Instagram and TikTok deep-dives", async () => {
    mockChannelsData = [
      {
        id: "ch-1",
        client_id: "client-pawon",
        platform: "instagram",
        handle: "@pawonsengon.id",
        status: "terhubung",
        avatar_url: "https://example.com/ig.png",
        updated_at: "2026-10-14T10:00:00Z",
      },
      {
        id: "ch-2",
        client_id: "client-pawon",
        platform: "tiktok",
        handle: "@pawonsengon_official",
        status: "terhubung",
        avatar_url: null,
        updated_at: "2026-10-14T11:00:00Z",
      },
    ]

    mockMetricsData = [
      {
        id: "m-1",
        post_id: "p-1",
        client_id: "client-pawon",
        platform: "instagram",
        views: 6500,
        reach: 5000,
        likes: 400,
        comments: 50,
        shares: 60,
        saves: 90,
        clicks: 80,
        wa_inquiries: 10,
        dm_inquiries: 5,
        recorded_at: new Date().toISOString(),
      },
      {
        id: "m-2",
        post_id: "p-2",
        client_id: "client-pawon",
        platform: "tiktok",
        views: 12000,
        reach: 8000,
        likes: 900,
        comments: 80,
        shares: 120,
        saves: 150,
        clicks: 40,
        wa_inquiries: 15,
        dm_inquiries: 0,
        recorded_at: new Date().toISOString(),
      },
    ]

    mockPostsData = [
      {
        id: "p-1",
        title: "Behind The Scenes Dapur",
        platform: "instagram",
        creative_format: "reels",
        content_type: "educational",
      },
      {
        id: "p-2",
        title: "Tantangan Sambal Terpedas",
        platform: "tiktok",
        creative_format: "reels",
        content_type: "entertainment",
      },
    ]

    const result = await getMultiAccountAnalytics("client-pawon", "30d")

    expect(result.clientId).toBe("client-pawon")
    expect(result.clientName).toBe("Pawon Sengon")
    expect(result.connectedAccountsCount).toBe(2)
    expect(result.totalReach).toBe(13000) // 5000 + 8000
    expect(result.totalViews).toBe(18500) // 6500 + 12000
    expect(result.totalInquiries).toBe(30) // (10+5) + (15+0)
    expect(result.platformList).toHaveLength(2)

    // Check Instagram insights
    expect(result.instagramInsights.reelsCount).toBe(1)
    expect(result.instagramInsights.totalReach).toBe(5000)
    expect(result.instagramInsights.avgSaves).toBe(90)
    expect(result.instagramInsights.dmInquiries).toBe(5)
    expect(result.instagramInsights.topPostTitle).toBe("Behind The Scenes Dapur")

    // Check TikTok insights
    expect(result.tiktokInsights.videoCount).toBe(1)
    expect(result.tiktokInsights.totalViews).toBe(12000)
    expect(result.tiktokInsights.avgShares).toBe(120)
    expect(result.tiktokInsights.waInquiries).toBe(15)
    expect(result.tiktokInsights.viralPotentialScore).toBeGreaterThan(0)
    expect(result.tiktokInsights.topPostTitle).toBe("Tantangan Sambal Terpedas")
  })

  it("handles empty client without throwing errors", async () => {
    const result = await getMultiAccountAnalytics("")
    expect(result.connectedAccountsCount).toBe(0)
    expect(result.totalReach).toBe(0)
    expect(result.platformList).toHaveLength(0)
  })

  it("synchronizes multi-account social data via WoopSocial bridge", async () => {
    mockListSocialAccounts.mockResolvedValueOnce({
      ok: true,
      data: [
        {
          id: "ws-acc-1",
          externalAccountId: "ext-1",
          platform: "INSTAGRAM",
          username: "pawon_ig",
          imageUrl: "https://example.com/pawon.jpg",
          status: "connected",
        },
        {
          id: "ws-acc-2",
          externalAccountId: "ext-2",
          platform: "TIKTOK",
          username: "pawon_tiktok",
          imageUrl: null,
          status: "connected",
        },
      ],
    })

    const syncRes = await syncMultiAccountSocialData({
      clientId: "client-pawon",
      source: "woopsocial",
    })

    expect(syncRes.success).toBe(true)
    expect(syncRes.accountsSynced).toBe(2)
    expect(syncRes.syncedPlatforms).toContain("instagram")
    expect(syncRes.syncedPlatforms).toContain("tiktok")
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "social.multi_account_sync",
        clientId: "client-pawon",
      })
    )
  })

  it("auditPerformanceAndIterate rejects when caller lacks access to target client", async () => {
    const { assertClientAccess } = await import("@/lib/auth/guard")
    vi.mocked(assertClientAccess).mockRejectedValueOnce(
      new Error("Forbidden: Anda tidak memiliki akses ke klien ini")
    )

    const res = await auditPerformanceAndIterate({
      clientId: "client-other",
      period: "30d",
    })

    expect(res.error).toContain("Forbidden: Anda tidak memiliki akses ke klien ini")
  })
})
