"use server"

import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import { logAudit } from "@/lib/audit/log"
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
