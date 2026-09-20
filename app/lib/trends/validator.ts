import { chatJson, type Provider } from '@/lib/ai/providers'

export interface ThreeGatesResult {
  passed: boolean
  overallScore: number
  fitScore: number
  safetyScore: number
  timingScore: number
  reasoning: string
  recommendedAngle?: string
}

/**
 * Evaluasi ide tren terhadap brand klien menggunakan framework The Three Gates.
 * 1. FIT (0-100): Kesesuaian dengan DNA produk dan audiens.
 * 2. SAFETY (0-100): Bebas dari risiko blunder reputasi, isu sensitif, atau politis.
 * 3. TIMING (0-100): Status tren (sedang naik / rising vs basi / saturated).
 */
export async function evaluateThreeGates(params: {
  trendTopic: string
  trendSnippet?: string
  brandName: string
  brandProfile: string
  voiceGuide?: string
  provider?: Provider | null
}): Promise<ThreeGatesResult> {
  const { trendTopic, trendSnippet, brandName, brandProfile, voiceGuide, provider } = params

  if (!provider || !provider.api_key) {
    // Fallback evaluasi heuristik aman jika provider AI belum terkonfigurasi
    return evaluateHeuristic({ trendTopic, trendSnippet, brandProfile })
  }

  const systemPrompt = [
    `Anda adalah Senior Social Media Brand Strategist & Risk Officer.`,
    `Tugas Anda adalah mengevaluasi kelayakan sebuah tren media sosial untuk sebuah brand menggunakan kerangka "The Three Gates" (FIT, SAFETY, TIMING).`,
    ``,
    `Aturan Penilaian:`,
    `1. FIT (0-100): Apakah ada korelasi masuk akal antara tren dengan produk dan audiens brand? Bukan dipaksakan.`,
    `2. SAFETY (0-100): Hard No (< 30) untuk tragedi, isu SARA, politik polarisasi, gosip ofensif, atau tren yang membuat brand terlihat murahan/cringe. Wajib 80+ untuk lolos.`,
    `3. TIMING (0-100): Apakah tren ini sedang naik (rising) dan segar untuk dieksekusi?`,
    ``,
    `Ambang Batas Lolos (Passed): overallScore >= 70 DAN safetyScore >= 75 DAN fitScore >= 60.`,
    ``,
    `Kembalikan HANYA JSON berformat:`,
    `{`,
    `  "fitScore": number,`,
    `  "safetyScore": number,`,
    `  "timingScore": number,`,
    `  "overallScore": number,`,
    `  "passed": boolean,`,
    `  "reasoning": "penjelasan singkat 1-2 kalimat mengapa tren ini layak atau ditolak",`,
    `  "recommendedAngle": "sudut pandang unik brand jika lolos, atau alternatif jika ditolak"`,
    `}`,
  ].join('\n')

  const userMessage = [
    `Brand: ${brandName}`,
    `Profil Brand & Guardrails:`,
    brandProfile,
    voiceGuide ? `Panduan Voice: ${voiceGuide}` : '',
    ``,
    `Tren yang Diajukan:`,
    `Judul: ${trendTopic}`,
    trendSnippet ? `Detail: ${trendSnippet}` : '',
  ].join('\n')

  try {
    const result = await chatJson<ThreeGatesResult>(provider, systemPrompt, [
      { role: 'user', content: userMessage },
    ])

    if (result && typeof result.overallScore === 'number') {
      return {
        passed: Boolean(result.passed),
        overallScore: Math.round(result.overallScore),
        fitScore: Math.round(result.fitScore),
        safetyScore: Math.round(result.safetyScore),
        timingScore: Math.round(result.timingScore),
        reasoning: result.reasoning || 'Evaluasi The Three Gates selesai.',
        recommendedAngle: result.recommendedAngle,
      }
    }
  } catch (err) {
    console.warn('[ThreeGates] AI evaluation error, falling back to heuristic:', err)
  }

  return evaluateHeuristic({ trendTopic, trendSnippet, brandProfile })
}

/**
 * Fallback evaluasi aturan internal jika AI sedang offline
 */
function evaluateHeuristic(params: {
  trendTopic: string
  trendSnippet?: string
  brandProfile: string
}): ThreeGatesResult {
  const text = (params.trendTopic + ' ' + (params.trendSnippet || '')).toLowerCase()

  // Deteksi kata berisiko tinggi
  const sensitiveKeywords = ['politik', 'pemilu', 'skandal', 'kasus', 'korupsi', 'bencana', 'meninggal', 'kecelakaan', 'demo']
  const isSensitive = sensitiveKeywords.some((k) => text.includes(k))

  if (isSensitive) {
    return {
      passed: false,
      overallScore: 25,
      fitScore: 30,
      safetyScore: 20,
      timingScore: 50,
      reasoning: 'Tren terdeteksi memuat kata kunci sensitif atau berisiko tinggi bagi reputasi brand.',
      recommendedAngle: 'Hindari tren ini dan gunakan pilar konten edukasi atau behind the scenes reguler.',
    }
  }

  // Deteksi kecocokan kata kunci kuliner / lifestyle
  const fnbKeywords = ['kopi', 'coffee', 'makan', 'menu', 'kuliner', 'pedas', 'resep', 'minuman', 'resto', 'kafe', 'nongkrong']
  const isMatch = fnbKeywords.some((k) => text.includes(k))

  const fitScore = isMatch ? 85 : 65
  const safetyScore = 90
  const timingScore = 80
  const overallScore = Math.round((fitScore * 0.4) + (safetyScore * 0.4) + (timingScore * 0.2))

  return {
    passed: overallScore >= 70,
    overallScore,
    fitScore,
    safetyScore,
    timingScore,
    reasoning: isMatch
      ? 'Tren memiliki relevansi langsung dengan industri brand dan aman dieksekusi.'
      : 'Tren dapat diadaptasi dengan pendekatan analogi gaya hidup konsumen brand.',
    recommendedAngle: 'Gunakan format edukasi santai atau perbandingan rasa otentik.',
  }
}
