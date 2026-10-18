'use server'

import { createClient } from "@/lib/supabase/server"
import { createSupabaseServiceClient } from "@/lib/supabase/service"
import { logger } from "@/lib/logger"
import { assertClientAccess } from "@/lib/auth/guard"
import { resolveProvider, loadSkillBundle, loadClientFiles, brandContext } from "@/lib/ai/server"
import { markdownToBrandProfile } from "@/lib/brand-context"
import { logAudit } from "@/lib/audit/log"
import { chatJson, chatJsonDetailed } from "@/lib/ai/providers"
import { logAiUsage } from "@/lib/ai/usage"
import { executeWoopSocialTool, type McpExecutionResult } from "@/lib/mcp/woopsocial-mcp"
import type {
  Skill,
  SkillFile,
  SkillPack,
  ClientSkill,
  ClientSkillStatus,
  SkillOutput,
  SkillFilters,
  SkillChatTurn,
  SkillChatResponse,
  SaveSkillOutputInput,
  ExecuteGenericSkillInput,
  GenericSkillRunResult,
} from "./types"

export type { McpExecutionResult, GenericSkillRunResult, ExecuteGenericSkillInput }


/**
 * Service Layer untuk Skills & Playbooks Library
 * 100% Supabase Auth & PostgreSQL RLS (sesuai aturan Frhm)
 */

/** Mengambil seluruh daftar skills dengan opsi filter kategori, search, dan pack */
export async function getSkills(filters?: SkillFilters): Promise<Skill[]> {
  const supabase = await createClient()
  let query = supabase.from("skills").select("*").order("category", { ascending: true }).order("name", { ascending: true })

  if (filters?.category && filters.category !== "all") {
    query = query.eq("category", filters.category)
  }

  if (filters?.search && filters.search.trim()) {
    const s = filters.search.trim()
    query = query.or(`name.ilike.%${s}%,job.ilike.%${s}%,description.ilike.%${s}%`)
  }

  if (filters?.packId && filters.packId !== "all") {
    const { data: packSkills } = await supabase
      .from("pack_skills")
      .select("skill_id")
      .eq("pack_id", filters.packId)

    const skillIds = (packSkills ?? []).map((ps: { skill_id: string }) => ps.skill_id)
    if (skillIds.length > 0) {
      query = query.in("id", skillIds)
    } else {
      return []
    }
  }

  const { data, error } = await query
  if (error) {
    logger.error("skills.getSkills.failed", { error: error.message })
    return []
  }

  return (data as Skill[]) ?? []
}

/** Mengambil seluruh 17 topic packs beserta jumlah skill di dalamnya */
export async function getSkillPacks(): Promise<SkillPack[]> {
  const supabase = await createClient()

  const [packsRes, packSkillsRes] = await Promise.all([
    supabase.from("skill_packs").select("*").order("sort_order", { ascending: true }),
    supabase.from("pack_skills").select("pack_id, skill_id"),
  ])

  if (packsRes.error) {
    logger.error("skills.getSkillPacks.failed", { error: packsRes.error.message })
    return []
  }

  const packSkillMap = new Map<string, string[]>()
  for (const row of packSkillsRes.data ?? []) {
    const arr = packSkillMap.get(row.pack_id) ?? []
    arr.push(row.skill_id)
    packSkillMap.set(row.pack_id, arr)
  }

  return (packsRes.data ?? []).map((pack: SkillPack) => ({
    ...pack,
    skill_count: packSkillMap.get(pack.id)?.length ?? 0,
  }))
}

/** Mengambil detail sebuah skill beserta file markdown playbooks-nya */
export async function getSkillDetail(
  skillId: string
): Promise<{ skill: Skill; files: SkillFile[] } | null> {
  const supabase = await createClient()

  const [skillRes, filesRes] = await Promise.all([
    supabase.from("skills").select("*").eq("id", skillId).maybeSingle(),
    supabase.from("skill_files").select("skill_id, path, content").eq("skill_id", skillId).order("path"),
  ])

  if (!skillRes.data) return null

  return {
    skill: skillRes.data as Skill,
    files: (filesRes.data as SkillFile[]) ?? [],
  }
}

/** Mengambil status penugasan skill untuk klien tertentu */
export async function getClientSkills(clientId: string): Promise<ClientSkill[]> {
  if (!clientId) return []
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("client_skills")
    .select(`
      id,
      client_id,
      skill_id,
      status,
      notes,
      created_at,
      updated_at,
      skills:skill_id (
        id,
        name,
        description,
        category,
        job,
        allowed_tools
      )
    `)
    .eq("client_id", clientId)
    .order("updated_at", { ascending: false })

  if (error) {
    logger.error("skills.getClientSkills.failed", { clientId, error: error.message })
    return []
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    client_id: row.client_id,
    skill_id: row.skill_id,
    status: row.status as ClientSkillStatus,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    skill: row.skills as Skill,
  }))
}

/** Menugaskan seluruh skill dari sebuah Skill Pack ke klien */
export async function assignPackToClient(
  clientId: string,
  packId: string
): Promise<{ success: boolean; count: number; error?: string }> {
  if (!clientId || !packId) return { success: false, count: 0, error: "Client ID dan Pack ID diperlukan" }
  await assertClientAccess(clientId)
  const service = createSupabaseServiceClient()

  try {
    // 1. Ambil skill_id dalam pack
    const { data: packSkills, error: psError } = await service
      .from("pack_skills")
      .select("skill_id")
      .eq("pack_id", packId)

    if (psError || !packSkills || packSkills.length === 0) {
      return { success: false, count: 0, error: "Tidak ada skill dalam pack ini" }
    }

    // 2. Upsert ke client_skills
    const rows = packSkills.map((ps: { skill_id: string }) => ({
      client_id: clientId,
      skill_id: ps.skill_id,
      status: "belum" as const,
      updated_at: new Date().toISOString(),
    }))

    const { error: upsertError } = await service
      .from("client_skills")
      .upsert(rows, { onConflict: "client_id, skill_id" })

    if (upsertError) {
      logger.error("skills.assignPackToClient.failed", { clientId, packId, error: upsertError.message })
      return { success: false, count: 0, error: upsertError.message }
    }

    return { success: true, count: rows.length }
  } catch (err: unknown) {
    return { success: false, count: 0, error: err instanceof Error ? err.message : "Gagal menugaskan pack" }
  }
}

/** Mengupdate status pengerjaan skill klien */
export async function updateClientSkillStatus(
  clientId: string,
  skillId: string,
  status: ClientSkillStatus,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  if (!clientId || !skillId) return { success: false, error: "Client ID dan Skill ID diperlukan" }
  await assertClientAccess(clientId)
  const service = createSupabaseServiceClient()

  const { error } = await service
    .from("client_skills")
    .upsert(
      {
        client_id: clientId,
        skill_id: skillId,
        status,
        notes: notes ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "client_id, skill_id" }
    )

  if (error) {
    logger.error("skills.updateClientSkillStatus.failed", { clientId, skillId, error: error.message })
    return { success: false, error: error.message }
  }

  return { success: true }
}

/** Menyimpan hasil eksekusi final skill ke tabel public.skill_outputs */
export async function saveSkillOutput(
  input: SaveSkillOutputInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  await assertClientAccess(input.clientId)
  const service = createSupabaseServiceClient()

  try {
    const { clientId, skillId, title, content, status = "draft", stage } = input

    const { data, error } = await service
      .from("skill_outputs")
      .insert({
        client_id: clientId,
        skill_id: skillId,
        title,
        content,
        status,
        stage: stage ?? null,
      })
      .select("id")
      .single()

    if (error) {
      logger.error("skills.saveSkillOutput.failed", { clientId, skillId, error: error.message })
      return { success: false, error: error.message }
    }

    // Update status client_skills menjadi 'selesai'
    await updateClientSkillStatus(clientId, skillId, "selesai")

    // Auto-sync output ke client_files dan clients.brand_profile berdasarkan skillId
    const nowIso = new Date().toISOString()
    const hasVerifyQuarterly = content.includes("(verify-quarterly)")

    if (skillId === "brand-profile") {
      // 1. Upsert ke client_files/brand-profile.md
      const { error: fileErr } = await service
        .from("client_files")
        .upsert(
          {
            client_id: clientId,
            path: "brand-profile.md",
            content,
            updated_at: nowIso,
            needs_verification: hasVerifyQuarterly,
          },
          { onConflict: "client_id,path" }
        )

      if (fileErr) {
        logger.warn("skills.saveSkillOutput.client_files_failed", { clientId, error: fileErr.message })
      }

      // 2. Parse canonical/legacy structure dan sync ke clients.brand_profile (JSONB)
      try {
        const parsed = markdownToBrandProfile(content)
        const { data: clientRow } = await service
          .from("clients")
          .select("brand_profile")
          .eq("id", clientId)
          .maybeSingle()

        const existingProfile = (clientRow?.brand_profile as Record<string, any>) || {}
        const mergedProfile = {
          ...existingProfile,
          who: parsed.who || parsed.identity || existingProfile.who || "",
          identity: parsed.identity || parsed.who || existingProfile.identity || "",
          positioning: parsed.positioning || parsed.pov || existingProfile.positioning || "",
          audience: parsed.audience || existingProfile.audience || "",
          voice: parsed.voice || existingProfile.voice || "",
          pov: parsed.pov || parsed.positioning || existingProfile.pov || "",
          proof: parsed.proof || existingProfile.proof || "",
          offers_ctas: parsed.offers_ctas || existingProfile.offers_ctas || "",
          channels: parsed.channels || existingProfile.channels || [],
          operational_defaults: parsed.operational_defaults || existingProfile.operational_defaults || "",
          guardrails: parsed.guardrails || existingProfile.guardrails || "",
          examples: parsed.examples || existingProfile.examples || "",
          notes: parsed.notes || existingProfile.notes || "",
          pillars: parsed.pillars && parsed.pillars.length > 0 ? parsed.pillars : existingProfile.pillars || [],
        }

        await service
          .from("clients")
          .update({ brand_profile: mergedProfile, updated_at: nowIso })
          .eq("id", clientId)
      } catch (syncErr: unknown) {
        logger.warn("skills.saveSkillOutput.brand_profile_sync_failed", {
          clientId,
          error: syncErr instanceof Error ? syncErr.message : String(syncErr),
        })
      }
    } else if (skillId === "voice-builder" || skillId === "writing-style-and-tone") {
      await service
        .from("client_files")
        .upsert(
          {
            client_id: clientId,
            path: "voice.md",
            content,
            updated_at: nowIso,
            needs_verification: hasVerifyQuarterly,
          },
          { onConflict: "client_id,path" }
        )
    } else if (skillId === "content-pillars") {
      await service
        .from("client_files")
        .upsert(
          {
            client_id: clientId,
            path: "content-pillars.md",
            content,
            updated_at: nowIso,
            needs_verification: hasVerifyQuarterly,
          },
          { onConflict: "client_id,path" }
        )
    } else if (skillId === "guardrails") {
      await service
        .from("client_files")
        .upsert(
          {
            client_id: clientId,
            path: "guardrails.md",
            content,
            updated_at: nowIso,
            needs_verification: hasVerifyQuarterly,
          },
          { onConflict: "client_id,path" }
        )
    }

    void logAudit({
      action: "skill.output_saved",
      entityType: "skill_output",
      entityId: data.id,
      clientId,
      summary: `Saved output for skill ${skillId} and synced foundation documents`,
      metadata: { skillId, title, status },
    })

    return { success: true, id: data.id }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menyimpan output" }
  }
}

/** Mengambil seluruh riwayat dokumen output yang sudah difinalisasi untuk klien */
export async function getClientSkillOutputs(clientId: string): Promise<SkillOutput[]> {
  if (!clientId) return []
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("skill_outputs")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })

  if (error) {
    logger.error("skills.getClientSkillOutputs.failed", { clientId, error: error.message })
    return []
  }

  return (data as SkillOutput[]) ?? []
}

/**
 * Menjalankan sesi interview terpandu AI untuk sebuah skill
 * Mematuhi openspec/specs/client/skill-interview-chat/spec.md
 */
export async function executeSkillChat(input: {
  clientId: string
  skillId: string
  messages: SkillChatTurn[]
}): Promise<SkillChatResponse> {
  const start = Date.now()
  const { clientId, skillId, messages } = input
  await assertClientAccess(clientId)
  const supabase = await createClient()
  const provider = await resolveProvider(supabase)

  if (!provider) {
    return {
      reply: "AI Provider belum dikonfigurasi. Hubungi Admin.",
      done: false,
      error: "Provider tidak ditemukan",
    }
  }

  const [skillBundle, clientFiles, clientData] = await Promise.all([
    loadSkillBundle(supabase, skillId),
    loadClientFiles(supabase, clientId),
    supabase.from("clients").select("name").eq("id", clientId).maybeSingle(),
  ])

  const clientName = clientData.data?.name || "Klien"
  const brandCtx = brandContext(clientName, clientFiles)

  const systemPrompt = `
[ROLE & EXPERTISE]
You are an expert Social Media & Marketing Consultant acting on behalf of ${clientName}.
You are executing the specialized playbook "${skillId}".
You conduct an interactive interview step-by-step with the user in INDONESIAN (Bahasa Indonesia yang profesional, ramah, dan solutif).

[BRAND CONTEXT]
Adhere strictly to the brand voice, tone, and guardrails below:
---
${brandCtx}
---

[AUTHORITATIVE SKILL PLAYBOOK & INSTRUCTIONS]
Follow the guidelines, frameworks, and requirements from this official playbook:
---
${skillBundle || "Execute standard industry best practices for " + skillId}
---

[INTERVIEW & LIVE DRAFT SPECIFICATION (CRITICAL)]
You MUST output valid JSON ONLY, strictly following this schema:
{
  "reply": "Your conversational response or next 1-2 focused questions in Indonesian",
  "done": false, // set to true ONLY when you have gathered all necessary information and the document is 100% complete
  "preview": {
    "title": "Document Title",
    "content": "Full working markdown draft containing all sections compiled so far. As soon as you have info for ANY section, emit it here right now."
  },
  "output": null // When done is true, provide {"title": "Final Document Title", "content": "Complete final document in markdown"}
}

RULES & INTERVIEW HYGIENE (SOCIAL-MEDIA-SKILLS FOUNDATION):
1. REASONING-BASED INTERVIEW: You are conducting a consultative interview, not filling a rigid form. Ask 1 or 2 clear, specific questions per turn.
2. INFER FIRST: Acknowledge what is already known from context (Brand name, niche, industry) so the user doesn't repeat themselves.
3. CHALLENGE VAGUE INPUT KINDLY: If the user provides generic adjectives (e.g., "ramah dan profesional", "semua orang adalah audiens"), challenge them kindly toward specifics (e.g., "Sebutkan 1 brand yang ingin ditiru gaya bicaranya, 1 yang dihindari, serta kata wajib dan kata terlarang").
4. CANONICAL BLUEPRINT STRUCTURE: For brand-profile, structure the markdown strictly into the authoritative template sections: Identity, Positioning, Audience, Voice, Proof, Offers & CTAs, Channels, Operational Defaults, Guardrails, Show Don't Tell.
5. ZERO AI SLOP & NO FABRICATED STATS: Avoid generic AI clichés ("in today's digital era", "unleash", "game-changer", "delve"). Never fabricate follower numbers, reach, or metrics.
6. LIVE REAL-TIME DRAFT: While still interviewing ("done": false), ALWAYS provide the cumulative document in "preview" so the user sees the live draft updating in real time.
7. FINALIZATION: When all key sections are covered or the user confirms the draft, set "done": true, summarize the result warmly in "reply", and put the final markdown text in "output".
8. Output valid JSON only without markdown codeblocks or extraneous text.
`

  try {
    const formattedMessages: { role: "user" | "assistant"; content: string }[] = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }))

    // If initial empty conversation, trigger opening greeting
    if (formattedMessages.length === 0) {
      formattedMessages.push({
        role: "user",
        content: `Halo! Saya ingin memulai playbook ${skillId} untuk klien ${clientName}. Tolong perkenalkan tujuan playbook ini dan ajukan pertanyaan pertama.`,
      })
    }

    const { data: result, usage } = await chatJsonDetailed<any>(provider, systemPrompt, formattedMessages)

    // Mark skill in client_skills as 'jalan' if currently 'belum'
    await updateClientSkillStatus(clientId, skillId, "jalan")

    const { data: authUser } = await supabase.auth.getUser()
    await logAiUsage({
      userId: authUser?.user?.id ?? null,
      clientId,
      route: "skill.chat",
      model: provider.model,
      providerKind: provider.kind,
      promptTokens: usage?.promptTokens ?? 0,
      completionTokens: usage?.completionTokens ?? 0,
      latencyMs: Date.now() - start,
    })

    return {
      reply: result?.reply || "Mari kita lanjutkan.",
      done: Boolean(result?.done),
      preview: result?.preview || null,
      output: result?.output || null,
      file: result?.file || null,
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error("skills.executeSkillChat.failed", { skillId, error: msg })
    return {
      reply: "Terjadi kendala saat memproses respons AI. Silakan coba kembali.",
      done: false,
      error: msg,
    }
  }
}

/**
 * Menjalankan tool MCP untuk skill tertentu dengan pemeriksaan izin allowed_tools
 */
export async function executeSkillTool(input: {
  clientId: string
  skillId: string
  toolName: string
  parameters?: Record<string, any>
}): Promise<McpExecutionResult> {
  const { clientId, skillId, toolName, parameters = {} } = input

  // 1. Ambil skill untuk memverifikasi allowed_tools
  const detail = await getSkillDetail(skillId)
  if (!detail?.skill) {
    return { success: false, error: `Skill "${skillId}" tidak ditemukan`, toolName }
  }

  const skill = detail.skill
  const allowed = (skill.allowed_tools || "").toLowerCase()
  if (!allowed.includes("woopsocial") && !allowed.includes(toolName.toLowerCase())) {
    return {
      success: false,
      error: `Skill "${skill.name}" tidak memiliki izin untuk menjalankan tool "${toolName}"`,
      toolName,
    }
  }

  // 2. Jalankan tool via WoopSocial MCP Engine
  return executeWoopSocialTool(toolName, {
    ...parameters,
    clientId,
  })
}

/**
 * Generic Skill Runner: mengeksekusi sembarang dari 106 social media skills secara dinamis.
 * Menggabungkan authoritative skill playbook bundle, brand context klien, dan AI provider.
 */
export async function executeGenericSkill(
  input: ExecuteGenericSkillInput
): Promise<GenericSkillRunResult> {
  const start = Date.now()
  const { clientId, skillId, prompt, parameters = {}, autoSave = false } = input
  await assertClientAccess(clientId)
  const supabase = await createClient()
  const provider = await resolveProvider(supabase)

  if (!provider) {
    return {
      success: false,
      title: "",
      content: "",
      error: "AI Provider belum dikonfigurasi. Hubungi Admin.",
    }
  }

  const [detail, skillBundle, clientFiles, clientData] = await Promise.all([
    getSkillDetail(skillId),
    loadSkillBundle(supabase, skillId),
    loadClientFiles(supabase, clientId),
    supabase.from("clients").select("name").eq("id", clientId).maybeSingle(),
  ])

  if (!detail?.skill) {
    return {
      success: false,
      title: "",
      content: "",
      error: `Skill "${skillId}" tidak ditemukan di database.`,
    }
  }

  const skill = detail.skill
  const clientName = clientData?.data?.name || "Klien"
  const brandCtx = brandContext(clientName, clientFiles)

  // Tandai skill berstatus 'jalan'
  await updateClientSkillStatus(clientId, skillId, "jalan")

  const systemPrompt = `
[ROLE & EXPERTISE]
You are an expert Social Media & Marketing Consultant acting on behalf of ${clientName}.
You are executing the specialized playbook "${skill.name}" (${skill.id}).
Your mission is to generate a comprehensive, executive-grade deliverable in Indonesian (Bahasa Indonesia profesional) based on the authoritative playbook guidelines and brand context.

[BRAND CONTEXT]
Adhere strictly to the brand voice, tone, and guardrails below:
---
${brandCtx}
---

[AUTHORITATIVE SKILL PLAYBOOK & INSTRUCTIONS]
Follow the guidelines, frameworks, and requirements from this official playbook:
---
${skillBundle || "Execute standard industry best practices for " + skill.name}
---

${parameters && Object.keys(parameters).length > 0 ? `[PARAMETERS]\n${JSON.stringify(parameters, null, 2)}\n` : ""}
[OUTPUT SPECIFICATION (CRITICAL)]
You MUST return valid JSON ONLY with this exact schema:
{
  "title": "Document Title in Indonesian",
  "summary": "1-2 sentence executive summary of the document",
  "content": "Full, complete, production-ready deliverable in structured GitHub-flavored Markdown. Include all required sections, strategic rationale, and copy according to the playbook."
}
`

  try {
    const userPrompt =
      prompt?.trim() ||
      `Tolong jalankan playbook ${skill.name} untuk menyusun strategi/konten terlengkap bagi brand ${clientName}.`

    const { data: result, usage } = await chatJsonDetailed<{
      title?: string
      summary?: string
      content?: string
    }>(provider, systemPrompt, [{ role: "user", content: userPrompt }])

    const title = result?.title || `${skill.name} — ${clientName}`
    const content = result?.content || ""
    const summary = result?.summary || ""

    if (!content) {
      throw new Error("AI tidak menghasilkan konten dokumen.")
    }

    let outputId: string | null = null

    if (autoSave) {
      const saveRes = await saveSkillOutput({
        clientId,
        skillId,
        title,
        content,
        stage: skill.category,
        status: "draft",
      })
      if (saveRes.success) {
        outputId = saveRes.id ?? null
      }
    }

    const { data: authUser } = await supabase.auth.getUser()
    await logAiUsage({
      userId: authUser?.user?.id ?? null,
      clientId,
      route: "skill.generic_runner",
      model: provider.model,
      providerKind: provider.kind,
      promptTokens: usage?.promptTokens ?? 0,
      completionTokens: usage?.completionTokens ?? 0,
      latencyMs: Date.now() - start,
    })

    return {
      success: true,
      title,
      content,
      summary,
      outputId,
      tokensUsed: usage
        ? { promptTokens: usage.promptTokens, completionTokens: usage.completionTokens }
        : undefined,
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error("skills.executeGenericSkill.failed", { skillId, clientId, error: msg })
    return {
      success: false,
      title: "",
      content: "",
      error: msg || "Gagal mengeksekusi generic skill runner",
    }
  }
}


