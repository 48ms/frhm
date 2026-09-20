export const INSIGHT_PROMPT_TEMPLATE = `Kamu adalah analis social media untuk agency Frhm. Client: {client_name}.
Periode: {period_start} – {period_end}. Campaign filter: {campaign_tag || "Semua"}.

DATA:
- Total posts: {total_posts}
- Total reach: {total_reach}
- Total engagement: {total_engagement}
- Engagement rate: {engagement_rate}%
- Campaign breakdown: {campaign_breakdown}
- Content mix ratio: {content_mix_ratio}
- Attribution funnel: {attribution_funnel}
- Creative fatigue flags: {creative_fatigue_flags}
- Competitor benchmarks: {competitor_benchmarks}
- Seasonal intelligence: {seasonal_context}
- Predictive forecast: {predictive_forecast}
- Top 3 posts by ER: {top3_posts}
- Bottom 3 posts by ER: {bottom3_posts}
- Week-over-week delta: {wow_delta}
- Month-over-month delta: {mom_delta}
- Sentiment summary: {sentiment_summary || "Tidak ada data komentar"}

INSTRUKSI:
Berikan 3 temuan ACTIONABLE untuk owner (Pak Adit / Bunda):
1. Work: apa yang harus dilanjutkan atau diperbanyak. Sertakan angka reach dan ER yang mendukung.
2. Tidak work: apa yang harus dihentikan atau diperbaiki. Sertakan data performa yang menunjukkan penurunan.
3. Aksi minggu depan: rekomendasi konkret (format, jam, hook, platform). Kuantifikabel dan bisa dieksekusi.
4. Gap kompetitor: bila data benchmark tersedia, bandingkan ER dan frekuensi posting client terhadap rata-rata kompetitor. Sebutkan gap dalam angka, bukan opini.
5. Momentum musiman: bila periode berada dalam window musiman, sebutkan peluang atau risiko berdasarkan impact multiplier yang tercatat.
6. Proyeksi & ROI: bila data forecast tersedia, sebutkan target pencapaian konkret minggu depan dan estimasi ROI multiplier berdasarkan tren historis dan faktor musiman.

Format: Markdown, bahasa Indonesia.
Gaya bahasa: profesional, presisi, to the point. Jujur. Jangan bertele-tele.
Dilarang: emoji, ikon, atau simbol dekoratif apa pun (🎯, 🚀, 💡, dll). Gunakan kata-kata yang jelas.
Jangan gunakan frasa seperti "berikut adalah", "dapat kami lihat", "secara keseluruhan", "sebagai kesimpulan".
Fokus pada fakta, anomali data, dan rekomendasi aksi konkret.
Maks 300 kata.` as const

export interface InsightContext {
  client_name: string
  period_start: string
  period_end: string
  campaign_tag: string | null
  total_posts: number
  total_reach: number
  total_engagement: number
  engagement_rate: number
  campaign_breakdown: string
  content_mix_ratio: string
  attribution_funnel: string
  creative_fatigue_flags: string
  competitor_benchmarks: string
  seasonal_context: string
  predictive_forecast: string
  top3_posts: string
  bottom3_posts: string
  wow_delta: string
  mom_delta: string
  sentiment_summary?: string
}

export function buildInsightPrompt(context: InsightContext): string {
  return INSIGHT_PROMPT_TEMPLATE
    .replace('{client_name}', context.client_name)
    .replace('{period_start}', context.period_start)
    .replace('{period_end}', context.period_end)
    .replace('{campaign_tag || "Semua"}', context.campaign_tag || 'Semua')
    .replace('{total_posts}', String(context.total_posts))
    .replace('{total_reach}', String(context.total_reach))
    .replace('{total_engagement}', String(context.total_engagement))
    .replace('{engagement_rate}', context.engagement_rate.toFixed(1))
    .replace('{campaign_breakdown}', context.campaign_breakdown)
    .replace('{content_mix_ratio}', context.content_mix_ratio)
    .replace('{attribution_funnel}', context.attribution_funnel)
    .replace('{creative_fatigue_flags}', context.creative_fatigue_flags)
    .replace('{competitor_benchmarks}', context.competitor_benchmarks)
    .replace('{seasonal_context}', context.seasonal_context)
    .replace('{predictive_forecast}', context.predictive_forecast)
    .replace('{top3_posts}', context.top3_posts)
    .replace('{bottom3_posts}', context.bottom3_posts)
    .replace('{wow_delta}', context.wow_delta)
    .replace('{mom_delta}', context.mom_delta)
    .replace('{sentiment_summary || "Tidak ada data komentar"}', context.sentiment_summary || 'Tidak ada data komentar')
}