"use server"

import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import { resolveProvider, loadSkillMd, loadClientFiles, brandContext } from "@/lib/ai/server"
import { chatJson, chat } from "@/lib/ai/providers"
import { GenerateCaptionSchema, GenerateIdeasSchema, GeneratedIdeaSchema, GenerateVideoScriptInputSchema, GeneratedVideoScriptSchema, RepurposedContentSchema, GenerateBatchPlanInputSchema, BatchPlanSchema, RepurposeCrossPlatformInputSchema } from "./types"
import type { GenerateCaptionInput, CopilotResponse, GenerateIdeasInput, IdeasResponse, GenerateVideoScriptInput, VideoScriptResponse, RepurposeCrossPlatformInput, RepurposeCrossPlatformResponse, GenerateBatchPlanInput, BatchPlanResponse } from "./types"

async function buildSystemPrompt(supabase: any, clientId: string, skillId: string, instruction: string): Promise<string | null> {
  const provider = await resolveProvider(supabase)
  if (!provider) return null

  const skillMd = await loadSkillMd(supabase, skillId)
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
You are a Content Repurposing Expert.
Adapt the provided base content natively into these platforms: ${platforms.join(", ")}.

RULES:
1. Do not copy-paste. Rewrite natively for each platform (e.g. threads for X, visual captions for Instagram, professional hooks for LinkedIn).
2. Keep the core message and the brand voice intact.
`
    const systemPrompt = await buildSystemPrompt(supabase, clientId, "cross-platform-repurposing", instruction)
    if (!systemPrompt) return { error: "Failed to build system prompt" }

    const object = await chatJson<z.infer<typeof RepurposedContentSchema>>(provider, systemPrompt, [
      { role: "user", content: `Please repurpose the following content for these platforms: ${platforms.join(", ")}.\n\nBASE CONTENT:\n${baseContent}` }
    ])

    if (!object) return { error: "Gagal merombak konten" }
    return { repurposed: object }
  } catch (err: any) {
    logger.error("Repurpose Error", { error: err })
    return { error: err.message || "Terjadi kesalahan" }
  }
}
