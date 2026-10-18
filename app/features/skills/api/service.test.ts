import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  getSkills,
  getSkillPacks,
  getSkillDetail,
  getClientSkills,
  assignPackToClient,
  updateClientSkillStatus,
  saveSkillOutput,
  executeSkillChat,
  executeSkillTool,
  executeGenericSkill,
} from "./service"

const mockChatJsonDetailed = vi.fn()
const mockResolveProvider = vi.fn()
const mockLoadSkillBundle = vi.fn()
const mockLoadClientFiles = vi.fn()
const mockExecuteWoopSocialTool = vi.fn()

vi.mock("@/lib/mcp/woopsocial-mcp", () => ({
  executeWoopSocialTool: (...args: unknown[]) => mockExecuteWoopSocialTool(...args),
}))

vi.mock("@/lib/audit/log", () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}))

const mockFrom = vi.fn()
const mockServiceFrom = vi.fn()

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockImplementation(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "test-user-1" } } }),
    },
    from: mockFrom,
  })),
}))

vi.mock("@/lib/supabase/service", () => ({
  createSupabaseServiceClient: vi.fn().mockImplementation(() => ({
    from: mockServiceFrom,
  })),
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
  chatJson: vi.fn(),
  chatJsonDetailed: (...args: unknown[]) => mockChatJsonDetailed(...args),
}))

describe("Skills Feature Service Layer", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockResolveProvider.mockResolvedValue({
      kind: "gemini",
      model: "gemini-2.5-flash",
      base_url: null,
      api_key: "fake-key",
    })
    mockLoadSkillBundle.mockResolvedValue("# SKILL PLAYBOOK MOCK")
    mockLoadClientFiles.mockResolvedValue({ "brand-profile.md": "Taraju Coffee" })
  })

  it("getSkills fetches skills list with category filter", async () => {
    const fakeSkills = [
      { id: "hook-writer", name: "Hook Writer", category: "Copy & captions", job: "Writes hooks" },
    ]
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: fakeSkills, error: null }),
          }),
        }),
      }),
    })

    const res = await getSkills({ category: "Copy & captions" })
    expect(res).toEqual(fakeSkills)
  })

  it("getSkillPacks aggregates packs with their skill count", async () => {
    const fakePacks = [
      { id: "starter", name: "Starter Pack", category: "starter", sort_order: 1 },
    ]
    const fakePackSkills = [
      { pack_id: "starter", skill_id: "brand-profile" },
      { pack_id: "starter", skill_id: "voice-builder" },
    ]

    mockFrom.mockImplementation((table: string) => {
      if (table === "skill_packs") {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: fakePacks, error: null }),
          }),
        }
      }
      if (table === "pack_skills") {
        return {
          select: vi.fn().mockResolvedValue({ data: fakePackSkills, error: null }),
        }
      }
      return {}
    })

    const res = await getSkillPacks()
    expect(res).toHaveLength(1)
    expect(res[0].skill_count).toBe(2)
  })

  it("getClientSkills returns per-client tracked skills", async () => {
    const fakeClientSkills = [
      {
        id: "cs-1",
        client_id: "c-123",
        skill_id: "hook-writer",
        status: "selesai",
        notes: null,
        created_at: "2026-10-14T00:00:00Z",
        updated_at: "2026-10-14T00:00:00Z",
        skills: {
          id: "hook-writer",
          name: "Hook Writer",
          category: "Copy & captions",
          job: "Writes hooks",
          allowed_tools: null,
        },
      },
    ]

    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: fakeClientSkills, error: null }),
        }),
      }),
    })

    const res = await getClientSkills("c-123")
    expect(res).toHaveLength(1)
    expect(res[0].status).toBe("selesai")
    expect(res[0].skill?.name).toBe("Hook Writer")
  })

  it("assignPackToClient populates client_skills via upsert", async () => {
    mockServiceFrom.mockImplementation((table: string) => {
      if (table === "pack_skills") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [{ skill_id: "hook-writer" }, { skill_id: "caption-writer" }],
              error: null,
            }),
          }),
        }
      }
      if (table === "client_skills") {
        return {
          upsert: vi.fn().mockResolvedValue({ error: null }),
        }
      }
      return {}
    })

    const res = await assignPackToClient("c-123", "instagram-growth")
    expect(res.success).toBe(true)
    expect(res.count).toBe(2)
  })

  it("saveSkillOutput inserts to skill_outputs and marks skill as selesai", async () => {
    mockServiceFrom.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: "out-999" }, error: null }),
        }),
      }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    })

    const res = await saveSkillOutput({
      clientId: "11111111-1111-1111-1111-111111111111",
      skillId: "competitor-analysis",
      title: "Riset Kompetitor Taraju",
      content: "## Analisis Lengkap",
    })

    expect(res.success).toBe(true)
    expect(res.id).toBe("out-999")
  })

  it("saveSkillOutput resolves targetPath via skill writes_files if not in canonical map", async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null })
    mockServiceFrom.mockImplementation((table: string) => {
      if (table === "skills") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: { writes_files: ["custom-output.md"] } }),
            }),
          }),
        }
      }
      if (table === "client_files") {
        return { upsert: mockUpsert }
      }
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: "out-1001" }, error: null }),
          }),
        }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      }
    })

    const res = await saveSkillOutput({
      clientId: "11111111-1111-1111-1111-111111111111",
      skillId: "custom-specialist-skill",
      title: "Custom Output",
      content: "## Custom Strategy",
    })

    expect(res.success).toBe(true)
    expect(res.id).toBe("out-1001")
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "custom-output.md",
        content: "## Custom Strategy",
      }),
      expect.any(Object)
    )
  })

  it("saveSkillOutput fans out to sub-files when brand-profile is saved", async () => {
    const upsertedFiles: Array<{ path: string; content: string }> = []
    const mockUpsert = vi.fn((file) => {
      upsertedFiles.push(file)
      return Promise.resolve({ error: null })
    })

    mockServiceFrom.mockImplementation((table: string) => {
      if (table === "client_files") {
        return { upsert: mockUpsert }
      }
      if (table === "clients") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  name: "Pawon Sengon",
                  brand_profile: {},
                },
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }
      }
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: "out-bp-1" }, error: null }),
          }),
        }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      }
    })

    const bpMarkdown = `# Brand Profile — Pawon Sengon

## Identity
Resto khas Jawa Timur.

## Voice
Hangat, bersahabat, medok santun.

## Audience
Keluarga dan pecinta rawon.

## Guardrails
Dilarang membandingkan negatif dengan resto lain.

## Offers & CTAs
Diskon makan siang keluarga 15%.

## Content Pillars
- Resep Rawon Legendaris
- Suasana Makan Keluarga
`

    const res = await saveSkillOutput({
      clientId: "11111111-1111-1111-1111-111111111111",
      skillId: "brand-profile",
      title: "Master Brand Profile Pawon Sengon",
      content: bpMarkdown,
    })

    expect(res.success).toBe(true)
    const paths = upsertedFiles.map((f) => f.path)
    expect(paths).toContain("brand-profile.md")
    expect(paths).toContain("voice.md")
    expect(paths).toContain("audience.md")
    expect(paths).toContain("guardrails.md")
    expect(paths).toContain("content-pillars.md")
    expect(paths).toContain("offers.md")
  })

  it("saveSkillOutput re-generates master brand-profile.md when voice.md is saved", async () => {
    const upsertedFiles: Array<{ path: string; content: string }> = []
    const mockUpsert = vi.fn((file) => {
      upsertedFiles.push(file)
      return Promise.resolve({ error: null })
    })

    mockServiceFrom.mockImplementation((table: string) => {
      if (table === "client_files") {
        return { upsert: mockUpsert }
      }
      if (table === "clients") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  name: "Pawon Sengon",
                  brand_profile: {
                    who: "Resto Pawon Sengon",
                    audience: "Keluarga",
                  },
                },
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }
      }
      return {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: "out-voice-1" }, error: null }),
          }),
        }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      }
    })

    const res = await saveSkillOutput({
      clientId: "11111111-1111-1111-1111-111111111111",
      skillId: "voice-builder",
      title: "Voice Guide",
      content: "Hangat, bersahabat, dan mengayomi.",
    })

    expect(res.success).toBe(true)
    const masterFile = upsertedFiles.find((f) => f.path === "brand-profile.md")
    expect(masterFile).toBeDefined()
    expect(masterFile?.content).toContain("Hangat, bersahabat, dan mengayomi.")
  })

  it("executeSkillChat manages interactive interview turn with live preview", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: { name: "Taraju Coffee" } }),
        }),
      }),
    })
    mockServiceFrom.mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ error: null }),
    })

    mockChatJsonDetailed.mockResolvedValue({
      data: {
        reply: "Siapa 2 kompetitor terdekat Anda?",
        done: false,
        preview: {
          title: "Draf Analisis Kompetitor",
          content: "### 1. Kompetitor Awal",
        },
      },
      usage: { promptTokens: 100, completionTokens: 40 },
    })

    const res = await executeSkillChat({
      clientId: "11111111-1111-1111-1111-111111111111",
      skillId: "competitor-analysis",
      messages: [],
    })

    expect(res.reply).toBe("Siapa 2 kompetitor terdekat Anda?")
    expect(res.done).toBe(false)
    expect(res.preview?.title).toBe("Draf Analisis Kompetitor")
  })

  it("executeSkillTool checks allowed_tools and invokes WoopSocial MCP engine", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "skills") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "scheduling-and-queue",
                  name: "Scheduling & Queue",
                  allowed_tools: "WoopSocial MCP (Projects, Social Accounts, Posts)",
                },
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === "skill_files") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }
      }
      return {}
    })

    mockExecuteWoopSocialTool.mockResolvedValue({
      success: true,
      data: { status: "connected" },
      toolName: "woopsocial_health",
    })

    const res = await executeSkillTool({
      clientId: "client-1",
      skillId: "scheduling-and-queue",
      toolName: "woopsocial_health",
    })

    expect(res.success).toBe(true)
    expect(mockExecuteWoopSocialTool).toHaveBeenCalledWith("woopsocial_health", {
      clientId: "client-1",
    })
  })

  it("executeSkillTool blocks execution if skill lacks allowed_tools permission", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "skills") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "hook-writer",
                  name: "Hook Writer",
                  allowed_tools: null,
                },
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === "skill_files") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            }),
          }),
        }
      }
      return {}
    })

    const res = await executeSkillTool({
      clientId: "client-1",
      skillId: "hook-writer",
      toolName: "woopsocial_schedule_post",
    })

    expect(res.success).toBe(false)
    expect(res.error).toContain("tidak memiliki izin")
  })

  it("executeGenericSkill executes playbook and returns generated document", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "skills") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "carousel-writer",
                  name: "Carousel Writer",
                  category: "Copy & captions",
                  description: "Menulis draf carousel",
                },
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === "skill_files") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [{ path: "SKILL.md", content: "# Carousel Guide" }],
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === "clients") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { name: "Taraju Coffee" },
                error: null,
              }),
            }),
          }),
        }
      }
      return {}
    })

    mockServiceFrom.mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ error: null }),
    })

    mockChatJsonDetailed.mockResolvedValue({
      data: {
        title: "Carousel 5 Tips Kopi — Taraju",
        summary: "5 slide edukatif seputar kopi specialty",
        content: "# Slide 1: Pembuka\n\nTips memilih biji kopi...",
      },
      usage: { promptTokens: 120, completionTokens: 250 },
    })

    const res = await executeGenericSkill({
      clientId: "client-1",
      skillId: "carousel-writer",
      prompt: "Buat carousel edukasi kopi",
      autoSave: false,
    })

    expect(res.success).toBe(true)
    expect(res.title).toBe("Carousel 5 Tips Kopi — Taraju")
    expect(res.content).toContain("# Slide 1: Pembuka")
    expect(res.summary).toBe("5 slide edukatif seputar kopi specialty")
    expect(res.tokensUsed?.promptTokens).toBe(120)
  })

  it("executeGenericSkill returns error when AI provider is not configured", async () => {
    mockResolveProvider.mockResolvedValueOnce(null)

    const res = await executeGenericSkill({
      clientId: "client-1",
      skillId: "carousel-writer",
      prompt: "Test",
    })

    expect(res.success).toBe(false)
    expect(res.error).toContain("AI Provider belum dikonfigurasi")
  })

  it("executeGenericSkill returns error when skill does not exist", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "skills") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }
      }
      if (table === "skill_files") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }
      }
      if (table === "clients") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: { name: "Client" }, error: null }),
            }),
          }),
        }
      }
      return {}
    })

    const res = await executeGenericSkill({
      clientId: "client-1",
      skillId: "non-existent-skill",
      prompt: "Test",
    })

    expect(res.success).toBe(false)
    expect(res.error).toContain("tidak ditemukan di database")
  })

  it("executeGenericSkill rejects when assertClientAccess fails (cross-tenant)", async () => {
    const { assertClientAccess } = await import("@/lib/auth/guard")
    vi.mocked(assertClientAccess).mockRejectedValueOnce(new Error("Forbidden: Anda tidak memiliki akses ke klien ini"))

    await expect(
      executeGenericSkill({
        clientId: "client-other",
        skillId: "carousel-writer",
        prompt: "Test",
      })
    ).rejects.toThrow("Forbidden: Anda tidak memiliki akses ke klien ini")
  })

  describe("saveSkillOutput", () => {
    beforeEach(() => {
      mockServiceFrom.mockReset()
    })

    it("saves regular skill output and marks client_skills as selesai", async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: { id: "out-123" }, error: null })
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
      const mockUpsertClientSkills = vi.fn().mockResolvedValue({ error: null })

      mockServiceFrom.mockImplementation((table: string) => {
        if (table === "skill_outputs") {
          return { insert: mockInsert }
        }
        if (table === "client_skills") {
          return { upsert: mockUpsertClientSkills }
        }
        return {}
      })

      const res = await saveSkillOutput({
        clientId: "client-1",
        skillId: "hook-writer",
        title: "Daftar Hook",
        content: "1. Rahasia seduh teh Ciwidey",
      })

      expect(res.success).toBe(true)
      expect(res.id).toBe("out-123")
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          client_id: "client-1",
          skill_id: "hook-writer",
          title: "Daftar Hook",
          content: "1. Rahasia seduh teh Ciwidey",
        })
      )
      expect(mockUpsertClientSkills).toHaveBeenCalledWith(
        expect.objectContaining({
          client_id: "client-1",
          skill_id: "hook-writer",
          status: "selesai",
        }),
        expect.anything()
      )
    })

    it("auto-syncs brand-profile output to client_files and clients.brand_profile", async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: { id: "out-bp-1" }, error: null })
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
      const mockUpsertClientSkills = vi.fn().mockResolvedValue({ error: null })
      const mockUpsertClientFiles = vi.fn().mockResolvedValue({ error: null })
      const mockClientMaybeSingle = vi.fn().mockResolvedValue({
        data: { brand_profile: { who: "Old Taraju", audience: "Old Audience" } },
        error: null,
      })
      const mockClientUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })

      mockServiceFrom.mockImplementation((table: string) => {
        if (table === "skill_outputs") {
          return { insert: mockInsert }
        }
        if (table === "client_skills") {
          return { upsert: mockUpsertClientSkills }
        }
        if (table === "client_files") {
          return { upsert: mockUpsertClientFiles }
        }
        if (table === "clients") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: mockClientMaybeSingle,
              }),
            }),
            update: mockClientUpdate,
          }
        }
        return {}
      })

      const bpContent = `# Brand Profile — Taraju
## Identity
Produsen teh organik artisan Jawa Barat

## Positioning
100% dipetik tangan

## Voice
Hangat dan bersahabat
`

      const res = await saveSkillOutput({
        clientId: "client-1",
        skillId: "brand-profile",
        title: "Brand Profile Final",
        content: bpContent,
      })

      expect(res.success).toBe(true)
      expect(mockUpsertClientFiles).toHaveBeenCalledWith(
        expect.objectContaining({
          client_id: "client-1",
          path: "brand-profile.md",
          content: bpContent,
        }),
        { onConflict: "client_id,path" }
      )
      expect(mockClientUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          brand_profile: expect.objectContaining({
            who: "Produsen teh organik artisan Jawa Barat",
            identity: "Produsen teh organik artisan Jawa Barat",
            positioning: "100% dipetik tangan",
            voice: "Hangat dan bersahabat",
          }),
        })
      )
    })

    it("auto-syncs voice-builder output to client_files/voice.md", async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: { id: "out-voice-1" }, error: null })
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
      const mockUpsertClientSkills = vi.fn().mockResolvedValue({ error: null })
      const mockUpsertClientFiles = vi.fn().mockResolvedValue({ error: null })

      mockServiceFrom.mockImplementation((table: string) => {
        if (table === "skill_outputs") {
          return { insert: mockInsert }
        }
        if (table === "client_skills") {
          return { upsert: mockUpsertClientSkills }
        }
        if (table === "client_files") {
          return { upsert: mockUpsertClientFiles }
        }
        return {}
      })

      const voiceContent = "# Brand Voice\nHangat dan solutif (verify-quarterly)"
      const res = await saveSkillOutput({
        clientId: "client-1",
        skillId: "voice-builder",
        title: "Voice Guide",
        content: voiceContent,
      })

      expect(res.success).toBe(true)
      expect(mockUpsertClientFiles).toHaveBeenCalledWith(
        expect.objectContaining({
          client_id: "client-1",
          path: "voice.md",
          content: voiceContent,
          needs_verification: true,
        }),
        { onConflict: "client_id,path" }
      )
    })

    it("auto-syncs audience-research output to client_files/audience.md", async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: { id: "out-aud-1" }, error: null })
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
      const mockUpsertClientSkills = vi.fn().mockResolvedValue({ error: null })
      const mockUpsertClientFiles = vi.fn().mockResolvedValue({ error: null })

      mockServiceFrom.mockImplementation((table: string) => {
        if (table === "skill_outputs") return { insert: mockInsert }
        if (table === "client_skills") return { upsert: mockUpsertClientSkills }
        if (table === "client_files") return { upsert: mockUpsertClientFiles }
        return {}
      })

      const audienceContent = "# Audience Research\n## Jobs-to-be-Done\nDrink fresh organic tea"
      const res = await saveSkillOutput({
        clientId: "client-1",
        skillId: "audience-research",
        title: "Audience Persona",
        content: audienceContent,
      })

      expect(res.success).toBe(true)
      expect(mockUpsertClientFiles).toHaveBeenCalledWith(
        expect.objectContaining({
          client_id: "client-1",
          path: "audience.md",
          content: audienceContent,
        }),
        { onConflict: "client_id,path" }
      )
    })

    it("auto-syncs social-strategy output to client_files/social-strategy.md", async () => {
      const mockSingle = vi.fn().mockResolvedValue({ data: { id: "out-strat-1" }, error: null })
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
      const mockUpsertClientSkills = vi.fn().mockResolvedValue({ error: null })
      const mockUpsertClientFiles = vi.fn().mockResolvedValue({ error: null })

      mockServiceFrom.mockImplementation((table: string) => {
        if (table === "skill_outputs") return { insert: mockInsert }
        if (table === "client_skills") return { upsert: mockUpsertClientSkills }
        if (table === "client_files") return { upsert: mockUpsertClientFiles }
        return {}
      })

      const strategyContent = "# Social Strategy\n## Primary Channel\nInstagram"
      const res = await saveSkillOutput({
        clientId: "client-1",
        skillId: "social-strategy",
        title: "Strategy Document",
        content: strategyContent,
      })

      expect(res.success).toBe(true)
      expect(mockUpsertClientFiles).toHaveBeenCalledWith(
        expect.objectContaining({
          client_id: "client-1",
          path: "social-strategy.md",
          content: strategyContent,
        }),
        { onConflict: "client_id,path" }
      )
    })
  })
})

