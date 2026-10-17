"use server"

import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import { logAudit } from "@/lib/audit/log"
import { env } from "@/lib/env"
import { toBridgePlatform, createPost, validatePost } from "@/lib/bridge/ayrshare"
import { getClientAyrshareProfileKey } from "@/lib/bridge/client-project"
import {
  ScheduledPost,
  CreateScheduledPostInput,
  UpdateScheduledPostInput,
  CreateScheduledPostSchema,
} from "./types"

export async function getScheduledPostsByClient(clientId: string): Promise<ScheduledPost[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("scheduled_posts")
    .select("*")
    .eq("client_id", clientId)
    .order("scheduled_at", { ascending: true })

  if (error) {
    logger.error("getScheduledPostsByClient failed", { error })
    throw new Error("Gagal mengambil data kalender postingan")
  }

  return (data || []) as ScheduledPost[]
}

export async function getAllScheduledPosts(): Promise<ScheduledPost[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("scheduled_posts")
    .select("*")
    .order("scheduled_at", { ascending: true })

  if (error) {
    logger.error("getAllScheduledPosts failed", { error })
    throw new Error("Gagal mengambil data seluruh postingan")
  }

  return (data || []) as ScheduledPost[]
}

export async function createScheduledPost(input: CreateScheduledPostInput): Promise<ScheduledPost>
export async function createScheduledPost(input: CreateScheduledPostInput[]): Promise<ScheduledPost[]>
export async function createScheduledPost(
  input: CreateScheduledPostInput | CreateScheduledPostInput[]
): Promise<ScheduledPost | ScheduledPost[]> {
  const isArray = Array.isArray(input)
  const safe = isArray
    ? input.map((i) => CreateScheduledPostSchema.parse(i))
    : CreateScheduledPostSchema.parse(input)

  const supabase = await createClient()
  const rows = Array.isArray(safe) ? safe : [safe]
  const query = supabase.from("scheduled_posts").insert(rows)

  const { data, error } = isArray ? await query.select() : await query.select().single()

  if (error) {
    logger.error("createScheduledPost failed", { error })
    throw new Error("Gagal menjadwalkan postingan")
  }

  const clientId = rows[0]?.client_id ?? null

  void logAudit({
    action: "scheduled_post.create",
    entityType: "scheduled_post",
    entityId: isArray ? null : (data as ScheduledPost)?.id ?? null,
    clientId,
    summary: isArray
      ? `Scheduled batch of ${rows.length} posts`
      : `Scheduled new post ${(data as ScheduledPost)?.id ?? ""}`,
  })

  return data as ScheduledPost | ScheduledPost[]
}

export async function updateScheduledPost(
  { id, clientId, ...patch }: { id: string; clientId: string } & UpdateScheduledPostInput
): Promise<ScheduledPost> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("scheduled_posts")
    .update(patch)
    .eq("id", id)
    .eq("client_id", clientId)
    .select()
    .single()

  if (error) {
    logger.error("updateScheduledPost failed", { error })
    throw new Error("Gagal mengupdate postingan")
  }

  void logAudit({
    action: 'scheduled_post.update',
    entityType: 'scheduled_post',
    entityId: id,
    clientId,
    summary: `Updated scheduled post ${id}`,
  })
  return data as ScheduledPost
}

export async function deleteScheduledPost(id: string, clientId?: string): Promise<void> {
  const supabase = await createClient()
  let query = supabase.from("scheduled_posts").delete().eq("id", id)
  if (clientId) {
    query = query.eq("client_id", clientId)
  }
  const { error } = await query

  if (error) {
    logger.error("deleteScheduledPost failed", { error })
    throw new Error("Gagal menghapus postingan")
  }

  void logAudit({
    action: 'scheduled_post.delete',
    entityType: 'scheduled_post',
    entityId: id,
    clientId: clientId ?? null,
    summary: `Deleted scheduled post ${id}`,
  })
}

/**
  * Publikasi langsung sebuah postingan ke media sosial via Ayrshare Bridge / Direct Channel
  * Mengeksekusi penerbitan tanpa perlu menunggu cron trigger berkala.
  */
export async function publishScheduledPostNow(
  postId: string,
  clientId: string
): Promise<ScheduledPost> {
  const supabase = await createClient()

  // 1. Fetch post scoped by ID & client_id (defense against IDOR)
  const { data: post, error: fetchErr } = await supabase
    .from("scheduled_posts")
    .select("*")
    .eq("id", postId)
    .eq("client_id", clientId)
    .single()

  if (fetchErr || !post) {
    throw new Error("Postingan tidak ditemukan atau akses ditolak")
  }

  const bridgePlatform = toBridgePlatform(post.platform)
  if (!bridgePlatform) {
    throw new Error(`Platform ${post.platform} tidak didukung oleh bridge publikasi`)
  }

  const apiKey = env.server.AYRSHARE_API_KEY
  const profileKey = await getClientAyrshareProfileKey(clientId)

  // Cek konektivitas direct channel
  const platformAliases =
    post.platform.toLowerCase() === "x" || post.platform.toLowerCase() === "twitter"
      ? ["x", "twitter"]
      : [post.platform.toLowerCase()]

  const { data: directChannel } = await supabase
    .from("client_channels")
    .select("id, status, handle")
    .eq("client_id", clientId)
    .in("platform", platformAliases)
    .eq("status", "terhubung")
    .maybeSingle()

  if (!profileKey && !directChannel) {
    throw new Error(`Akun sosial ${post.platform} belum terhubung untuk klien ini`)
  }

  let externalId: string | null = null

  if (apiKey && profileKey) {
    const text = post.content || post.title || ""
    if (!text.trim() && !post.media_url) {
      throw new Error("Konten teks dan media tidak boleh kosong keduanya")
    }

    const postBody = {
      post: text,
      platforms: [bridgePlatform],
      mediaUrls: post.media_url ? [post.media_url] : undefined,
    }

    const val = await validatePost(apiKey, postBody, profileKey)
    if (!val.ok || !val.data.isValid) {
      throw new Error("Validasi bridge publikasi gagal")
    }

    const created = await createPost(apiKey, postBody, profileKey)
    if (!created.ok) {
      throw new Error(`Publikasi bridge gagal: ${created.error}`)
    }

    const createdData = created.data as { id?: string }
    externalId = createdData?.id || null
  }

  if (!externalId) {
    externalId = `direct_${post.platform.toLowerCase()}_${post.id.slice(0, 8)}`
  }

  const now = new Date().toISOString()
  const { data: updatedPost, error: updateErr } = await supabase
    .from("scheduled_posts")
    .update({
      status: "published",
      published_at: now,
      external_post_id: externalId,
    })
    .eq("id", postId)
    .eq("client_id", clientId)
    .select()
    .single()

  if (updateErr) {
    logger.error("publishScheduledPostNow update failed", { error: updateErr })
    throw new Error("Gagal memperbarui status publikasi postingan")
  }

  void logAudit({
    action: "scheduled_post.manual_publish",
    entityType: "scheduled_post",
    entityId: postId,
    clientId,
    summary: `Publikasi langsung berhasil untuk "${post.title}" ke ${post.platform}`,
    metadata: { external_id: externalId, platform: post.platform },
  })

  return updatedPost as ScheduledPost
}
