export type HookMechanism =
  | 'curiosity_gap'
  | 'contrarian'
  | 'high_stakes'
  | 'relatable_identity'
  | 'transformation'

export type HookFormat = 'caption' | 'video' | 'carousel_cover' | 'thread_opener'

export interface HookCandidate {
  mechanism: HookMechanism
  mechanismLabel: string
  text: string
  characterCount: number
  cutoffLimit: number
  isInsideCutoff: boolean
  whyItWorks: string
  isRecommended?: boolean
  recommendationRationale?: string
  // For video format, layers:
  videoLayers?: {
    visualShot: string
    onScreenText: string
    spokenAudio: string
  }
}

export interface GenerateHooksInput {
  clientId: string
  topic: string
  format?: HookFormat
  surprisingFactOrDetail?: string
  targetPlatform?: string
}

export interface GenerateHooksResponse {
  success: boolean
  format: HookFormat
  rawTopic: string
  clientName?: string
  candidates: HookCandidate[]
  sendsQuestion?: string
  error?: string
}
