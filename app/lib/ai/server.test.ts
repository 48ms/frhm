import { describe, it, expect, vi, beforeEach } from "vitest"
import { loadClientFiles, brandContext } from "./server"

const mockServiceFrom = vi.fn()

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

describe("lib/ai/server", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("brandContext", () => {
    it("compiles full brand context across all present documents", () => {
      const files = {
        "brand-profile.md": "## Identity\nTeh Organik Ciwidey",
        "voice.md": "## Voice\nHangat dan menenangkan",
        "content-pillars.md": "- Resep Seduhan\n- Edukasi",
        "guardrails.md": "Dilarang klaim medis",
      }

      const res = brandContext("Taraju", files)
      expect(res).toContain("## Identity\nTeh Organik Ciwidey")
      expect(res).toContain("## Brand Voice & Tone Guide\n## Voice\nHangat dan menenangkan")
      expect(res).toContain("## Content Pillars & Focus Areas\n- Resep Seduhan\n- Edukasi")
      expect(res).toContain("## Brand Guardrails & Never-List\nDilarang klaim medis")
    })

    it("handles empty files gracefully with placeholder for brand-profile.md", () => {
      const res = brandContext("Pawon Sengon", {})
      expect(res).toContain("# Brand Profile — Pawon Sengon")
      expect(res).toContain("(belum ada brand-profile.md; buat dulu sebelum skill lain dijalankan)")
    })
  })

  describe("loadClientFiles", () => {
    it("returns client_files directly when all files are present", async () => {
      mockServiceFrom.mockImplementation((table: string) => {
        if (table === "client_files") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [
                  { path: "brand-profile.md", content: "# Profile" },
                  { path: "voice.md", content: "# Voice" },
                  { path: "content-pillars.md", content: "# Pillars" },
                  { path: "guardrails.md", content: "# Guardrails" },
                  { path: "audience.md", content: "# Audience" },
                ],
              }),
            }),
          }
        }
        return {}
      })

      const files = await loadClientFiles({} as any, "client-123")
      expect(files["brand-profile.md"]).toBe("# Profile")
      expect(files["voice.md"]).toBe("# Voice")
      expect(files["content-pillars.md"]).toBe("# Pillars")
      expect(files["guardrails.md"]).toBe("# Guardrails")
      expect(files["audience.md"]).toBe("# Audience")
    })

    it("falls back to clients.brand_profile for missing foundation documents", async () => {
      mockServiceFrom.mockImplementation((table: string) => {
        if (table === "client_files") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [], // empty client_files
              }),
            }),
          }
        }
        if (table === "clients") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    name: "Pawon Sengon",
                    brand_profile: {
                      who: "Restoran masakan rumahan Jawa",
                      voice: "Ramah seperti keluarga sendiri",
                      pillars: ["Resep Kuno", "Bahan Segar Pasar"],
                      guardrails: "Jangan gunakan MSG berlebih",
                    },
                  },
                }),
              }),
            }),
          }
        }
        return {}
      })

      const files = await loadClientFiles({} as any, "client-pawon")
      expect(files["brand-profile.md"]).toBeDefined()
      expect(files["brand-profile.md"]).toContain("Restoran masakan rumahan Jawa")
      expect(files["voice.md"]).toContain("Ramah seperti keluarga sendiri")
      expect(files["content-pillars.md"]).toContain("- Resep Kuno")
      expect(files["guardrails.md"]).toContain("Jangan gunakan MSG berlebih")
    })
  })
})
