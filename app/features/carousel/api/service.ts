import type {
  CarouselResult,
  CarouselSlide,
  GenerateCarouselInput,
  GenerateCarouselResponse,
} from './types'

export async function generateCarousel(
  input: GenerateCarouselInput
): Promise<GenerateCarouselResponse> {
  const {
    clientId,
    clientName = 'Brand',
    topic,
    structure = 'how_to',
    platform = 'instagram',
    targetSlideCount = 6,
    painPointOrTakeaway,
  } = input

  if (!topic || topic.trim().length === 0) {
    return {
      success: false,
      error: 'Harap masukkan topik panduan atau konten carousel.',
    }
  }

  const cleanTopic = topic.trim()
  const detail = painPointOrTakeaway?.trim()

  const slides: CarouselSlide[] = [
    // Slide 1: Cover (Hook + Promise)
    {
      slideNumber: 1,
      slideRole: 'cover',
      headline: detail
        ? `Cara Benar ${cleanTopic}: Dari ${detail} Menjadi Konsisten`
        : `Panduan Praktis ${cleanTopic} yang Sebenarnya Berhasil`,
      subhead: 'Geser ke kanan untuk 4 langkah konkret yang bisa langsung dipraktikkan →',
      visualLayoutDirection: 'Desain minimalis, latar warna netral HSL brand, teks judul kontras tebal di tengah, ikon panah swipe di kanan bawah.',
      ideogramPrompt: `Minimalist modern graphic cover, bold centered typography reading "${cleanTopic}", warm clean background, professional agency aesthetic, 4k 1080x1350 vertical aspect ratio.`,
    },
    // Slide 2: Mistake / Friction
    {
      slideNumber: 2,
      slideRole: 'content',
      headline: '01. Kesalahan Pertama: Mulai Tanpa Fondasi',
      subhead: 'Banyak orang terburu-buru mengejar hasil instan tanpa memahami variabel penentu.',
      takeawayBullet: 'Kunci: Catat 1 metrik utama sebelum mengambil tindakan.',
      visualLayoutDirection: 'Satu diagram sederhana atau ikon silang merah halus, teks maksimal 2 baris agar terbaca di layar ponsel.',
      ideogramPrompt: `Clean infographic card with step 01 header, bold sans-serif text, ample negative space, modern editorial layout, 1080x1350.`,
    },
    // Slide 3: The Golden Rule
    {
      slideNumber: 3,
      slideRole: 'content',
      headline: '02. Aturan Emas: Konsistensi Mengalahkan Intensitas',
      subhead: 'Melakukan hal benar 15 menit setiap hari jauh lebih berdampak dibanding 5 jam seminggu sekali.',
      takeawayBullet: 'Kunci: Buat ritual kecil yang tidak mungkin Anda batalkan.',
      visualLayoutDirection: 'Grafik batang atau perbandingan sebelum vs sesudah yang kontras dan bersih.',
      ideogramPrompt: `Clean comparison diagram with step 02 header, elegant typography, warm brand accent, 1080x1350.`,
    },
    // Slide 4: Practical Action
    {
      slideNumber: 4,
      slideRole: 'content',
      headline: '03. Eksekusi Teknis: Terapkan Rumus 80/20',
      subhead: 'Fokuskan 80% energi pada 20% faktor yang menghasilkan rasa dan kepuasan tertinggi.',
      takeawayBullet: 'Kunci: Eliminasi 3 langkah tambahan yang tidak memberikan nilai nyata.',
      visualLayoutDirection: 'Checklist box dengan centang hijau halus, layout lega tanpa dinding paragraf padat.',
      ideogramPrompt: `Minimalist checklist card with step 03 header, modern aesthetic, high contrast legible typography, 1080x1350.`,
    },
    // Slide 5: Summary / Payoff
    {
      slideNumber: 5,
      slideRole: 'summary',
      headline: 'Rangkuman Intisari Singkat',
      subhead: '1. Pahami variabel utama\n2. Bangun ritual konsisten\n3. Eliminasi langkah mubazir',
      takeawayBullet: 'Hasilnya: Kualitas meningkat drastis tanpa rasa stres.',
      visualLayoutDirection: 'Kotak kartu sorotan (highlight card) dengan ringkasan 3 poin vertikal berjarak longgar.',
      ideogramPrompt: `Summary takeaway card with 3 numbered bullets, premium editorial magazine aesthetic, 1080x1350.`,
    },
    // Slide 6: Single-Action Save CTA
    {
      slideNumber: 6,
      slideRole: 'cta',
      headline: 'Simpan Postingan Ini untuk Nanti',
      subhead: `Ketuk ikon pita (bookmark) agar tidak hilang saat Anda ingin mempraktikkan ${cleanTopic} bersama tim.`,
      takeawayBullet: `Bagikan ke rekan yang sedang menghadapi kendala serupa.`,
      visualLayoutDirection: 'Ikon simpan besar di tengah, teks ajakan bertindak tunggal tanpa tautan eksternal yang membingungkan.',
      ideogramPrompt: `Call to action card with prominent save bookmark icon, elegant clean background, clear focus, 1080x1350.`,
    },
  ]

  const result: CarouselResult = {
    title: `Carousel Storyboard: ${cleanTopic} (${clientName})`,
    oneIdeaSpine: `Satu ide inti: Membimbing audiens memahami langkah esensial ${cleanTopic} secara runtut per slide tanpa kelebihan beban informasi.`,
    structure,
    platform,
    slideCount: slides.length,
    coverPromise: slides[0].headline,
    slides,
    singleActionCta: 'Simpan postingan ini (Bookmark) untuk dibaca kembali saat praktik.',
    suggestedCaption: `Banyak yang merasa ${cleanTopic} itu rumit. Padahal jika dipecah ke 3 prinsip sederhana ini, segalanya jadi jauh lebih mudah.\n\nGeser ke samping (swipe) untuk rangkuman visual lengkapnya 👉\n\nSimpan postingan ini agar tidak lupa saat Anda membutuhkannya nanti.`,
  }

  return {
    success: true,
    data: result,
  }
}
