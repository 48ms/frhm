export interface TrendRadarItem {
  id: string
  title: string
  traffic?: string
  snippet?: string
  source: 'google_trends' | 'tiktok_inspiration' | 'curated_fnb'
  category: 'fnb' | 'lifestyle' | 'general'
  pubDate?: string
  url?: string
}

// Fallback tren industri F&B dan kopi Indonesia yang selalu relevan dan aktif
export const CURATED_FNB_TRENDS: TrendRadarItem[] = [
  {
    id: 'fnb-1',
    title: 'Manual Brew V60 vs Americano: Mana yang Lebih Sehat?',
    traffic: 'Rising ↗',
    snippet: 'Tren edukasi kopi hitam tanpa gula dan perbandingan acidity biji kopi lokal.',
    source: 'curated_fnb',
    category: 'fnb',
  },
  {
    id: 'fnb-2',
    title: 'Tren Kuliner Otentik Pedas Tradisional Nusantara',
    traffic: 'Rising ↗',
    snippet: 'Eksplorasi sambal olahan rempah segar tanpa pengawet yang disukai generasi muda.',
    source: 'curated_fnb',
    category: 'fnb',
  },
  {
    id: 'fnb-3',
    title: 'Behind the Scenes: Proses Roasting & Rahasia Dapur Resto',
    traffic: 'Rising ↗',
    snippet: 'Format video transparansi proses pembuatan produk untuk membangun kepercayaan audiens.',
    source: 'curated_fnb',
    category: 'fnb',
  },
  {
    id: 'fnb-4',
    title: 'Perbandingan Rasa Biji Kopi Arabika Single Origin Jawa vs Sumatra',
    traffic: 'Rising ↗',
    snippet: 'Format kurasi rasa dan aroma kopi yang memicu diskusi interaktif di kolom komentar.',
    source: 'curated_fnb',
    category: 'fnb',
  },
]

/**
 * Parsing sederhana dan aman untuk RSS XML Google Trends Indonesia
 */
export async function fetchGoogleTrendsIndonesia(): Promise<TrendRadarItem[]> {
  const url = 'https://trends.google.com/trending/rss?geo=ID'

  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 }, // Cache 1 jam di Next.js
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    })

    if (!res.ok) {
      console.warn(`[TrendRadar] Gagal mengambil Google Trends RSS: HTTP ${res.status}`)
      return []
    }

    const xmlText = await res.text()
    const items: TrendRadarItem[] = []

    // Ekstrak tag <item>...</item>
    const itemRegex = /<item>([\s\S]*?)<\/item>/g
    let match: RegExpExecArray | null

    let index = 0
    while ((match = itemRegex.exec(xmlText)) !== null && index < 20) {
      const itemContent = match[1]

      const titleMatch = /<title>([\s\S]*?)<\/title>/.exec(itemContent)
      const trafficMatch = /<ht:approx_traffic>([\s\S]*?)<\/ht:approx_traffic>/.exec(itemContent)
      const pubDateMatch = /<pubDate>([\s\S]*?)<\/pubDate>/.exec(itemContent)
      const linkMatch = /<ht:news_item_url>([\s\S]*?)<\/ht:news_item_url>/.exec(itemContent) || /<link>([\s\S]*?)<\/link>/.exec(itemContent)
      const snippetMatch = /<ht:news_item_snippet>([\s\S]*?)<\/ht:news_item_snippet>/.exec(itemContent)

      if (titleMatch && titleMatch[1]) {
        const title = titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim()
        const snippet = snippetMatch ? snippetMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : undefined
        const traffic = trafficMatch ? trafficMatch[1].trim() : undefined
        const itemUrl = linkMatch ? linkMatch[1].trim() : undefined
        const pubDate = pubDateMatch ? pubDateMatch[1].trim() : undefined

        // Klasifikasikan kategori secara sederhana
        const lowerTitle = title.toLowerCase()
        const lowerSnippet = (snippet || '').toLowerCase()
        const isFnB = /kopi|coffee|makan|kuliner|resto|menu|resep|pedas|minuman|teh|snack|roti|boba|cafe|kafe/.test(lowerTitle + ' ' + lowerSnippet)
        const isLifestyle = /wisata|liburan|tips|nongkrong|kesehatan|lifestyle|viral/.test(lowerTitle + ' ' + lowerSnippet)

        items.push({
          id: `gt-${index + 1}`,
          title,
          traffic,
          snippet,
          source: 'google_trends',
          category: isFnB ? 'fnb' : isLifestyle ? 'lifestyle' : 'general',
          pubDate,
          url: itemUrl,
        })
        index++
      }
    }

    return items
  } catch (err) {
    console.error('[TrendRadar] Error fetching Google Trends:', err)
    return []
  }
}

/**
 * Mengambil kompilasi tren gabungan (Google Trends + Curated F&B)
 */
export async function getCombinedTrendRadar(categoryFilter?: string): Promise<TrendRadarItem[]> {
  const googleTrends = await fetchGoogleTrendsIndonesia()

  // Gabungkan tren kurasi industri F&B di urutan teratas, diikuti tren Google Trends
  let allTrends: TrendRadarItem[] = [...CURATED_FNB_TRENDS, ...googleTrends]

  if (categoryFilter && categoryFilter !== 'all') {
    allTrends = allTrends.filter((item) => item.category === categoryFilter)
  }

  return allTrends
}
