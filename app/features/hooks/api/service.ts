import type {
  GenerateHooksInput,
  GenerateHooksResponse,
  HookCandidate,
  HookFormat,
} from './types'

const CUTOFF_LIMITS: Record<HookFormat, number> = {
  caption: 125, // Instagram '...more' truncation limit
  video: 90, // On-screen text 3-second reading limit
  carousel_cover: 80, // Legible cover text limit
  thread_opener: 250, // Thread opener punchline limit
}

/**
 * Generate 4 distinct hooks across mechanisms adhering to upstream hook-writer rules:
 * - Curiosity Gap (opens a question stranger needs to close)
 * - Contrarian / Hot Take (challenges mainstream lazy advice)
 * - High Stakes / Specificity (uses numbers or real consequences)
 * - Relatable / Identity (hits a shared frustration of the target persona)
 */
export async function generateHooks(input: GenerateHooksInput): Promise<GenerateHooksResponse> {
  const { clientId, topic, format = 'caption', surprisingFactOrDetail } = input
  const cutoff = CUTOFF_LIMITS[format] || 125

  if (!topic || topic.trim().length === 0) {
    return {
      success: false,
      format,
      rawTopic: '',
      candidates: [],
      error: 'Harap masukkan konsep atau topik konten.',
    }
  }

  const cleanTopic = topic.trim()
  const detail = surprisingFactOrDetail?.trim()

  // Generate 4 candidates across mechanisms
  const candidates: HookCandidate[] = [
    {
      mechanism: 'curiosity_gap',
      mechanismLabel: 'Curiosity Gap (Kesenjangan Rasa Ingin Tahu)',
      text: detail
        ? `Ada alasan kenapa ${cleanTopic} kami lakukan dengan cara ${detail}. Kebanyakan orang baru sadar setelah rugi waktu.`
        : `90% orang keliru saat mencoba ${cleanTopic}. Ini satu hal kecil yang mengubah segalanya tanpa harus keluar biaya ekstra.`,
      characterCount: 0,
      cutoffLimit: cutoff,
      isInsideCutoff: false,
      whyItWorks: 'Membuka celah informasi yang belum terselesaikan sehingga audiens terdorong menekan tap "...selengkapnya".',
      isRecommended: true,
      recommendationRationale: 'Paling efektif untuk feed eksplorasi karena memicu klik tanpa membuat janji palsu (clickbait).',
      videoLayers: format === 'video' ? {
        visualShot: 'Close-up aksi langsung tanpa jeda pembuka, ekspresi fokus atau gerakan tangan memegang objek.',
        onScreenText: 'Hal kecil yang 90% orang keliru lakukan',
        spokenAudio: 'Jangan lakukan ini sebelum kamu tahu alasannya.',
      } : undefined,
    },
    {
      mechanism: 'contrarian',
      mechanismLabel: 'Contrarian / Hot Take (Melawan Arus)',
      text: `Berhenti ikuti tren ${cleanTopic} yang populer kalau Anda tidak mau kecewa. Cara lama ini justru jauh lebih tahan lama.`,
      characterCount: 0,
      cutoffLimit: cutoff,
      isInsideCutoff: false,
      whyItWorks: 'Menantang asumsi umum audiens, memicu perdebatan sehat dan dorongan membela atau menyimak argumen.',
      recommendationRationale: 'Kuat untuk menarik audiens ahli atau praktisi yang sudah lelah dengan saran generik.',
      videoLayers: format === 'video' ? {
        visualShot: 'Gelengkan kepala santai sambil menunjuk ke teks atau memperlihatkan kontras dua hasil.',
        onScreenText: 'Berhenti ikuti saran tren ini!',
        spokenAudio: 'Ada alasan kenapa saran populer ini justru keliru.',
      } : undefined,
    },
    {
      mechanism: 'high_stakes',
      mechanismLabel: 'High Stakes & Specificity (Angka & Bukti Nyata)',
      text: detail
        ? `Kami hemat 35% pengeluaran untuk ${cleanTopic} hanya dengan 1 perubahan di ${detail}. Ini catatannya.`
        : `Kesalahan sepele di ${cleanTopic} ini bisa membuang waktu 2 jam setiap hari. Ini cara kami menyelesaikannya.`,
      characterCount: 0,
      cutoffLimit: cutoff,
      isInsideCutoff: false,
      whyItWorks: 'Menyertakan metrik spesifik dan risiko nyata, membuat audiens merasa wajib menyimpan (save) konten ini.',
      recommendationRationale: 'Paling tinggi memicu tombol "Save" (simpan) karena bernilai referensi teknis yang tinggi.',
      videoLayers: format === 'video' ? {
        visualShot: 'Tampilan layar / kertas catatan dengan angka atau perbandingan sebelum vs sesudah yang jelas.',
        onScreenText: 'Hemat 35% dengan 1 perubahan ini',
        spokenAudio: 'Lihat selisih angka ini sebelum kamu mulai.',
      } : undefined,
    },
    {
      mechanism: 'relatable_identity',
      mechanismLabel: 'Relatable Identity (Relevansi Persona)',
      text: `Pernah merasa lelah saat urus ${cleanTopic} sendirian? Anda tidak sendiri, dan solusinya bukan kerja lebih keras.`,
      characterCount: 0,
      cutoffLimit: cutoff,
      isInsideCutoff: false,
      whyItWorks: 'Menghubungkan langsung ke rasa frustrasi emosional audiens sasaran sehingga mereka merasa didengar dan dipahami.',
      recommendationRationale: 'Memicu shares (sends DM) ke rekan kerja atau pasangan yang merasakan hal serupa.',
      videoLayers: format === 'video' ? {
        visualShot: 'Pandangan langsung ke kamera dengan tatapan simpatik atau gestur menyapa kawan dekat.',
        onScreenText: 'Kalau kamu merasa lelah dengan ini...',
        spokenAudio: 'Tenang, kamu bukan satu-satunya yang merasa begini.',
      } : undefined,
    },
  ]

  // Compute character counts and cutoff flags
  candidates.forEach((c) => {
    c.characterCount = c.text.length
    c.isInsideCutoff = c.characterCount <= c.cutoffLimit
  })

  return {
    success: true,
    format,
    rawTopic: cleanTopic,
    clientName: clientId,
    candidates,
    sendsQuestion: `Siapa yang akan membagikan hook '${cleanTopic}' ini ke rekannya via DM dan kenapa? (Jawaban: Rekan yang sedang menghadapi masalah teknis atau frustrasi yang sama).`,
  }
}
