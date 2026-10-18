import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  getClientFiles,
  getClientFile,
  upsertClientFile,
  verifyClientFile,
  deleteClientFile,
} from "./service"
import { markdownToBrandProfile, compileBrandContext, brandProfileToMarkdown } from "@/lib/brand-context"
import { createClient } from "@/lib/supabase/server"

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

vi.mock("@/lib/audit/log", () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}))

describe("brand-files service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("markdownToBrandProfile", () => {
    it("parses all sections of brand-profile.md correctly", () => {
      const markdown = `# Brand Profile

## Who We Are
PT Taraju Mandiri adalah produsen teh organik Jawa Barat.

## Audience Persona
Penikmat teh artisan usia 25-45 tahun.

## Voice & Guardrails
### Tone of Voice
Hangat, bersahabat, dan edukatif.

### Point of View
Teh bukan sekadar minuman, melainkan ritual ketenangan.

### Proof & Credibility
Sertifikasi Organik Indonesia, 50.000+ pelanggan.

### Do's and Don'ts (Guardrails)
Dilarang klaim menyembuhkan penyakit medis.

## Content Pillars
- Edukasi Manfaat Teh
- Cerita Petani Kebun
- Resep Seduh Teh Modern
- Promo Musiman
`
      const parsed = markdownToBrandProfile(markdown)
      expect(parsed.who).toBe("PT Taraju Mandiri adalah produsen teh organik Jawa Barat.")
      expect(parsed.audience).toBe("Penikmat teh artisan usia 25-45 tahun.")
      expect(parsed.voice).toBe("Hangat, bersahabat, dan edukatif.")
      expect(parsed.pov).toBe("Teh bukan sekadar minuman, melainkan ritual ketenangan.")
      expect(parsed.proof).toBe("Sertifikasi Organik Indonesia, 50.000+ pelanggan.")
      expect(parsed.guardrails).toBe("Dilarang klaim menyembuhkan penyakit medis.")
      expect(parsed.pillars).toEqual([
        "Edukasi Manfaat Teh",
        "Cerita Petani Kebun",
        "Resep Seduh Teh Modern",
        "Promo Musiman",
      ])
    })

    it("handles partial markdown gracefully", () => {
      const markdown = `## Who We Are\nHanya teks perkenalan saja.`
      const parsed = markdownToBrandProfile(markdown)
      expect(parsed.who).toBe("Hanya teks perkenalan saja.")
      expect(parsed.audience).toBeUndefined()
      expect(parsed.pillars).toBeUndefined()
    })
  })

  describe("brandProfileToMarkdown & round-trip", () => {
    it("renders canonical markdown and achieves lossless round-trip parse", () => {
      const original = {
        who: "Pawon Sengon adalah resto kuliner khas Jawa Timur.",
        audience: "Keluarga dan pecinta kuliner nusantara.",
        voice: "Hangat, ramah, dan berselera.",
        pov: "Masakan rumah ibu adalah warisan terbaik.",
        proof: "Berdiri sejak 2012, 100.000+ porsi terjual.",
        guardrails: "Jangan gunakan istilah terlalu teknis.",
        pillars: ["Menu Favorit", "Resep Warisan", "Promo Akhir Pekan"],
      }

      const md = brandProfileToMarkdown(original)
      expect(md).toContain("## Identity\nPawon Sengon adalah resto kuliner khas Jawa Timur.")
      expect(md).toContain("## Voice\nHangat, ramah, dan berselera.")
      expect(md).toContain("## Content Pillars\n- Menu Favorit\n- Resep Warisan\n- Promo Akhir Pekan")

      const roundTrip = markdownToBrandProfile(md)
      expect(roundTrip.who).toBe(original.who)
      expect(roundTrip.audience).toBe(original.audience)
      expect(roundTrip.voice).toBe(original.voice)
      expect(roundTrip.pov).toBe(original.pov)
      expect(roundTrip.proof).toBe(original.proof)
      expect(roundTrip.guardrails).toBe(original.guardrails)
      expect(roundTrip.pillars).toEqual(original.pillars)
    })
  })

  describe("compileBrandContext", () => {
    it("combines the 4 foundation files with standard headers", () => {
      const files = {
        "brand-profile.md": "# Brand Profile\nTeh Taraju",
        "voice.md": "Gaya bahasa santai.",
        "content-pillars.md": "- Pilar 1\n- Pilar 2",
        "guardrails.md": "Dilarang hoax.",
      }

      const combined = compileBrandContext("Taraju", files)
      expect(combined).toContain("# Brand Profile\nTeh Taraju")
      expect(combined).toContain("## Brand Voice & Tone Guide\nGaya bahasa santai.")
      expect(combined).toContain("## Content Pillars & Focus Areas\n- Pilar 1\n- Pilar 2")
      expect(combined).toContain("## Brand Guardrails & Never-List\nDilarang hoax.")
    })

    it("provides fallback if brand-profile.md is absent", () => {
      const combined = compileBrandContext("Pawon Sengon", {})
      expect(combined).toContain("# Brand Profile — Pawon Sengon")
      expect(combined).toContain("(belum ada brand-profile.md; buat dulu sebelum skill lain dijalankan)")
    })
  })

  describe("getClientFiles", () => {
    it("returns list of files from supabase", async () => {
      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockOrder = vi.fn().mockResolvedValue({
        data: [{ client_id: "c-1", path: "brand-profile.md", content: "# Hello" }],
        error: null,
      })

      const mockSupabase = {
        from: vi.fn(() => ({
          select: mockSelect,
          eq: mockEq,
          order: mockOrder,
        })),
      }
      ;(createClient as any).mockResolvedValue(mockSupabase)

      const files = await getClientFiles("c-1")
      expect(files).toHaveLength(1)
      expect(files[0].path).toBe("brand-profile.md")
    })
  })

  describe("upsertClientFile", () => {
    it("auto-detects (verify-quarterly) and sets needs_verification: true", async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: {
          client_id: "c-1",
          path: "guardrails.md",
          content: "Harga berlaku (verify-quarterly)",
          needs_verification: true,
        },
        error: null,
      })
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
      const mockUpsert = vi.fn().mockReturnValue({ select: mockSelect })

      const mockSupabase = {
        from: vi.fn((table: string) => {
          if (table === "client_files") {
            return { upsert: mockUpsert }
          }
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
            update: vi.fn().mockReturnThis(),
          }
        }),
      }
      ;(createClient as any).mockResolvedValue(mockSupabase)

      const result = await upsertClientFile({
        clientId: "c-1",
        path: "guardrails.md",
        content: "Harga berlaku (verify-quarterly)",
      })

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          needs_verification: true,
        }),
        expect.anything()
      )
      expect(result.needs_verification).toBe(true)
    })
  })

  describe("deleteClientFile", () => {
    it("throws error if attempting to delete brand-profile.md", async () => {
      await expect(
        deleteClientFile({ clientId: "c-1", path: "brand-profile.md" })
      ).rejects.toThrow("brand-profile.md adalah file inti brand dan tidak boleh dihapus.")
    })
  })

  describe("verifyClientFile", () => {
    it("updates needs_verification to false", async () => {
      const mockEq2 = vi.fn().mockResolvedValue({ error: null })
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq1 })

      const mockSupabase = {
        from: vi.fn(() => ({
          update: mockUpdate,
        })),
      }
      ;(createClient as any).mockResolvedValue(mockSupabase)

      await verifyClientFile({ clientId: "c-1", path: "guardrails.md" })
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          needs_verification: false,
        })
      )
    })
  })
})
