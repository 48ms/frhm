import { z } from 'zod'

export type VisualTool = 'ideogram' | 'flux' | 'midjourney' | 'veo' | 'canva'
export type AspectRatio = '1:1' | '4:5' | '9:16' | '16:9'
export type VisualJob =
  | 'hero_product'
  | 'infographic_quote'
  | 'lifestyle_broll'
  | 'behind_the_scenes'
  | 'carousel_slide'
  | 'announcement'

export interface UniversalAnatomy {
  subject: string
  composition: string
  lighting: string
  colorPalette: string
  style: string
  mood: string
  detail: string
  negativeConstraints: string
}

export interface VisualPromptResult {
  title: string
  shouldGenerateAI: boolean
  gateReasoning: string
  recommendedTool: VisualTool
  aspectRatio: AspectRatio
  job: VisualJob
  universalAnatomy: UniversalAnatomy
  toolSpecificPrompt: string
  negativePrompt: string
  aiDisclosureTag: string
  overlayTextGuidance: string
  copyableMarkdown: string
}

export interface GenerateVisualPromptInput {
  clientId: string
  clientName?: string
  topic: string
  visualBrief?: string
  tool?: VisualTool
  aspectRatio?: AspectRatio
  job?: VisualJob
  format?: 'Single' | 'Carousel' | 'Reel' | 'Thread' | 'Story'
}

export interface GenerateVisualPromptResponse {
  success: boolean
  data?: VisualPromptResult
  error?: string
}

export const GenerateVisualPromptSchema = z.object({
  clientId: z.string().min(1, 'Client ID wajib diisi'),
  clientName: z.string().optional(),
  topic: z.string().min(1, 'Topik visual wajib diisi'),
  visualBrief: z.string().optional(),
  tool: z.enum(['ideogram', 'flux', 'midjourney', 'veo', 'canva']).optional(),
  aspectRatio: z.enum(['1:1', '4:5', '9:16', '16:9']).optional(),
  job: z.enum([
    'hero_product',
    'infographic_quote',
    'lifestyle_broll',
    'behind_the_scenes',
    'carousel_slide',
    'announcement',
  ]).optional(),
  format: z.enum(['Single', 'Carousel', 'Reel', 'Thread', 'Story']).optional(),
})
