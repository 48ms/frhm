import { describe, it, expect } from "vitest"
import {
  markdownToBrandProfile,
  brandProfileToMarkdown,
  compileBrandContext,
} from "./brand-context"

describe("brand-context helpers", () => {
  describe("markdownToBrandProfile with upstream Social-Media-Skills canonical format", () => {
    it("parses all 10 canonical sections properly", () => {
      const canonicalMd = `# Brand Profile — Taraju Artisan Tea
<!-- version: 1.0 · last updated: 2026-10-18 -->

## Identity
- **What it is:** Produsen teh organik artisan Jawa Barat
- **Category:** Artisan Beverages
- **Founded / location:** Ciwidey, Bandung

## Positioning
- **What's different:** 100% dipetik tangan langsung dari kebun single-origin.
- **Why believe it:** Sertifikasi Organik Indonesia dan Rainforest Alliance.
- **Point of view:** Teh adalah ritual ketenangan jiwa di tengah hiruk pikuk kota.
- **Won't say:** Teh pelangsing instan atau obat mujarab.

## Audience
### Segment 1 — Penikmat Teh & Wellness
- **Who:** Profesional urban usia 25-45 tahun.
- **Cares about:** Ketenangan pikiran, kesehatan alami, mindfulness.
- **Where:** Instagram, Threads.

## Voice
- **Dimensions:** Formality 3/5 · Warmth 5/5 · Authority 4/5 · Energy 3/5 · Humor 2/5 · Polish 4/5
- **We sound:** Hangat, bersahabat, kontemplatif, never menggurui atau agresif.
- **Words we use:** Ritual, seduhan, ketenangan, aroma, kebun Ciwidey.
- **Words we ban:** Instan, diskon gila-gilaan, termurah, viral.

## Proof
- **Numbers:** 50.000+ pelanggan, 12 mitra kebun lokal.
- **Credentials:** Juara 1 Indonesian Tea Competition 2024.

## Offers & CTAs
- **Primary CTA:** Pesan paket cicip teh kurasi bulan ini via tautan di bio.
- **Secondary CTAs:** Simpan tips menyeduh ini, bagikan ke sesama pencinta teh.

## Channels
- Instagram: @tarajutea (feed harian & reels seduh)
- TikTok: @tarajutea (ASMR proses sangrai)

## Operational defaults
- **AI policy:** AI digunakan untuk perumusan draf awal; kurasi tone dan foto riil oleh tim in-house.
- **Accessibility:** Alt text deskriptif untuk setiap visual cangkir teh.

## Guardrails
- Dilarang membuat klaim kesehatan medis tanpa rujukan lab.
- Jangan pernah membandingkan kualitas kebun lain secara negatif.

## Show, don't tell — example posts
- **Loves:** Video 30 detik tanpa musik, hanya suara air mendidih dan daun teh merekah.
- **Hates:** Konten hard-selling dengan teks huruf kapital berlebihan.

## Notes
- Musim panen teh putih (White Tea) dimulai pertengahan November.

## Content Pillars
- Edukasi Seduhan Sempurna
- Di Balik Layar Kebun Ciwidey
- Cerita Komunitas & Mindfulness
- Rilisan Teh Musiman
`

      const parsed = markdownToBrandProfile(canonicalMd)

      expect(parsed.identity).toContain("Produsen teh organik artisan Jawa Barat")
      expect(parsed.who).toContain("Produsen teh organik artisan Jawa Barat")

      expect(parsed.positioning).toContain("100% dipetik tangan")
      expect(parsed.pov).toContain("100% dipetik tangan")

      expect(parsed.audience).toContain("Profesional urban usia 25-45 tahun")
      expect(parsed.voice).toContain("Hangat, bersahabat, kontemplatif")
      expect(parsed.proof).toContain("50.000+ pelanggan")
      expect(parsed.offers_ctas).toContain("Pesan paket cicip teh kurasi")
      expect(parsed.channels).toContain("Instagram: @tarajutea")
      expect(parsed.operational_defaults).toContain("AI digunakan untuk perumusan draf awal")
      expect(parsed.guardrails).toContain("Dilarang membuat klaim kesehatan medis")
      expect(parsed.examples).toContain("Video 30 detik tanpa musik")
      expect(parsed.notes).toContain("Musim panen teh putih")
      expect(parsed.pillars).toEqual([
        "Edukasi Seduhan Sempurna",
        "Di Balik Layar Kebun Ciwidey",
        "Cerita Komunitas & Mindfulness",
        "Rilisan Teh Musiman",
      ])
    })
  })

  describe("markdownToBrandProfile with legacy 6-section format", () => {
    it("parses legacy sections and mirrors to canonical fields", () => {
      const legacyMd = `# Brand Profile

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
      const parsed = markdownToBrandProfile(legacyMd)

      expect(parsed.who).toBe("PT Taraju Mandiri adalah produsen teh organik Jawa Barat.")
      expect(parsed.identity).toBe("PT Taraju Mandiri adalah produsen teh organik Jawa Barat.")
      expect(parsed.audience).toBe("Penikmat teh artisan usia 25-45 tahun.")
      expect(parsed.voice).toBe("Hangat, bersahabat, dan edukatif.")
      expect(parsed.pov).toBe("Teh bukan sekadar minuman, melainkan ritual ketenangan.")
      expect(parsed.positioning).toBe("Teh bukan sekadar minuman, melainkan ritual ketenangan.")
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
      const partialMd = `## Who We Are\nHanya teks perkenalan saja.`
      const parsed = markdownToBrandProfile(partialMd)
      expect(parsed.who).toBe("Hanya teks perkenalan saja.")
      expect(parsed.identity).toBe("Hanya teks perkenalan saja.")
      expect(parsed.audience).toBeUndefined()
      expect(parsed.pillars).toBeUndefined()
    })
  })

  describe("brandProfileToMarkdown & round-trip", () => {
    it("renders canonical 10-pillar markdown and achieves lossless round-trip parse", () => {
      const original = {
        who: "Pawon Sengon adalah resto kuliner khas Jawa Timur.",
        identity: "Pawon Sengon adalah resto kuliner khas Jawa Timur.",
        audience: "Keluarga dan pecinta kuliner nusantara.",
        voice: "Hangat, ramah, dan berselera.",
        pov: "Masakan rumah ibu adalah warisan terbaik.",
        positioning: "Masakan rumah ibu adalah warisan terbaik.",
        proof: "Berdiri sejak 2012, 100.000+ porsi terjual.",
        offers_ctas: "Kunjungi outlet terdekat atau reservasi meja melalui WhatsApp.",
        channels: ["Instagram: @pawonsengon", "TikTok: @pawonsengon"],
        operational_defaults: "Foto makanan otentik tanpa filter berlebihan.",
        guardrails: "Jangan gunakan istilah terlalu teknis.",
        examples: "Loves: Video masak rawon khas nenek.",
        notes: "Bulan puasa ada paket sahur khusus.",
        pillars: ["Menu Favorit", "Resep Warisan", "Promo Akhir Pekan"],
      }

      const md = brandProfileToMarkdown(original, "Pawon Sengon")

      expect(md).toContain("# Brand Profile — Pawon Sengon")
      expect(md).toContain("## Identity\nPawon Sengon adalah resto kuliner khas Jawa Timur.")
      expect(md).toContain("## Positioning\nMasakan rumah ibu adalah warisan terbaik.")
      expect(md).toContain("## Audience\nKeluarga dan pecinta kuliner nusantara.")
      expect(md).toContain("## Voice\nHangat, ramah, dan berselera.")
      expect(md).toContain("## Proof\nBerdiri sejak 2012, 100.000+ porsi terjual.")
      expect(md).toContain("## Offers & CTAs\nKunjungi outlet terdekat atau reservasi meja melalui WhatsApp.")
      expect(md).toContain("## Channels\n- Instagram: @pawonsengon\n- TikTok: @pawonsengon")
      expect(md).toContain("## Operational defaults\nFoto makanan otentik tanpa filter berlebihan.")
      expect(md).toContain("## Guardrails\nJangan gunakan istilah terlalu teknis.")
      expect(md).toContain("## Show, don't tell — example posts\nLoves: Video masak rawon khas nenek.")
      expect(md).toContain("## Notes\nBulan puasa ada paket sahur khusus.")
      expect(md).toContain("## Content Pillars\n- Menu Favorit\n- Resep Warisan\n- Promo Akhir Pekan")

      const roundTrip = markdownToBrandProfile(md)
      expect(roundTrip.who).toBe(original.who)
      expect(roundTrip.identity).toBe(original.identity)
      expect(roundTrip.audience).toBe(original.audience)
      expect(roundTrip.voice).toBe(original.voice)
      expect(roundTrip.pov).toBe(original.pov)
      expect(roundTrip.positioning).toBe(original.positioning)
      expect(roundTrip.proof).toBe(original.proof)
      expect(roundTrip.offers_ctas).toBe(original.offers_ctas)
      expect(roundTrip.operational_defaults).toBe(original.operational_defaults)
      expect(roundTrip.guardrails).toBe(original.guardrails)
      expect(roundTrip.examples).toBe(original.examples)
      expect(roundTrip.notes).toBe(original.notes)
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

    it("includes audience, strategy, goals, and calendar when present", () => {
      const files = {
        "brand-profile.md": "# Brand Profile\nTeh Taraju",
        "voice.md": "Gaya bahasa santai.",
        "audience.md": "Audiens: penikmat kopi yang ingin beralih ke teh.",
        "social-strategy.md": "Fokus Instagram Reels dan TikTok.",
        "goals-and-kpis.md": "North Star: 500 repeat orders per bulan.",
        "content-calendar.md": "Posting 3x seminggu.",
      }

      const combined = compileBrandContext("Taraju", files)
      expect(combined).toContain("## Audience Research & Voice of Customer\nAudiens: penikmat kopi")
      expect(combined).toContain("## Social Media Strategy & Platform Choices\nFokus Instagram Reels")
      expect(combined).toContain("## Goals, SMART Targets & North Star Metrics\nNorth Star: 500 repeat orders")
      expect(combined).toContain("## Content Calendar & Recurring Cadence\nPosting 3x seminggu.")
    })

    it("provides fallback if brand-profile.md is absent", () => {
      const combined = compileBrandContext("Pawon Sengon", {})
      expect(combined).toContain("# Brand Profile — Pawon Sengon")
      expect(combined).toContain("(belum ada brand-profile.md; buat dulu sebelum skill lain dijalankan)")
    })

    it("automatically includes extra strategic playbook files in client_files", () => {
      const files = {
        "brand-profile.md": "# Brand Profile\nTeh Taraju",
        "competitor-analysis.md": "Kompetitor utama: Brand A & Brand B.",
        "hashtag-vault.md": "Pilihan hashtag: #TehLokal #ArtisanTea.",
      }

      const combined = compileBrandContext("Taraju", files)
      expect(combined).toContain("## Specialized Strategic Document: COMPETITOR ANALYSIS\nKompetitor utama: Brand A & Brand B.")
      expect(combined).toContain("## Specialized Strategic Document: HASHTAG VAULT\nPilihan hashtag: #TehLokal #ArtisanTea.")
    })
  })
})
