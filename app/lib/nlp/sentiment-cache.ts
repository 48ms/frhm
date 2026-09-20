// lib/nlp/sentiment-cache.ts
// In-memory cache untuk menghindari duplikat panggilan API Ollama ke teks komentar yang sama

interface CacheEntry {
  result: {
    sentiment: 'positive' | 'negative' | 'neutral'
    confidence: number
  }
  timestamp: number
}

const cache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 // 24 jam

export function getCachedSentiment(text: string): { sentiment: 'positive' | 'negative' | 'neutral'; confidence: number } | null {
  const entry = cache.get(text)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(text)
    return null
  }
  return entry.result
}

export function setCachedSentiment(text: string, result: { sentiment: 'positive' | 'negative' | 'neutral'; confidence: number }): void {
  cache.set(text, { result, timestamp: Date.now() })
}

export function clearSentimentCache(): void {
  cache.clear()
}

export function getCacheStats(): { size: number; keys: string[] } {
  return { size: cache.size, keys: Array.from(cache.keys()) }
}