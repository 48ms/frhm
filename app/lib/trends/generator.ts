import { chatJson, type Provider } from '@/lib/ai/providers'

export interface TrendHooks {
  contrarian: string
  story: string
  directValue: string
}

export interface GeneratedTrendContent {
  title: string
  hooks: TrendHooks
  body: string
  callToAction: string
  markdownContent: string
}

/**
 * Menghasilkan naskah konten tren dengan 3 variasi hook psikologis:
 * 1. Contrarian: Mematahkan mitos atau asumsi umum audiens.
 * 2. Story: Pendekatan narasi pengalaman nyata yang relatable.
 * 3. Direct Value: Langsung memberikan manfaat nyata atau solusi instan.
 */
export async function generateTrendContent(params: {
  trendTopic: string
  trendSnippet?: string
  angle?: string
  brandName: string
  brandProfile: string
  voiceGuide?: string
  provider?: Provider | null
  campaignTag?: string
}): Promise<GeneratedTrendContent> {
  const { trendTopic, trendSnippet, angle, brandName, brandProfile, voiceGuide, provider, campaignTag } = params

  if (provider && provider.api_key) {
    const systemPrompt = [
      `Anda adalah Senior Social Media Copywriter dan Creative Director berpengalaman.`,
      `Tugas Anda adalah membuat naskah konten media sosial (Instagram Reels / TikTok / Carousel) berdasarkan tren terkini dan brand profile klien.`,
      ``,
      `Wajib hasilkan 3 variasi hook pembuka berorientasi psikologis:`,
      `1. Contrarian: Mematahkan anggapan umum, membuka dengan kalimat tak terduga yang menghentikan scroll.`,
      `2. Story: Pendekatan narasi atau studi kasus mini yang menyentuh emosi atau empati audiens.`,
      `3. Direct Value: Kalimat langsung to-the-point yang menjanjikan solusi atau kepuasan instan.`,
      ``,
      `Panduan Penulisan:`,
      `- Jangan gunakan bahasa AI yang kaku atau berbunga-bunga. Gunakan gaya bahasa percakapan manusia yang natural dan tajam.`,
      `- Sesuaikan dengan panduan suara brand klien (Voice & Tone).`,
      `- Hindari tanda baca em dash. Gunakan titik dua (:), koma, atau tanda kurung bila diperlukan.`,
      ``,
      `Kembalikan HANYA JSON berformat:`,
      `{`,
      `  "title": "Judul konten yang menarik dan ringkas",`,
      `  "hooks": {`,
      `    "contrarian": "Kalimat hook contrarian",`,
      `    "story": "Kalimat hook story",`,
      `    "directValue": "Kalimat hook direct value"`,
      `  },`,
      `  "body": "Naskah utama atau narasi skrip visual (2-4 paragraf ringkas)",`,
      `  "callToAction": "Kalimat ajakan interaksi atau pembelian yang natural"`,
      `}`,
    ].join('\n')

    const userMessage = [
      `Brand: ${brandName}`,
      `Profil Brand:`,
      brandProfile,
      voiceGuide ? `Panduan Voice: ${voiceGuide}` : '',
      ``,
      `Topik Tren: ${trendTopic}`,
      trendSnippet ? `Konteks Tren: ${trendSnippet}` : '',
      angle ? `Sudut Pandang Direkomendasikan: ${angle}` : '',
    ].join('\n')

    try {
      const response = await chatJson<{
        title: string
        hooks: TrendHooks
        body: string
        callToAction: string
      }>(provider, systemPrompt, [{ role: 'user', content: userMessage }])

      if (response && response.title && response.hooks?.contrarian) {
        const markdownContent = buildMarkdownContent({
          title: response.title,
          trendTopic,
          angle,
          hooks: response.hooks,
          body: response.body,
          callToAction: response.callToAction,
          campaignTag,
        })

        return {
          title: response.title,
          hooks: response.hooks,
          body: response.body,
          callToAction: response.callToAction,
          markdownContent,
        }
      }
    } catch (err) {
      console.warn('[TrendGenerator] AI error, using structured fallback:', err)
    }
  }

  // Fallback konten terstruktur berkualitas tinggi jika AI tidak aktif
  return generateFallbackContent({
    trendTopic,
    angle,
    brandName,
  })
}

function buildMarkdownContent(data: {
  title: string
  trendTopic: string
  angle?: string
  hooks: TrendHooks
  body: string
  callToAction: string
  campaignTag?: string
}): string {
  const lines: string[] = [
    `# ${data.title}`,
    ``,
    `> **Konteks Tren:** ${data.trendTopic}`,
  ]

  if (data.angle) {
    lines.push(`> **Sudut Pandang:** ${data.angle}`)
  }

  if (data.campaignTag) {
    lines.push(`> **Kampanye:** ${data.campaignTag}`)
  }

  lines.push(
    ``,
    `---`,
    ``,
    `### Opsi Hook 1 (Contrarian)`,
    data.hooks.contrarian,
    ``,
    `### Opsi Hook 2 (Storytelling)`,
    data.hooks.story,
    ``,
    `### Opsi Hook 3 (Direct Value)`,
    data.hooks.directValue,
    ``,
    `---`,
    ``,
    `### Naskah Konten`,
    data.body,
    ``,
    `### Call to Action (CTA)`,
    data.callToAction
  )

  return lines.join('\n')
}

function generateFallbackContent(params: {
  trendTopic: string
  angle?: string
  brandName: string
  campaignTag?: string
}): GeneratedTrendContent {
  const { trendTopic, angle, brandName, campaignTag } = params
  const title = `Mengapa ${trendTopic} Bisa Bikin Kamu Berubah Pikiran?`

  const hooks: TrendHooks = {
    contrarian: `Banyak yang kira ${trendTopic} itu biasa saja, padahal kalau dilihat dari sudut pandang ${brandName}, ini titik baliknya.`,
    story: `Kemarin sempat ramai obrolan soal ${trendTopic}. Waktu kami coba telaah langsung di ${brandName}, ternyata dampaknya nyata banget.`,
    directValue: `Butuh cara simpel merespons ${trendTopic} tanpa ribet? Ini rahasianya langsung dari ${brandName}.`,
  }

  const body = [
    `Tren seputar "${trendTopic}" lagi ramai diperbincangkan di media sosial. Tapi jangan cuma ikut-ikutan tanpa memahami esensinya.`,
    ``,
    `Di ${brandName}, kami selalu mengutamakan kualitas otentik dan nilai yang nyata bagi pelanggan. Setiap detail diracik dengan cermat agar kamu mendapatkan pengalaman terbaik.`,
    ``,
    `Jadikan momen tren ini pengingat untuk memilih yang berkualitas, bukan sekadar yang viral sesaat.`,
  ].join('\n')

  const callToAction = `Bagikan pendapatmu di kolom komentar atau langsung mampir ke ${brandName} hari ini!`

  const markdownContent = buildMarkdownContent({
    title,
    trendTopic,
    angle,
    hooks,
    body,
    callToAction,
    campaignTag,
  })

  return {
    title,
    hooks,
    body,
    callToAction,
    markdownContent,
  }
}
