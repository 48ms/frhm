export type CarouselStructure =
  | 'how_to'
  | 'listicle'
  | 'myth_bust'
  | 'before_after'
  | 'framework'

export type CarouselPlatform = 'instagram' | 'linkedin' | 'tiktok'

export interface CarouselSlide {
  slideNumber: number
  slideRole: 'cover' | 'content' | 'summary' | 'cta'
  headline: string
  subhead?: string
  takeawayBullet?: string
  visualLayoutDirection: string
  ideogramPrompt?: string
}

export interface CarouselResult {
  title: string
  oneIdeaSpine: string
  structure: CarouselStructure
  platform: CarouselPlatform
  slideCount: number
  coverPromise: string
  slides: CarouselSlide[]
  singleActionCta: string
  suggestedCaption: string
}

export interface GenerateCarouselInput {
  clientId: string
  clientName?: string
  topic: string
  structure?: CarouselStructure
  platform?: CarouselPlatform
  targetSlideCount?: number
  painPointOrTakeaway?: string
}

export interface GenerateCarouselResponse {
  success: boolean
  data?: CarouselResult
  error?: string
}
