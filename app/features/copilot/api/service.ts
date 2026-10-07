"use server"

import { z } from "zod"
import { generateText, generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import { GenerateCaptionSchema, GenerateIdeasSchema, GeneratedIdeaSchema, GenerateVideoScriptInputSchema, GeneratedVideoScriptSchema, RepurposedContentSchema, GenerateBatchPlanInputSchema, BatchPlanSchema } from "./types"
import type { GenerateCaptionInput, CopilotResponse, GenerateIdeasInput, IdeasResponse, GenerateVideoScriptInput, VideoScriptResponse, RepurposeCrossPlatformInput, RepurposeCrossPlatformResponse, GenerateBatchPlanInput, BatchPlanResponse } from "./types"

export async function generateBatchPlan(input: GenerateBatchPlanInput): Promise<BatchPlanResponse> {
  try {
    const { clientId, period, platforms, goals, postsPerWeek } = GenerateBatchPlanInputSchema.parse(input)

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("clients")
      .select("brand_profile")
      .eq("id", clientId)
      .single()

    if (error) {
      logger.error("Error fetching brand profile", { error })
      return { error: "Gagal mengambil Brand Profile" }
    }

    const bp = data?.brand_profile as Record<string, any> | undefined

    if (!bp || Object.keys(bp).length === 0) {
      return { error: "Brand DNA belum dikonfigurasi. Lengkapi Brand Profile di menu Settings terlebih dahulu." }
    }

    const who = bp?.who || "Brand/Agency anonim"
    const voice = bp?.voice || "Profesional"
    const guardrails = bp?.guardrails || "None"
    const audience = bp?.audience || "Umum"
    const pillars = Array.isArray(bp?.pillars) ? bp.pillars.join(", ") : "Edukasi, Hiburan, Promosi"

    const systemPrompt = `
You are an elite Social Media Batch Content Planner.
Your job is to plan a full batch of social media content for a period (${period}).
The user can realistically post ${postsPerWeek} times per week across these platforms: ${platforms.join(", ")}.
The goal for this period is: ${goals}.

BRAND FOUNDATION:
- Identity: ${who}
- Target Audience: ${audience}
- Voice: ${voice}
- Content Pillars: ${pillars}
- Guardrails: ${guardrails}

RULES (Strictly Followed):
1. Strategy before ideas. Balance the mix, lean heavily toward value/story/connection, limit direct promotions.
2. Every planned post must be a specific brief that a writer can execute.
3. Spread out the posts chronologically from the start of the period. For dates, generate realistic ISO 8601 datetimes starting from today (2026-10-05T12:00:00Z) or the upcoming days in the period.
4. Output a JSON containing an array of 'posts' matching the required schema.
`

    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: BatchPlanSchema,
      system: systemPrompt,
      prompt: "Build the batch content plan now. Make it sustainable and highly tailored to the brand.",
      maxRetries: 1,
      abortSignal: AbortSignal.timeout(60000)
    })

    return { plan: object }
  } catch (err: any) {
    logger.error("Batch Plan Error", { error: err })
    if (err.name === 'AbortError' || err.name === 'TimeoutError') {
      return { error: "Timeout: AI terlalu lama memproses, coba lagi." }
    }
    return { error: err.message || "Terjadi kesalahan saat membuat batch plan" }
  }
}

export async function generateCaption(input: GenerateCaptionInput): Promise<CopilotResponse> {
  try {
    const { clientId, topic, platform, goal } = GenerateCaptionSchema.parse(input)

    // 1. Ambil Brand Profile dari Supabase
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("clients")
      .select("brand_profile")
      .eq("id", clientId)
      .single()

    if (error) {
      logger.error("Error fetching brand profile for caption", { error })
      return { caption: "", error: "Gagal mengambil Brand Profile" }
    }

    const bp = data?.brand_profile as Record<string, any> | undefined

    if (!bp || Object.keys(bp).length === 0) {
      return { caption: "", error: "Brand DNA belum dikonfigurasi. Lengkapi Brand Profile di menu Settings terlebih dahulu." }
    }

    const who = bp?.who || "Brand/Agency anonim"
    const voice = bp?.voice || "Profesional dan engaging"
    const guardrails = bp?.guardrails || "Tidak ada pantangan khusus"
    const pillars = Array.isArray(bp?.pillars) ? bp.pillars.join(", ") : "Umum"

    // 2. Susun System Prompt berdasarkan panduan mutlak `social-media-skills` (caption-writer)
    const systemPrompt = `
You are a top-1% social media Caption Writer.
Your job is to write a platform-native caption for ${platform} that stops the scroll and drives the goal: ${goal}.

BRAND PROFILE & VOICE:
- Who: ${who}
- Tone of Voice: ${voice}
- Guardrails (Never do these): ${guardrails}
- Content Pillars: ${pillars}

RULES (Strictly Followed):
1. The first line is the whole game. Write the first line like its only job is to win the second line (the "...more" tap).
2. Every caption serves one goal. Make sure it drives toward: ${goal}.
3. Deliver exactly ONE Call to Action (CTA) matched to the goal.
4. Adapt to the mechanics of ${platform} (hashtags, length, line breaks).
5. DO NOT use generic AI-slop, emojis if they don't fit the brand, or banned words from Guardrails.
6. Provide ONE best version of the caption. Just the caption text, no intro/outro or explanations.
`

    // 3. Panggil Vercel AI SDK dengan model GPT-4o
    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      prompt: `Topic / Asset Description: ${topic}`,
      maxRetries: 1,
      abortSignal: AbortSignal.timeout(45000)
    })

    return { caption: text }
  } catch (err: any) {
    logger.error("Copilot Caption Generation Error", { error: err })
    if (err.name === 'AbortError' || err.name === 'TimeoutError') {
      return { caption: "", error: "Timeout: AI terlalu lama merespon." }
    }
    return { caption: "", error: err.message || "Terjadi kesalahan saat generate" }
  }
}

export async function generateContentIdeas(input: GenerateIdeasInput): Promise<IdeasResponse> {
  try {
    const { clientId, count, trendOrTopic } = GenerateIdeasSchema.parse(input)

    // 1. Ambil Brand Profile dari Supabase
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("clients")
      .select("brand_profile")
      .eq("id", clientId)
      .single()

    if (error) {
      logger.error("Error fetching brand profile for ideas", { error })
      return { ideas: [], error: "Gagal mengambil Brand Profile" }
    }

    const bp = data?.brand_profile as Record<string, any> | undefined

    if (!bp || Object.keys(bp).length === 0) {
      return { ideas: [], error: "Brand DNA belum dikonfigurasi. Lengkapi Brand Profile di menu Settings terlebih dahulu." }
    }

    const who = bp?.who || "Brand/Agency anonim"
    const voice = bp?.voice || "Profesional"
    const pillars = Array.isArray(bp?.pillars) ? bp.pillars.join(", ") : "Edukasi, Hiburan, Promosi"
    const audience = bp?.audience || "Audience umum"

    // 2. SPARK Framework Prompt
    const systemPrompt = `
You are an elite Content Strategist & Ideator operating on the SPARK framework.
Your job is to generate exactly ${count} highly-engaging, non-generic content ideas for this brand.

BRAND FOUNDATION:
- Identity: ${who}
- Target Audience: ${audience}
- Brand Voice: ${voice}
- Content Pillars (Owned Themes): ${pillars}
${trendOrTopic ? `- Current Focus/Trend to integrate: ${trendOrTopic}` : ''}

RULES (Strictly Followed):
1. PRODUCE IN VOLUME & ANGLE IT: Do not output generic "educational post about X". Output a specific, angled premise that stops the scroll (e.g. "The 3 biggest mistakes people make when doing X").
2. PILLAR ALIGNMENT: Every idea must strictly fit into one of the provided Content Pillars.
3. PLATFORM & FORMAT: Vary the platforms (Instagram, TikTok, LinkedIn, Twitter) and formats (Video, Carousel, Text, Image) based on what makes sense for the idea.
4. HOOK: Write a powerful 3-second hook for each idea that leverages curiosity, contrarianism, or direct value.
5. Provide the output as a valid JSON array matching the required schema.
`

    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: z.object({
        ideas: z.array(GeneratedIdeaSchema)
      }),
      system: systemPrompt,
      prompt: `Generate ${count} content ideas now.`,
      maxRetries: 1,
      abortSignal: AbortSignal.timeout(60000)
    })

    return { ideas: object.ideas }
  } catch (err: any) {
    logger.error("Brainstorm Generation Error", { error: err })
    if (err.name === 'AbortError' || err.name === 'TimeoutError') {
      return { ideas: [], error: "Timeout: AI terlalu lama memproses brainstorming." }
    }
    return { ideas: [], error: err.message || "Terjadi kesalahan saat brainstorming" }
  }
}

export async function generateVideoScript(input: GenerateVideoScriptInput): Promise<VideoScriptResponse> {
  try {
    const { clientId, topic, duration } = GenerateVideoScriptInputSchema.parse(input)

    // 1. Fetch Brand Profile
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("clients")
      .select("brand_profile")
      .eq("id", clientId)
      .single()

    if (error) {
      logger.error("Error fetching brand profile", { error })
      return { error: "Gagal mengambil Brand Profile" }
    }

    const bp = data?.brand_profile as Record<string, any> | undefined

    if (!bp || Object.keys(bp).length === 0) {
      return { error: "Brand DNA belum dikonfigurasi. Lengkapi Brand Profile di menu Settings terlebih dahulu." }
    }

    const who = bp?.who || "Brand/Agency anonim"
    const voice = bp?.voice || "Profesional"
    const guardrails = bp?.guardrails || "None"

    // 2. BRIEF Framework Prompt
    const systemPrompt = `
You are an elite AI Video Director and Scriptwriter operating on the BRIEF framework (Brief the job, Route by fit, Iterate cheaply, Edit & assemble, Finalize).
Your job is to generate a portable, brand-matched video script.

BRAND FOUNDATION:
- Identity: ${who}
- Brand Voice: ${voice}
- Guardrails: ${guardrails}

RULES (Strictly Followed):
1. B - Brief the job, not the tool: Write portable scenes. Include Subject, Action, Setting, Light/Mood, Camera.
2. R - Route by fit: For each scene, recommend the best AI tool category (e.g., 'Veo/Kling' for generative scenes, 'HeyGen/Synthesia' for avatars, 'ElevenLabs' for Voiceover, or 'Film it real' if it's too specific).
3. E - Edit & assemble: Break the script down into short cutaway clips.
4. Output a JSON matching the requested schema exactly.

Structure:
- The script should have an engaging title.
- The overall mood should match the Brand Profile.
- The scenes array should chronologically build the video up to the target duration: ${duration}.
- Make sure audio/voiceover is punchy and matches the brand voice.
`

    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: GeneratedVideoScriptSchema,
      system: systemPrompt,
      prompt: `Generate a video script for the following topic/premise: ${topic}. Duration target: ${duration}.`,
      maxRetries: 1,
      abortSignal: AbortSignal.timeout(60000)
    })

    return { script: object }
  } catch (err: any) {
    logger.error("Video Script Generation Error", { error: err })
    if (err.name === 'AbortError' || err.name === 'TimeoutError') {
      return { error: "Timeout: AI terlalu lama merespon. Mohon coba lagi nanti." }
    }
    return { error: err.message || "Terjadi kesalahan saat generate script video" }
  }
}

export async function repurposeCrossPlatform(
  input: RepurposeCrossPlatformInput
): Promise<RepurposeCrossPlatformResponse> {
  const { clientId, baseContent, platforms } = input

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("clients")
      .select("brand_profile")
      .eq("id", clientId)
      .single()

    if (error) {
      logger.error("Error fetching brand profile", { error })
      return { error: "Gagal mengambil Brand Profile" }
    }

    const bp = data?.brand_profile as Record<string, any> | undefined

    if (!bp || Object.keys(bp).length === 0) {
      return { error: "Brand DNA belum dikonfigurasi. Lengkapi Brand Profile di menu Settings terlebih dahulu." }
    }

    const who = bp?.who || "Brand/Agency anonim"
    const voice = bp?.voice || "Profesional"
    const guardrails = bp?.guardrails || "None"

    const systemPrompt = `
You are an elite Cross-Platform Repurposing Expert.
Your job is to take a base piece of content (the "atom") and adapt it natively for multiple social media platforms.
Repurposing is NOT reposting. You must "atomize -> adapt".
- Extract the core idea.
- Rebuild it natively for EACH requested platform (different hook, format, length, mechanics, and CTA).
- Voice stays the same, but REGISTER shifts per platform (e.g. LinkedIn is more professional/formatted, TikTok is loose/hook-first, X is punchy).

BRAND FOUNDATION:
- Identity: ${who}
- Brand Voice: ${voice}
- Guardrails: ${guardrails}

RULES:
1. Genuinely native: Do not just copy-paste the text and change hashtags. A LinkedIn post should read like a LinkedIn post, X like an X thread/tweet, etc.
2. Output a JSON containing an array of 'results', where each item has the 'platform' name and the adapted 'content'.
`

    const { object } = await generateObject({
      model: openai("gpt-4o"),
      schema: RepurposedContentSchema,
      system: systemPrompt,
      prompt: `Please repurpose the following content for these platforms: ${platforms.join(", ")}.\n\nBASE CONTENT:\n${baseContent}`,
      maxRetries: 1,
      abortSignal: AbortSignal.timeout(60000)
    })

    return { repurposed: object }
  } catch (err: any) {
    logger.error("Repurpose Error", { error: err })
    if (err.name === 'AbortError' || err.name === 'TimeoutError') {
      return { error: "Timeout: AI terlalu lama memproses adaptasi konten. Coba kurangi platform." }
    }
    return { error: err.message || "Terjadi kesalahan saat adaptasi konten" }
  }
}
