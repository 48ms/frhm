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
})

export const RepurposedContentSchema = z.object({
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
  content: z.string().describe("The post brief or caption"),
  notes: z.string().optional(),
})

export const BatchPlanSchema = z.object({
  posts: z.array(BatchPlanPostSchema),
})

export type BatchPlanResponse = {
  plan?: z.infer<typeof BatchPlanSchema>
  error?: string
}
