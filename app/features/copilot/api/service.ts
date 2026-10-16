"use server"

import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import { assertClientAccess } from "@/lib/auth/guard"
import { resolveProvider, loadSkillBundle, loadClientFiles, brandContext } from "@/lib/ai/server"
import { chatJsonDetailed, chatDetailed } from "@/lib/ai/providers"
import { logAiUsage } from "@/lib/ai/usage"
import {
  GenerateCaptionSchema,
  GenerateIdeasSchema,
  GeneratedIdeaSchema,
  GenerateVideoScriptInputSchema,
  GeneratedVideoScriptSchema,
  RepurposedContentSchema,
  GenerateBatchPlanInputSchema,
  BatchPlanSchema,
  RepurposeCrossPlatformInputSchema,
  GenerateHooksInputSchema,
  HooksResponseSchema,
  GenerateCarouselInputSchema,
  GeneratedCarouselSchema,
  ValidatePostInputSchema,
  PostValidationResultSchema,
  GenerateVisualPromptInputSchema,
  VisualPromptResultSchema,
  EvaluateTrendInputSchema,
  TrendEvaluationSchema,
} from "./types"
import type {
  GenerateCaptionInput,
  CopilotResponse,
  GenerateIdeasInput,
  IdeasResponse,
  GenerateVideoScriptInput,
  VideoScriptResponse,
  RepurposeCrossPlatformInput,
  RepurposeCrossPlatformResponse,
  GenerateBatchPlanInput,
  BatchPlanResponse,
  GenerateHooksInput,
  HooksResponse,
  GenerateCarouselInput,
  CarouselResponse,
  ValidatePostInput,
  ValidatePostResponse,
  GenerateVisualPromptInput,
  VisualPromptResponse,
  EvaluateTrendInput,
  EvaluateTrendResponse,
} from "./types"

async function recordCopilotUsage(
  supabase: any,
  clientId: string | null,
  route: string,
  provider: { model: string; kind: string },
  usage: { promptTokens: number; completionTokens: number } | null,
  start: number,
  errorMessage?: string | null
) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    await logAiUsage({
      userId: user?.id ?? null,
      clientId,
      route,
      model: provider.model,
      providerKind: provider.kind,
      promptTokens: usage?.promptTokens ?? 0,
      completionTokens: usage?.completionTokens ?? 0,
      latencyMs: Date.now() - start,
      errorMessage: errorMessage ?? null,
    })
  } catch {
    // Non-blocking observability
  }
}

async function buildSystemPrompt(supabase: any, clientId: string, skillId: string, instruction: string): Promise<string | null> {
  if (clientId) {
    await assertClientAccess(clientId)
  }
  const provider = await resolveProvider(supabase)
  if (!provider) return null

  const skillMd = await loadSkillBundle(supabase, skillId)
  const cFiles = await loadClientFiles(supabase, clientId)
  
  // Ambil profil klien untuk fallback header
  const { data: clientData } = await supabase.from('clients').select('name').eq('id', clientId).maybeSingle()
  const name = clientData?.name || "Client"
  
  const bc = brandContext(name, cFiles)
  
  return `
[ROLE & TASK]
${instruction}

[BRAND CONTEXT]
The following is the brand profile and identity. Everything you write must adhere to this voice and guardrails.
---
${bc}
---

[SKILL CAPABILITY]
The following is the authoritative skill playbook for this task. Strictly adhere to its frameworks, rules, and formats.
---
${skillMd || "(Skill document not found. Rely on your expert training and the brand context.)"}
---

You must output valid JSON only, exactly matching the requested schema. No conversational filler.
`
}

export async function generateBatchPlan(input: GenerateBatchPlanInput): Promise<BatchPlanResponse> {
  const start = Date.now()
  let supabase: any
  let provider: any
  try {
    const { clientId, period, platforms, goals, postsPerWeek } = GenerateBatchPlanInputSchema.parse(input)
    supabase = await createClient()
    provider = await resolveProvider(supabase)
    
    if (!provider) return { error: "AI Provider belum dikonfigurasi. Hubungi Admin." }

    const instruction = `
You are an elite Social Media Batch Content Planner.
Plan a full batch of social media content for a period (${period}).
The user can realistically post ${postsPerWeek} times per week across these platforms: ${platforms.join(", ")}.
The goal for this period is: ${goals}.

RULES:
1. Strategy before ideas. Balance the mix, limit direct promotions.
2. Every planned post must be a specific brief that a writer can execute.
3. Spread out the posts chronologically. Generate realistic ISO 8601 datetimes.
`
    const systemPrompt = await buildSystemPrompt(supabase, clientId, "batch-content-plan", instruction)
    if (!systemPrompt) return { error: "Failed to build system prompt" }

    const { data: object, usage } = await chatJsonDetailed<z.infer<typeof BatchPlanSchema>>(provider, systemPrompt, [
      { role: "user", content: "Build the batch content plan now. Make it sustainable and highly tailored to the brand." }
    ])

    void recordCopilotUsage(supabase, clientId, "copilot/batch-plan", provider, usage, start, object ? null : "AI response parse failed")

    if (!object) return { error: "AI merespons dengan format yang salah atau gagal membuat rencana." }
    return { plan: object }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error("Batch Plan Error", { error: err })
    if (supabase && provider) {
      void recordCopilotUsage(supabase, input.clientId, "copilot/batch-plan", provider, null, start, msg)
    }
    return { error: msg || "Terjadi kesalahan saat membuat batch plan" }
  }
}

export async function generateCaption(input: GenerateCaptionInput): Promise<CopilotResponse> {
  const start = Date.now()
  let supabase: any
  let provider: any
  try {
    const { clientId, topic, platform, goal } = GenerateCaptionSchema.parse(input)
    supabase = await createClient()
    provider = await resolveProvider(supabase)
    
    if (!provider) return { caption: "", error: "AI Provider belum dikonfigurasi." }

    const instruction = `
You are a top-1% social media Caption Writer.
Write a platform-native caption for ${platform} that stops the scroll and drives the goal: ${goal}.

RULES:
1. The first line is the whole game. Write the first line like its only job is to win the second line (the "...more" tap).
2. Every caption serves one goal. Make sure it drives toward: ${goal}.
3. Deliver exactly ONE Call to Action (CTA) matched to the goal.
`
    const systemPrompt = await buildSystemPrompt(supabase, clientId, "caption-writer", instruction)
    if (!systemPrompt) return { caption: "", error: "Failed to build system prompt" }

    const { text: raw, usage } = await chatDetailed(provider, systemPrompt + "\nOutput ONLY the final caption text. Do not output JSON.", [
      { role: "user", content: `Topic / Asset Description: ${topic}` }
    ])

    void recordCopilotUsage(supabase, clientId, "copilot/caption", provider, usage, start)

    return { caption: raw.trim() }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error("Copilot Error", { error: err })
    if (supabase && provider) {
      void recordCopilotUsage(supabase, input.clientId, "copilot/caption", provider, null, start, msg)
    }
    return { caption: "", error: msg || "Terjadi kesalahan pada AI" }
  }
}

export async function generateContentIdeas(input: GenerateIdeasInput): Promise<IdeasResponse> {
  const start = Date.now()
  let supabase: any
  let provider: any
  try {
    const { clientId, count, trendOrTopic } = GenerateIdeasSchema.parse(input)
    supabase = await createClient()
    provider = await resolveProvider(supabase)
    
    if (!provider) return { ideas: [], error: "AI Provider belum dikonfigurasi." }

    const instruction = `
You are a world-class Social Media Strategist.
Generate ${count} distinct, high-quality content ideas based on the provided trend or topic.

Topic/Trend constraint: ${trendOrTopic || "General brand pillars"}
`
    const systemPrompt = await buildSystemPrompt(supabase, clientId, "idea-generation-and-ideation", instruction)
    if (!systemPrompt) return { ideas: [], error: "Failed to build system prompt" }

    const { data: object, usage } = await chatJsonDetailed<{ ideas: z.infer<typeof GeneratedIdeaSchema>[] }>(provider, systemPrompt, [
      { role: "user", content: `Generate ${count} content ideas now.` }
    ])

    void recordCopilotUsage(supabase, clientId, "copilot/content-ideas", provider, usage, start, object?.ideas ? null : "Gagal meracik ide")

    if (!object || !object.ideas) return { ideas: [], error: "Gagal meracik ide konten." }
    return { ideas: object.ideas }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error("Copilot Error", { error: err })
    if (supabase && provider) {
      void recordCopilotUsage(supabase, input.clientId, "copilot/content-ideas", provider, null, start, msg)
    }
    return { ideas: [], error: msg || "Terjadi kesalahan pada AI" }
  }
}

export async function generateVideoScript(input: GenerateVideoScriptInput): Promise<VideoScriptResponse> {
  const start = Date.now()
  let supabase: any
  let provider: any
  try {
    const { clientId, topic, platform, duration } = GenerateVideoScriptInputSchema.parse(input)
    supabase = await createClient()
    provider = await resolveProvider(supabase)
    
    if (!provider) return { error: "AI Provider belum dikonfigurasi." }

    const instruction = `
You are an elite Short-Form Video Scriptwriter.
Write a script tailored for ${platform} with a target duration of ${duration}.

RULES:
1. Hook (0-3s): Must grab attention immediately visually and audibly.
2. Value (3s-end): Deliver on the hook without fluff.
3. Formatting: Output an array of 'scenes'. Each scene must have visual instructions, audio/dialogue, and an estimated duration.
`
    const skillId = (platform ?? "").toLowerCase().includes("tiktok") ? "tiktok-script" :
                    (platform ?? "").toLowerCase().includes("instagram") ? "reels-script" :
                    "short-form-video-script"

    const systemPrompt = await buildSystemPrompt(supabase, clientId, skillId, instruction)
    if (!systemPrompt) return { error: "Failed to build system prompt" }

    const { data: object, usage } = await chatJsonDetailed<z.infer<typeof GeneratedVideoScriptSchema>>(provider, systemPrompt, [
      { role: "user", content: `Generate a video script for the following topic/premise: ${topic}. Duration target: ${duration}.` }
    ])

    void recordCopilotUsage(supabase, clientId, "copilot/video-script", provider, usage, start, object ? null : "Gagal memproses skrip")

    if (!object) return { error: "Gagal memproses skrip video." }
    return { script: object }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error("Video Script Error", { error: err })
    if (supabase && provider) {
      void recordCopilotUsage(supabase, input.clientId, "copilot/video-script", provider, null, start, msg)
    }
    return { error: msg || "Terjadi kesalahan" }
  }
}

export async function repurposeCrossPlatform(input: RepurposeCrossPlatformInput): Promise<RepurposeCrossPlatformResponse> {
  const start = Date.now()
  let supabase: any
  let provider: any
  try {
    const { clientId, baseContent, platforms } = RepurposeCrossPlatformInputSchema.parse(input)
    supabase = await createClient()
    provider = await resolveProvider(supabase)
    
    if (!provider) return { error: "AI Provider belum dikonfigurasi." }

    const instruction = `
You are an expert Social Media Repurposing Strategist executing the "Atomize & Adapt" system from social-media-skills.

CORE PRINCIPLE: Repurposing is NOT reposting. NEVER paste or mildly rephrase the same text. Rebuild it natively for each target platform so it looks native and stands completely on its own.

WORKFLOW:
1. ATOMIZE: Extract the single core reusable "atom" (the central insight, lesson, or story) from the source material and record it in "coreAtom".
2. RE-NATIVE PER PLATFORM:
   - Instagram: Visual-first caption or carousel concept with an intriguing first-line cutoff hook and clean bio/comment CTA.
   - LinkedIn: Professional insight breakdown with strong 2-line hook, generous line spacing, high takeaway value, and professional engagement CTA.
   - Twitter / X: Punchy high-density post or thread opener with zero filler words.
   - TikTok / Reels: Short-form spoken hook (3 seconds), concise body concept, and audio/comment CTA.
3. REGISTER SHIFT: Maintain constant brand voice while shifting register to match platform culture (e.g. LinkedIn professional & authoritative, TikTok conversational & raw).
`
    const systemPrompt = await buildSystemPrompt(supabase, clientId, "cross-platform-repurposing", instruction)
    if (!systemPrompt) return { error: "Failed to build system prompt" }

    const { data: object, usage } = await chatJsonDetailed<z.infer<typeof RepurposedContentSchema>>(provider, systemPrompt, [
      { role: "user", content: `Please execute the "Atomize & Adapt" repurposing system for these platforms: ${platforms.join(", ")}.\n\nSOURCE MATERIAL:\n${baseContent}` }
    ])

    void recordCopilotUsage(supabase, clientId, "copilot/repurpose", provider, usage, start, object ? null : "Gagal merombak konten")

    if (!object) return { error: "Gagal merombak konten" }
    return { repurposed: object }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error("Repurpose Error", { error: err })
    if (supabase && provider) {
      void recordCopilotUsage(supabase, input.clientId, "copilot/repurpose", provider, null, start, msg)
    }
    return { error: msg || "Terjadi kesalahan" }
  }
}

export async function generateHooks(input: GenerateHooksInput): Promise<HooksResponse> {
  const start = Date.now()
  let supabase: any
  let provider: any
  try {
    const { clientId, topic, platform, goal } = GenerateHooksInputSchema.parse(input)
    supabase = await createClient()
    provider = await resolveProvider(supabase)

    if (!provider) return { hooks: [], error: "AI Provider belum dikonfigurasi." }

    const instruction = `
You are a scroll-stopping Hook Writer specialized in modern social feeds.
Platform: ${platform}.
Goal: ${goal || "stop the scroll and drive curiosity"}.

RULES (from hook-writer playbook):
1. The first line is the whole game. Write lines that earn the tap on "...more" or stop the scroll in under 3 seconds.
2. Provide distinct angles: Curiosity, Contrarian, Direct Value, Story, and Relatable.
3. No cheesy cliches like "In today's fast-paced world", "Happy Monday!", or forced emoji overload.
`
    const systemPrompt = await buildSystemPrompt(supabase, clientId, "hook-writer", instruction)
    if (!systemPrompt) return { hooks: [], error: "Gagal membangun prompt hook" }

    const { data: object, usage } = await chatJsonDetailed<z.infer<typeof HooksResponseSchema>>(provider, systemPrompt, [
      { role: "user", content: `Generate 3 to 5 high-converting hooks for this premise: "${topic}". Target platform: ${platform}.` }
    ])

    void recordCopilotUsage(supabase, clientId, "copilot/hooks", provider, usage, start, object?.hooks ? null : "Gagal menghasilkan hook")

    if (!object || !object.hooks) return { hooks: [], error: "Gagal menghasilkan hook." }
    return { hooks: object.hooks }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error("Hook Generator Error", { error: err })
    if (supabase && provider) {
      void recordCopilotUsage(supabase, input.clientId, "copilot/hooks", provider, null, start, msg)
    }
    return { hooks: [], error: msg || "Terjadi kesalahan saat membuat hook" }
  }
}

export async function generateCarousel(input: GenerateCarouselInput): Promise<CarouselResponse> {
  const start = Date.now()
  let supabase: any
  let provider: any
  try {
    const { clientId, topic, slideCount, platform } = GenerateCarouselInputSchema.parse(input)
    supabase = await createClient()
    provider = await resolveProvider(supabase)

    if (!provider) return { error: "AI Provider belum dikonfigurasi." }

    const instruction = `
You are an expert Social Media Carousel Writer & Art Director.
Platform: ${platform}.
Requested Slides: ${slideCount}.

RULES (from carousel-writer playbook):
1. Slide 1 (role: hook_cover): Stop the scroll. Must create an open loop or promise high value.
2. Slides 2 to ${slideCount - 1} (role: content_value): One clear point per slide. Short punchy copy designed for mobile readability.
3. Slide ${slideCount} (role: cta_end): Single strong call to action (Save/Share/Follow).
4. Provide visualDirection on every slide so designers know what visual/layout to place.
5. Provide an accompanying caption that hooks into the carousel.
`
    const systemPrompt = await buildSystemPrompt(supabase, clientId, "carousel-writer", instruction)
    if (!systemPrompt) return { error: "Gagal membangun prompt carousel" }

    const { data: object, usage } = await chatJsonDetailed<z.infer<typeof GeneratedCarouselSchema>>(provider, systemPrompt, [
      { role: "user", content: `Create a ${slideCount}-slide carousel on the topic: "${topic}". Make it high-density, authoritative, and brand-native.` }
    ])

    void recordCopilotUsage(supabase, clientId, "copilot/carousel", provider, usage, start, object ? null : "Gagal menghasilkan carousel")

    if (!object) return { error: "Gagal menghasilkan carousel." }
    return { carousel: object }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error("Carousel Writer Error", { error: err })
    if (supabase && provider) {
      void recordCopilotUsage(supabase, input.clientId, "copilot/carousel", provider, null, start, msg)
    }
    return { error: msg || "Terjadi kesalahan saat menyusun carousel" }
  }
}

export async function validatePlatformPost(input: ValidatePostInput): Promise<ValidatePostResponse> {
  const start = Date.now()
  let supabase: any
  let provider: any
  try {
    const { platform, content, mediaType } = ValidatePostInputSchema.parse(input)
    supabase = await createClient()
    provider = await resolveProvider(supabase)

    if (!provider) return { error: "AI Provider belum dikonfigurasi." }

    const instruction = `
You are an authoritative Social Media Compliance & Platform Specs Auditor.
Platform: ${platform}.
Media Type: ${mediaType}.

Evaluate the provided post content against real platform algorithmic & format realities:
1. First line truncation: Extract what line is shown before the "...more" fold.
2. Platform character limits and readability.
3. Hashtags: Advise on current SEO standards (3-5 focused hashtags vs spam).
4. Links: Check if links in captions are penalised on this platform (e.g. LinkedIn external link suppression, Instagram unclickable links).
5. Output valid JSON matching the schema with a quality score (0-100), list of issues, and recommendations.
`
    const skillMd = await loadSkillBundle(supabase, "platform-specs-and-validation")

    const systemPrompt = `
[ROLE & TASK]
${instruction}

[SPECIFICATION RULES]
${skillMd || "Adhere to platform standards for Instagram, TikTok, LinkedIn, YouTube, X."}

You must output valid JSON only matching the schema.
`

    const { data: object, usage } = await chatJsonDetailed<z.infer<typeof PostValidationResultSchema>>(provider, systemPrompt, [
      { role: "user", content: `Audit this post for ${platform}:\n\nCONTENT:\n${content}` }
    ])

    void recordCopilotUsage(supabase, null, "copilot/validate-post", provider, usage, start, object ? null : "Gagal memvalidasi konten")

    if (!object) return { error: "Gagal memvalidasi konten." }
    return { result: object }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error("Platform Validator Error", { error: err })
    if (supabase && provider) {
      void recordCopilotUsage(supabase, null, "copilot/validate-post", provider, null, start, msg)
    }
    return { error: msg || "Terjadi kesalahan validasi platform" }
  }
}

export async function generateVisualPrompt(input: GenerateVisualPromptInput): Promise<VisualPromptResponse> {
  const start = Date.now()
  let supabase: any
  let provider: any
  try {
    const { clientId, topic, postCaption, mediaType, preferredStyle } = GenerateVisualPromptInputSchema.parse(input)
    supabase = await createClient()
    provider = await resolveProvider(supabase)

    if (!provider) return { error: "AI Provider belum dikonfigurasi." }

    const skillId = mediaType === "video" ? "ai-video" : "image-prompt"

    const instruction = `
You are an elite Creative Director & AI Visual Prompt Engineer.
Media Type: ${mediaType}.
Preferred Style: ${preferredStyle || "Brand photoreal or clean modern graphic"}.

RULES (from image-prompt playbook):
1. Brief: Craft a tight one-sentence visual purpose.
2. Prompt Anatomy: Specific natural-language description covering Subject + Composition + Lighting + Color + Mood + Constraints.
3. No token spam ("masterpiece, 4k, photorealistic").
4. Tool Selection:
   - For in-image text/typography -> "ideogram"
   - For photoreal scenes/products -> "flux"
   - For stylized/creative -> "midjourney" or "nano-banana"
   - For short-form video b-roll -> "veo-3" or "kling"
5. Color Harmony: Pull brand colors and accent palette from the client's brand profile.
`
    const systemPrompt = await buildSystemPrompt(supabase, clientId, skillId, instruction)
    if (!systemPrompt) return { error: "Gagal membangun prompt visual" }

    const { data: object, usage } = await chatJsonDetailed<z.infer<typeof VisualPromptResultSchema>>(provider, systemPrompt, [
      {
        role: "user",
        content: `Create an optimized visual prompt for this post topic: "${topic}".\nCaption context: "${postCaption || topic}"`
      }
    ])

    void recordCopilotUsage(supabase, clientId, "copilot/visual-prompt", provider, usage, start, object ? null : "Gagal menghasilkan visual prompt")

    if (!object) return { error: "Gagal menghasilkan visual prompt." }
    return { result: object }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error("Visual Prompt Error", { error: err })
    if (supabase && provider) {
      void recordCopilotUsage(supabase, input.clientId, "copilot/visual-prompt", provider, null, start, msg)
    }
    return { error: msg || "Terjadi kesalahan saat meracik prompt visual" }
  }
}

export async function evaluateTrend(input: EvaluateTrendInput): Promise<EvaluateTrendResponse> {
  const start = Date.now()
  let supabase: any
  let provider: any
  try {
    const { clientId, trendDescription, trendSourceOrContext } = EvaluateTrendInputSchema.parse(input)
    supabase = await createClient()
    provider = await resolveProvider(supabase)

    if (!provider) return { error: "AI Provider belum dikonfigurasi." }

    const instruction = `
You are an expert Social Media Trend Strategist and Brand Safety Officer.
Trend: ${trendDescription}.
Context/Source: ${trendSourceOrContext || "General social media trend"}.

RULES (from trend-jacking playbook - Three Gates):
1. Gate FIT: Is there an authentic connection to this brand and its audience? (Pass/Fail + Reason)
2. Gate SAFETY: Strict filter. Never trendjack tragedies, crises, political controversies, or divisive moments. (Pass/Fail + Reason)
3. Gate TIMING: Is it emerging, rising, peak, saturated, or dead? (Only emerging/rising should be approved).
4. Overall Approval: ONLY approved if all 3 gates pass.
5. If approved, provide an authentic remix angle that fits the brand's voice without looking cringe or forced.
`
    const systemPrompt = await buildSystemPrompt(supabase, clientId, "trend-jacking", instruction)
    if (!systemPrompt) return { error: "Gagal membangun prompt evaluasi tren" }

    const { data: object, usage } = await chatJsonDetailed<z.infer<typeof TrendEvaluationSchema>>(provider, systemPrompt, [
      {
        role: "user",
        content: `Evaluate this trend for the client brand:\nTrend Description: "${trendDescription}"\nContext: "${trendSourceOrContext || ''}"`
      }
    ])

    void recordCopilotUsage(supabase, clientId, "copilot/trend-evaluation", provider, usage, start, object ? null : "Gagal mengevaluasi tren")

    if (!object) return { error: "Gagal mengevaluasi tren." }
    return { evaluation: object }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error("Trend Evaluation Error", { error: err })
    if (supabase && provider) {
      void recordCopilotUsage(supabase, input.clientId, "copilot/trend-evaluation", provider, null, start, msg)
    }
    return { error: msg || "Terjadi kesalahan saat mengevaluasi tren" }
  }
}


