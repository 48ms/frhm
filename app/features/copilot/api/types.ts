import { z } from "zod"

export const GenerateCaptionSchema = z.object({
  clientId: z.string(),
  topic: z.string().min(3, "Topik harus lebih dari 3 karakter"),
  platform: z.string(),
  goal: z.string().default("awareness"), // awareness, engagement, conversion
})

export type GenerateCaptionInput = z.infer<typeof GenerateCaptionSchema>

export type CopilotResponse = {
  caption: string
  error?: string
}

export const GenerateIdeasSchema = z.object({
  clientId: z.string(),
  count: z.number().min(1).max(20).default(5),
  trendOrTopic: z.string().optional(),
})

export type GenerateIdeasInput = z.infer<typeof GenerateIdeasSchema>

export const GeneratedIdeaSchema = z.object({
  title: z.string(),
  content: z.string(),
  pillar: z.string(),
  format: z.string(), // "Text", "Image", "Video", "Carousel"
  platform: z.string(),
  hook: z.string(),
})

export type GeneratedIdea = z.infer<typeof GeneratedIdeaSchema>

export type IdeasResponse = {
  ideas: GeneratedIdea[]
  error?: string
}

export const GenerateVideoScriptInputSchema = z.object({
  clientId: z.string(),
  topic: z.string().min(3),
  duration: z.string().default("30 seconds"),
  platform: z.string().optional(),
})

export type GenerateVideoScriptInput = z.infer<typeof GenerateVideoScriptInputSchema>

export const GeneratedVideoSceneSchema = z.object({
  timecode: z.string().describe("e.g. 0:00 - 0:03"),
  visual: z.string().describe("Visual description, B-Roll, lighting, camera move"),
  audio: z.string().describe("Voiceover, text on screen, sound effects"),
  toolRoute: z.string().describe("Recommended tool (e.g. Veo, Kling, HeyGen, ElevenLabs, or 'Film it real')"),
})

export type GeneratedVideoScene = z.infer<typeof GeneratedVideoSceneSchema>

export const GeneratedVideoScriptSchema = z.object({
  title: z.string(),
  scenes: z.array(GeneratedVideoSceneSchema),
  overallMood: z.string(),
})

export type GeneratedVideoScript = z.infer<typeof GeneratedVideoScriptSchema>

export type VideoScriptResponse = {
  script?: GeneratedVideoScript
  error?: string
}

export const RepurposeCrossPlatformInputSchema = z.object({
  clientId: z.string(),
  baseContent: z.string(),
  platforms: z.array(z.string()),
})
export type RepurposeCrossPlatformInput = z.infer<typeof RepurposeCrossPlatformInputSchema>

export const RepurposedPlatformContentSchema = z.object({
  platform: z.string().describe("The platform ID, e.g. instagram, linkedin, x, tiktok"),
  content: z.string().describe("The adapted content for this specific platform"),
  format: z.string().optional().describe("e.g. Carousel Outline, Thought Leadership Post, Punchy Post, Short Script"),
  hook: z.string().optional().describe("Platform-native opening hook"),
  callToAction: z.string().optional().describe("Platform-native CTA"),
  registerNote: z.string().optional().describe("Tone/register shift explanation"),
})

export const RepurposedContentSchema = z.object({
  coreAtom: z.string().optional().describe("The extracted core idea or truth from the base content"),
  results: z.array(RepurposedPlatformContentSchema),
})

export type RepurposeCrossPlatformResponse = {
  repurposed?: z.infer<typeof RepurposedContentSchema>
  error?: string
}

export const GenerateBatchPlanInputSchema = z.object({
  clientId: z.string(),
  period: z.string().default("this week"), // "this week", "this month"
  platforms: z.array(z.string()),
  goals: z.string(),
  postsPerWeek: z.number().default(3),
})

export type GenerateBatchPlanInput = z.infer<typeof GenerateBatchPlanInputSchema>

export const BatchPlanPostSchema = z.object({
  title: z.string(),
  platform: z.string(),
  scheduled_at: z.string().describe("ISO datetime string"),
  content: z.string().describe("The core idea and draft copy for the post"),
  pillar: z.string().optional().describe("Brand theme / pillar this post belongs to"),
  intent: z.enum(["educate", "entertain", "inspire", "connect", "promote"]).default("educate").describe("The job this post does; promote capped at ~20% of batch"),
  format: z.string().default("Single").describe("Format: Single, Reel, Carousel, Thread, Story"),
  hook: z.string().optional().describe("Opening hook angle"),
  visualBrief: z.string().optional().describe("Production asset or creative tool needed (photo, Veo b-roll, Ideogram layout)"),
  cta: z.string().optional().describe("Single action call to action"),
  notes: z.string().optional(),
})

export const BatchPlanSchema = z.object({
  posts: z.array(BatchPlanPostSchema),
})

export type BatchPlanResponse = {
  plan?: z.infer<typeof BatchPlanSchema>
  error?: string
}

// ---------------------------------------------------------------------------
// Hook Generator (hook-writer skill)
// ---------------------------------------------------------------------------
export const GenerateHooksInputSchema = z.object({
  clientId: z.string(),
  topic: z.string().min(3, "Topik harus lebih dari 3 karakter"),
  platform: z.string().default("instagram"),
  goal: z.string().optional(),
})

export type GenerateHooksInput = z.infer<typeof GenerateHooksInputSchema>

export const HookOptionSchema = z.object({
  angle: z.string().describe("Sudut pandang: e.g. Curiosity, Contrarian, Direct Value, Story, Relatable"),
  text: z.string().describe("Kalimat hook pertama yang menghentikan scroll"),
  explanation: z.string().describe("Mengapa hook ini bekerja secara psikologis"),
})

export type HookOption = z.infer<typeof HookOptionSchema>

export const HooksResponseSchema = z.object({
  hooks: z.array(HookOptionSchema),
})

export type HooksResponse = {
  hooks: HookOption[]
  error?: string
}

// ---------------------------------------------------------------------------
// Carousel Studio (carousel-writer skill)
// ---------------------------------------------------------------------------
export const GenerateCarouselInputSchema = z.object({
  clientId: z.string(),
  topic: z.string().min(3, "Topik harus lebih dari 3 karakter"),
  slideCount: z.number().min(3).max(10).default(6),
  platform: z.string().default("instagram"),
})

export type GenerateCarouselInput = z.infer<typeof GenerateCarouselInputSchema>

export const CarouselSlideSchema = z.object({
  slideNumber: z.number(),
  role: z.enum(["hook_cover", "content_value", "cta_end"]),
  headline: z.string().describe("Judul besar atau teks utama di slide"),
  bodyText: z.string().describe("Teks penjelas singkat (mudah dibaca di HP)"),
  visualDirection: z.string().describe("Instruksi visual atau grafis untuk desainer"),
})

export type CarouselSlide = z.infer<typeof CarouselSlideSchema>

export const GeneratedCarouselSchema = z.object({
  title: z.string(),
  slides: z.array(CarouselSlideSchema),
  accompanyingCaption: z.string().describe("Caption pelengkap untuk postingan"),
  targetAudienceAngle: z.string(),
})

export type GeneratedCarousel = z.infer<typeof GeneratedCarouselSchema>

export type CarouselResponse = {
  carousel?: GeneratedCarousel
  error?: string
}

// ---------------------------------------------------------------------------
// Pre-Flight Platform Validator (platform-specs-and-validation skill)
// ---------------------------------------------------------------------------
export const ValidatePostInputSchema = z.object({
  platform: z.string(),
  content: z.string(),
  mediaType: z.enum(["text", "image", "video", "carousel"]).default("text"),
})

export type ValidatePostInput = z.infer<typeof ValidatePostInputSchema>

export const ValidationIssueSchema = z.object({
  severity: z.enum(["error", "warning", "tip"]),
  rule: z.string(),
  message: z.string(),
})

export type ValidationIssue = z.infer<typeof ValidationIssueSchema>

export const PostValidationResultSchema = z.object({
  valid: z.boolean(),
  score: z.number().min(0).max(100),
  firstLinePreview: z.string().describe("Baris yang terlihat sebelum tombol '...more' terpotong"),
  issues: z.array(ValidationIssueSchema),
  recommendations: z.array(z.string()),
})

export type PostValidationResult = z.infer<typeof PostValidationResultSchema>

export type ValidatePostResponse = {
  result?: PostValidationResult
  error?: string
}

// ---------------------------------------------------------------------------
// Visual & Image Prompt Studio (image-prompt & ai-video skills)
// ---------------------------------------------------------------------------
export const GenerateVisualPromptInputSchema = z.object({
  clientId: z.string(),
  topic: z.string().min(3),
  postCaption: z.string().optional(),
  mediaType: z.enum(["image", "video"]).default("image"),
  preferredStyle: z.string().optional(), // "photoreal", "typographic_graphic", "3d_render", "cinematic_broll"
})

export type GenerateVisualPromptInput = z.infer<typeof GenerateVisualPromptInputSchema>

export const VisualPromptResultSchema = z.object({
  brief: z.string().describe("One-sentence purpose and message of the visual"),
  recommendedTool: z.enum(["ideogram", "flux", "nano-banana", "midjourney", "veo-3", "kling", "canva"]),
  aspectRatio: z.string().describe("e.g. 1:1 Square, 4:5 Portrait, 9:16 Vertical Video, 16:9 Landscape"),
  prompt: z.string().describe("Specific natural-language prompt without token spam"),
  negativePrompt: z.string().optional(),
  textOverlay: z.string().optional().describe("Exact text string to render in image if typographic"),
  brandColorNotes: z.string().describe("Hex accents or lighting color harmony matching brand"),
  aiDisclosureRequired: z.boolean().default(true),
})

export type VisualPromptResult = z.infer<typeof VisualPromptResultSchema>

export type VisualPromptResponse = {
  result?: VisualPromptResult
  error?: string
}

// ---------------------------------------------------------------------------
// Trend-Jacking Vetting & Remix (trend-jacking skill)
// ---------------------------------------------------------------------------
export const EvaluateTrendInputSchema = z.object({
  clientId: z.string(),
  trendDescription: z.string().min(5),
  trendSourceOrContext: z.string().optional(),
})

export type EvaluateTrendInput = z.infer<typeof EvaluateTrendInputSchema>

export const TrendEvaluationSchema = z.object({
  gateFit: z.object({
    pass: z.boolean(),
    reason: z.string(),
  }),
  gateSafety: z.object({
    pass: z.boolean(),
    reason: z.string(),
  }),
  gateTiming: z.object({
    status: z.enum(["emerging", "rising", "peak", "saturated", "dead"]),
    verdict: z.string(),
  }),
  overallApproved: z.boolean(),
  remixAngle: z.string().optional().describe("How the brand should authentically adapt the trend without looking cringe"),
  recommendedFormat: z.string().optional().describe("Reels, TikTok, Carousel, Meme, or Single Post"),
  draftPremise: z.string().optional(),
})

export type TrendEvaluation = z.infer<typeof TrendEvaluationSchema>

export type EvaluateTrendResponse = {
  evaluation?: TrendEvaluation
  error?: string
}

