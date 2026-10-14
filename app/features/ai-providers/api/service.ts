"use server"

import { createClient } from "@/lib/supabase/server"
import { createSupabaseServiceClient } from "@/lib/supabase/service"
import {
  CreateAiProviderSchema,
  UpdateAiProviderSchema,
  type CreateAiProviderInput,
  type UpdateAiProviderInput,
  type AiProviderMasked,
} from "./types"

async function assertAdmin(): Promise<string> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized: no session")

  const { data: profile, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (error || profile?.role !== "admin") {
    throw new Error("Forbidden: only administrators can manage AI providers")
  }
  return user.id
}

function maskKey(key: string | null | undefined): { has_key: boolean; masked_key: string } {
  if (!key || key.trim() === "") {
    return { has_key: false, masked_key: "" }
  }
  const clean = key.trim()
  if (clean.length <= 8) {
    return { has_key: true, masked_key: "••••••••" }
  }
  return { has_key: true, masked_key: `••••••••${clean.slice(-4)}` }
}

export async function getAiProviders(): Promise<AiProviderMasked[]> {
  await assertAdmin()
  const admin = createSupabaseServiceClient()
  const { data, error } = await admin
    .from("ai_providers")
    .select("id, label, kind, model, base_url, api_key, is_default, created_at")
    .order("created_at", { ascending: false })

  if (error) throw new Error(`Failed to fetch AI providers: ${error.message}`)

  return (data || []).map((p: any) => {
    const { has_key, masked_key } = maskKey(p.api_key)
    return {
      id: p.id,
      label: p.label,
      kind: p.kind,
      model: p.model,
      base_url: p.base_url,
      is_default: p.is_default,
      created_at: p.created_at,
      has_key,
      masked_key,
    }
  })
}

export async function createAiProvider(input: CreateAiProviderInput): Promise<AiProviderMasked> {
  await assertAdmin()
  const validated = CreateAiProviderSchema.parse(input)
  const admin = createSupabaseServiceClient()

  if (validated.is_default) {
    await admin
      .from("ai_providers")
      .update({ is_default: false })
      .neq("id", "00000000-0000-0000-0000-000000000000")
  }

  const { data, error } = await admin
    .from("ai_providers")
    .insert({
      label: validated.label,
      kind: validated.kind,
      model: validated.model,
      base_url: validated.base_url?.trim() || null,
      api_key: validated.api_key?.trim() || null,
      is_default: validated.is_default,
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to create AI provider: ${error.message}`)

  const { has_key, masked_key } = maskKey(data.api_key)
  return {
    id: data.id,
    label: data.label,
    kind: data.kind,
    model: data.model,
    base_url: data.base_url,
    is_default: data.is_default,
    created_at: data.created_at,
    has_key,
    masked_key,
  }
}

export async function updateAiProvider(
  id: string,
  input: UpdateAiProviderInput
): Promise<AiProviderMasked> {
  await assertAdmin()
  const validated = UpdateAiProviderSchema.parse(input)
  const admin = createSupabaseServiceClient()

  if (validated.is_default) {
    await admin.from("ai_providers").update({ is_default: false }).neq("id", id)
  }

  const updatePayload: Record<string, any> = {}
  if (validated.label !== undefined) updatePayload.label = validated.label
  if (validated.kind !== undefined) updatePayload.kind = validated.kind
  if (validated.model !== undefined) updatePayload.model = validated.model
  if (validated.base_url !== undefined) updatePayload.base_url = validated.base_url?.trim() || null
  if (validated.api_key !== undefined && validated.api_key.trim() !== "") {
    updatePayload.api_key = validated.api_key.trim()
  }
  if (validated.is_default !== undefined) updatePayload.is_default = validated.is_default

  const { data, error } = await admin
    .from("ai_providers")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(`Failed to update AI provider: ${error.message}`)

  const { has_key, masked_key } = maskKey(data.api_key)
  return {
    id: data.id,
    label: data.label,
    kind: data.kind,
    model: data.model,
    base_url: data.base_url,
    is_default: data.is_default,
    created_at: data.created_at,
    has_key,
    masked_key,
  }
}

export async function deleteAiProvider(id: string): Promise<void> {
  await assertAdmin()
  const admin = createSupabaseServiceClient()

  const { data: target } = await admin
    .from("ai_providers")
    .select("is_default")
    .eq("id", id)
    .single()

  if (target?.is_default) {
    const { count } = await admin
      .from("ai_providers")
      .select("*", { count: "exact", head: true })

    if (count && count > 1) {
      throw new Error(
        "Tidak dapat menghapus provider default. Jadikan provider lain sebagai default terlebih dahulu."
      )
    }
  }

  const { error } = await admin.from("ai_providers").delete().eq("id", id)
  if (error) throw new Error(`Failed to delete AI provider: ${error.message}`)
}

export async function setDefaultAiProvider(id: string): Promise<void> {
  await assertAdmin()
  const admin = createSupabaseServiceClient()

  await admin.from("ai_providers").update({ is_default: false }).neq("id", id)
  const { error } = await admin.from("ai_providers").update({ is_default: true }).eq("id", id)
  if (error) throw new Error(`Failed to set default AI provider: ${error.message}`)
}

export async function testAiProviderConnection(
  id: string
): Promise<{ success: boolean; latencyMs: number; message: string }> {
  await assertAdmin()
  const admin = createSupabaseServiceClient()
  const { data: provider, error } = await admin
    .from("ai_providers")
    .select("kind, model, base_url, api_key")
    .eq("id", id)
    .single()

  if (error || !provider) {
    throw new Error("Provider tidak ditemukan.")
  }

  const start = Date.now()
  try {
    const { chat } = await import("@/lib/ai/providers")
    const res = await chat(provider, "Ping connection test. Reply with word: READY", [
      { role: "user", content: "TEST_CONNECTION" },
    ])
    const latencyMs = Date.now() - start
    return {
      success: true,
      latencyMs,
      message: `Koneksi berhasil (${latencyMs}ms): "${res.trim().slice(0, 40)}"`,
    }
  } catch (err: unknown) {
    const latencyMs = Date.now() - start
    const errMsg = err instanceof Error ? err.message : "Gagal terhubung ke provider"
    return {
      success: false,
      latencyMs,
      message: `Tes koneksi gagal: ${errMsg}`,
    }
  }
}
