import { chat, type Provider } from '@/lib/ai/providers'
import { getCachedSentiment } from '@/lib/nlp/sentiment-cache'

export interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral'
  confidence: number
}

export interface SentimentSummary {
  total_processed: number
  positive_count: number
  neutral_count: number
  negative_count: number
  avg_confidence: number
}

export async function analyzeSentiment(
  text: string,
  provider?: Provider
): Promise<SentimentResult | null> {
  if (!text || text.trim().length === 0) return null

  // Check cache first
  const cached = getCachedSentiment(text)
  if (cached) return cached

  const prompt = `Analisis sentimen dari komentar media sosial berikut dalam Bahasa Indonesia.
Kategori: "positive", "negative", atau "neutral".
Berikan skor keyakinan (confidence) antara 0.0 sampai 1.0.

Respons HANYA JSON tanpa markdown/penjelasan:
{"sentiment":"positive","confidence":0.95}

Komentar: "${text.replace(/"/g, "'")}"`

  const aiProvider: Provider = provider || {
    kind: 'custom',
    model: process.env.AI_DEFAULT_MODEL || 'gpt-oss:120b',
    base_url: process.env.AI_DEFAULT_BASE_URL || 'http://localhost:11434/v1',
    api_key: process.env.AI_DEFAULT_API_KEY || 'ollama',
  }

  try {
    const rawRes = await chat(aiProvider, 'Kamu adalah pengklasifikasi sentimen komentar.', [
      { role: 'user', content: prompt }
    ])

    const jsonMatch = rawRes.match(/\{[\s\S]*?\}/)
    if (!jsonMatch) return { sentiment: 'neutral', confidence: 0.5 }

    const parsed = JSON.parse(jsonMatch[0])
    const sentiment = ['positive', 'negative', 'neutral'].includes(parsed.sentiment)
      ? (parsed.sentiment as 'positive' | 'negative' | 'neutral')
      : 'neutral'
    const confidence = typeof parsed.confidence === 'number'
      ? Math.min(Math.max(parsed.confidence, 0), 1)
      : 0.5

    return { sentiment, confidence }
  } catch (err) {
    console.error('[NLP Sentiment] Classification failed:', err)
    return { sentiment: 'neutral', confidence: 0.5 }
  }
}

export function aggregateSentiments(results: Array<SentimentResult | null>): SentimentSummary {
  const valid = results.filter((r): r is SentimentResult => r !== null)
  if (valid.length === 0) {
    return { total_processed: 0, positive_count: 0, neutral_count: 0, negative_count: 0, avg_confidence: 0 }
  }

  let pos = 0, neu = 0, neg = 0, totalConf = 0
  for (const item of valid) {
    if (item.sentiment === 'positive') pos++
    else if (item.sentiment === 'negative') neg++
    else neu++
    totalConf += item.confidence
  }

  return {
    total_processed: valid.length,
    positive_count: pos,
    neutral_count: neu,
    negative_count: neg,
    avg_confidence: Number((totalConf / valid.length).toFixed(2)),
  }
}
