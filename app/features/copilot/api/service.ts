"use server"

import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import { resolveProvider, loadSkillBundle, loadClientFiles, brandContext } from "@/lib/ai/server"
import { chatJson, chat } from "@/lib/ai/providers"
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

async function buildSystemPrompt(supabase: any, clientId: string, skillId: string, instruction: string): Promise<string | null> {
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
  try {
    const { clientId, period, platforms, goals, postsPerWeek } = GenerateBatchPlanInputSchema.parse(input)
    const supabase = await createClient()
    const provider = await resolveProvider(supabase)
    
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

    const object = await chatJson<z.infer<typeof BatchPlanSchema>>(provider, systemPrompt, [
      { role: "user", content: "Build the batch content plan now. Make it sustainable and highly tailored to the brand." }
    ])

    if (!object) return { error: "AI merespons dengan format yang salah atau gagal membuat rencana." }
    return { plan: object }
  } catch (err: any) {
    logger.error("Batch Plan Error", { error: err })
    return { error: err.message || "Terjadi kesalahan saat membuat batch plan" }
  }
}

export async function generateCaption(input: GenerateCaptionInput): Promise<CopilotResponse> {
  try {
    const { clientId, topic, platform, goal } = GenerateCaptionSchema.parse(input)
    const supabase = await createClient()
    const provider = await resolveProvider(supabase)
    
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

    const raw = await chat(provider, systemPrompt + "\nOutput ONLY the final caption text. Do not output JSON.", [
      { role: "user", content: `Topic / Asset Description: ${topic}` }
    ])

    return { caption: raw.trim() }
  } catch (err: any) {
    logger.error("Copilot Error", { error: err })
    return { caption: "", error: err.message || "Terjadi kesalahan pada AI" }
  }
}

export async function generateContentIdeas(input: GenerateIdeasInput): Promise<IdeasResponse> {
  try {
    const { clientId, count, trendOrTopic } = GenerateIdeasSchema.parse(input)
    const supabase = await createClient()
    const provider = await resolveProvider(supabase)
    
    if (!provider) return { ideas: [], error: "AI Provider belum dikonfigurasi." }

    const instruction = `
You are a world-class Social Media Strategist.
Generate ${count} distinct, high-quality content ideas based on the provided trend or topic.

Topic/Trend constraint: ${trendOrTopic || "General brand pillars"}
`
    const systemPrompt = await buildSystemPrompt(supabase, clientId, "idea-generation-and-ideation", instruction)
    if (!systemPrompt) return { ideas: [], error: "Failed to build system prompt" }

    const object = await chatJson<{ ideas: z.infer<typeof GeneratedIdeaSchema>[] }>(provider, systemPrompt, [
      { role: "user", content: `Generate ${count} content ideas now.` }
    ])

    if (!object || !object.ideas) return { ideas: [], error: "Gagal meracik ide konten." }
    return { ideas: object.ideas }
  } catch (err: any) {
    logger.error("Copilot Error", { error: err })
    return { ideas: [], error: err.message || "Terjadi kesalahan pada AI" }
  }
}

export async function generateVideoScript(input: GenerateVideoScriptInput): Promise<VideoScriptResponse> {
  try {
    const { clientId, topic, platform, duration } = GenerateVideoScriptInputSchema.parse(input)
    const supabase = await createClient()
    const provider = await resolveProvider(supabase)
    
    if (!provider) return { error: "AI Provider belum dikonfigurasi." }

    const instruction = `
You are an elite Short-Form Video Scriptwriter.
Write a script tailored for ${platform} with a target duration of ${duration}.

RULES:
1. Hook (0-3s): Must grab attention immediately visually and audibly.
2. Value (3s-end): Deliver on the hook without fluff.
3. Formatting: Output an array of 'scenes'. Each scene must have visual instructions, audio/dialogue, and an estimated duration.
`
    // Bisa diroute ke "tiktok-script" atau "reels-script" tergantung platform, default ke short-form-video-script
    const skillId = (platform ?? "").toLowerCase().includes("tiktok") ? "tiktok-script" :
                    (platform ?? "").toLowerCase().includes("instagram") ? "reels-script" :
                    "short-form-video-script"

    const systemPrompt = await buildSystemPrompt(supabase, clientId, skillId, instruction)
    if (!systemPrompt) return { error: "Failed to build system prompt" }

    const object = await chatJson<z.infer<typeof GeneratedVideoScriptSchema>>(provider, systemPrompt, [
      { role: "user", content: `Generate a video script for the following topic/premise: ${topic}. Duration target: ${duration}.` }
    ])

    if (!object) return { error: "Gagal memproses skrip video." }
    return { script: object }
  } catch (err: any) {
    logger.error("Video Script Error", { error: err })
    return { error: err.message || "Terjadi kesalahan" }
  }
}

export async function repurposeCrossPlatform(input: RepurposeCrossPlatformInput): Promise<RepurposeCrossPlatformResponse> {
  try {
    const { clientId, baseContent, platforms } = RepurposeCrossPlatformInputSchema.parse(input)
    const supabase = await createClient()
    const provider = await resolveProvider(supabase)
    
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

    const object = await chatJson<z.infer<typeof RepurposedContentSchema>>(provider, systemPrompt, [
      { role: "user", content: `Please execute the "Atomize & Adapt" repurposing system for these platforms: ${platforms.join(", ")}.\n\nSOURCE MATERIAL:\n${baseContent}` }
    ])

    if (!object) return { error: "Gagal merombak konten" }
    return { repurposed: object }
  } catch (err: any) {
    logger.error("Repurpose Error", { error: err })
    return { error: err.message || "Terjadi kesalahan" }
  }
}

export async function generateHooks(input: GenerateHooksInput): Promise<HooksResponse> {
  try {
    const { clientId, topic, platform, goal } = GenerateHooksInputSchema.parse(input)
    const supabase = await createClient()
    const provider = await resolveProvider(supabase)

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

    const object = await chatJson<z.infer<typeof HooksResponseSchema>>(provider, systemPrompt, [
      { role: "user", content: `Generate 3 to 5 high-converting hooks for this premise: "${topic}". Target platform: ${platform}.` }
    ])

    if (!object || !object.hooks) return { hooks: [], error: "Gagal menghasilkan hook." }
    return { hooks: object.hooks }
  } catch (err: any) {
    logger.error("Hook Generator Error", { error: err })
    return { hooks: [], error: err.message || "Terjadi kesalahan saat membuat hook" }
  }
}

export async function generateCarousel(input: GenerateCarouselInput): Promise<CarouselResponse> {
  try {
    const { clientId, topic, slideCount, platform } = GenerateCarouselInputSchema.parse(input)
    const supabase = await createClient()
    const provider = await resolveProvider(supabase)

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

    const object = await chatJson<z.infer<typeof GeneratedCarouselSchema>>(provider, systemPrompt, [
      { role: "user", content: `Create a ${slideCount}-slide carousel on the topic: "${topic}". Make it high-density, authoritative, and brand-native.` }
    ])

    if (!object) return { error: "Gagal menghasilkan carousel." }
    return { carousel: object }
  } catch (err: any) {
    logger.error("Carousel Writer Error", { error: err })
    return { error: err.message || "Terjadi kesalahan saat menyusun carousel" }
  }
}

export async function validatePlatformPost(input: ValidatePostInput): Promise<ValidatePostResponse> {
  try {
    const { platform, content, mediaType } = ValidatePostInputSchema.parse(input)
    const supabase = await createClient()
    const provider = await resolveProvider(supabase)

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

    const object = await chatJson<z.infer<typeof PostValidationResultSchema>>(provider, systemPrompt, [
      { role: "user", content: `Audit this post for ${platform}:\n\nCONTENT:\n${content}` }
    ])

    if (!object) return { error: "Gagal memvalidasi konten." }
    return { result: object }
  } catch (err: any) {
    logger.error("Platform Validator Error", { error: err })
    return { error: err.message || "Terjadi kesalahan validasi platform" }
  }
}

export async function generateVisualPrompt(input: GenerateVisualPromptInput): Promise<VisualPromptResponse> {
  try {
    const { clientId, topic, postCaption, mediaType, preferredStyle } = GenerateVisualPromptInputSchema.parse(input)
    const supabase = await createClient()
    const provider = await resolveProvider(supabase)

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

    const object = await chatJson<z.infer<typeof VisualPromptResultSchema>>(provider, systemPrompt, [
      {
        role: "user",
        content: `Create an optimized visual prompt for this post topic: "${topic}".\nCaption context: "${postCaption || topic}"`
      }
    ])

    if (!object) return { error: "Gagal menghasilkan visual prompt." }
    return { result: object }
  } catch (err: any) {
    logger.error("Visual Prompt Error", { error: err })
    return { error: err.message || "Terjadi kesalahan saat meracik prompt visual" }
  }
}

export async function evaluateTrend(input: EvaluateTrendInput): Promise<EvaluateTrendResponse> {
  try {
    const { clientId, trendDescription, trendSourceOrContext } = EvaluateTrendInputSchema.parse(input)
    const supabase = await createClient()
    const provider = await resolveProvider(supabase)

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

    const object = await chatJson<z.infer<typeof TrendEvaluationSchema>>(provider, systemPrompt, [
      {
        role: "user",
        content: `Evaluate this trend for the client brand:\nTrend Description: "${trendDescription}"\nContext: "${trendSourceOrContext || ''}"`
      }
    ])

    if (!object) return { error: "Gagal mengevaluasi tren." }
    return { evaluation: object }
  } catch (err: any) {
    logger.error("Trend Evaluation Error", { error: err })
    return { error: err.message || "Terjadi kesalahan saat mengevaluasi tren" }
  }
}


