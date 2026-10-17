export type VoiceTargetType = 'founder' | 'brand' | 'creator'

export interface ExtractVoiceInput {
  clientId: string
  samples: string[]
  targetType: VoiceTargetType
  brandName?: string
}

export interface VoiceRewriteItem {
  generic: string
  onVoice: string
  why: string
}

export interface VoiceExtractionResult {
  fingerprint: string[]
  negativeSpace: string[]
  dimensions: {
    formality: number
    warmth: number
    authority: number
    energy: number
    humor: number
    polish: number
  }
  toneMap: {
    linkedin: string
    instagram: string
    tiktok: string
    xTwitter: string
  }
  rewrites: VoiceRewriteItem[]
  markdown: string
  summary: string
}

export interface SaveVoiceGuideInput {
  clientId: string
  content: string
}

export interface SaveVoiceGuideResult {
  success: boolean
  error?: string
}
