import type {
  GenerateReelsScriptInput,
  GenerateReelsScriptResponse,
  ReelBeat,
  ReelsScriptResult,
} from './types'

export async function generateReelsScript(
  input: GenerateReelsScriptInput
): Promise<GenerateReelsScriptResponse> {
  const {
    clientId,
    topic,
    clientName = 'Brand',
    goal = 'reach',
    lengthTier = '15-30s',
    audioType = 'original_voice',
    specificAngle,
  } = input

  if (!topic || topic.trim().length === 0) {
    return {
      success: false,
      error: 'Harap masukkan topik atau tema video Reel.',
    }
  }

  const cleanTopic = topic.trim()
  const primaryKw = cleanTopic.toLowerCase()

  const beats: ReelBeat[] = [
    {
      timecode: '0:00 - 0:03',
      beatName: '3-Second Hook (Sound-Off First)',
      visualShot: `Close-up dinamis aksi utama ${cleanTopic}. Jangan ada jeda intro atau logo brand. Gerakan langsung dimulai di frame 1.`,
      veoPrompt: `Cinematic macro shot of hands preparing ${cleanTopic}, morning natural light, 4k 60fps vertical 9:16, dynamic movement without pause.`,
      onScreenText: `Hal yang 90% orang keliru tentang ${cleanTopic}`,
      spokenAudio: `Kalau kamu masih melakukan ${cleanTopic} dengan cara biasa, berhenti sebentar.`,
      audioCue: 'Whoosh SFX + suara ketukan tegas',
    },
    {
      timecode: '0:03 - 0:08',
      beatName: 'The Problem & Friction Loop',
      visualShot: 'Potong cepat (cut) ke masalah nyata yang sering dihadapi. Ekspresi frustrasi ringan atau perbandingan hasil yang gagal.',
      veoPrompt: `Split-screen comparison showing failed attempt vs correct result of ${cleanTopic}, clean modern studio aesthetic.`,
      onScreenText: 'Kenapa cara lama bikin rugi waktu & hasil hambar',
      spokenAudio: `Kebanyakan orang buang waktu berjam-jam karena melewatkan satu langkah krusial ini.`,
      audioCue: 'Downtempo beat kick-in',
    },
    {
      timecode: '0:08 - 0:18',
      beatName: 'Core Value & The Shift (The Discovery)',
      visualShot: `Tunjukkan teknik / produk / langkah solutif ${clientName} secara runtut (step 1 & step 2). Teks angka muncul tepat saat tindakan dilakukan.`,
      veoPrompt: `Smooth camera panning over step-by-step process of ${cleanTopic}, crisp aesthetic, warm color grading.`,
      onScreenText: 'Langkah 1: Jangan sentuh ini. Langkah 2: Fokus pada detail ini.',
      spokenAudio: `Cukup ubah urutannya: lakukan ini dulu, baru lanjutkan. Hasilnya langsung terlihat beda 180 derajat.`,
      audioCue: 'Uplifting ambient swell',
    },
    {
      timecode: '0:18 - 0:26',
      beatName: 'Proof & Sensory Payoff',
      visualShot: 'Tampilan hasil sempurna dengan kepulan uap, tekstur jelas, atau senyuman puas. Bukti nyata bahwa teknik ini berhasil.',
      veoPrompt: `Hero beauty shot of the finalized ${cleanTopic}, steam rising, warm inviting lighting, commercial grade.`,
      onScreenText: 'Hasilnya: konsisten setiap hari tanpa trial-error',
      spokenAudio: `Kamu dapat hasil yang jauh lebih konsisten tanpa harus tebak-tebak lagi.`,
      audioCue: 'Subtle chime ring',
    },
    {
      timecode: '0:26 - 0:30',
      beatName: 'Loop Closer & Single Action CTA',
      visualShot: 'Kembali ke frame pertama atau tatapan ramah ke kamera, mengarahkan jari ke caption atau ikon simpan.',
      onScreenText: 'Simpan video ini buat dicoba akhir pekan nanti',
      spokenAudio: `Simpan video ini biar tidak hilang saat kamu butuh nanti.`,
      audioCue: 'Audio loop tail seamless connecting to frame 1',
    },
  ]

  const result: ReelsScriptResult = {
    title: `Reel Blueprint: Rahasia ${cleanTopic} (${clientName})`,
    conceptOneIdea: `Satu ide inti: Memperbaiki kesalahan umum dalam ${cleanTopic} dengan 1 perubahan sederhana agar hemat waktu.`,
    goal,
    lengthTier,
    audioType,
    sendsQuestion: `Siapa yang akan mem-forward video ini ke siapa via DM dan kenapa? (Jawaban: Teman atau rekan kerja yang sering mengeluh soal ${cleanTopic} dan butuh solusi praktis tanpa teori rumit).`,
    coverFrameBrief: {
      gridSafeVisual: `Frame pada detik 0:02 atau foto khusus dengan subjek di tengah rasio 1:1 safe-zone, latar belakang bersih.`,
      centerBoldText: `Rahasia ${cleanTopic.slice(0, 24)}`,
    },
    instagramSeo: {
      primaryKeyword: primaryKw,
      secondaryKeywords: [`tips ${primaryKw}`, `cara ${primaryKw}`, `tutorial ${primaryKw}`],
      captionOpener: `Cara terbaik untuk ${cleanTopic} tanpa harus buang waktu trial error. Selengkapnya di bawah ini:`,
    },
    audioNotes:
      audioType === 'trending_audio_in_app'
        ? 'PENTING: Audio tren berlisensi Instagram WAJIB ditambahkan secara manual di dalam aplikasi Instagram saat upload (bukan via API pihak ketiga) untuk menjaga jangkauan algoritma.'
        : 'Gunakan suara asli narator (original voice) dengan artikulasi jelas dan mic clip-on bersih untuk membangun otoritas personal.',
    beats,
  }

  return {
    success: true,
    data: result,
  }
}
