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

export async function createScheduledPost(input: CreateScheduledPostInput): Promise<ScheduledPost> {
  // Server-side validation: reject malformed input before hitting Supabase.
  const safe = CreateScheduledPostSchema.parse(input)

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("scheduled_posts")
    .insert([safe])
    .select()
    .single()

  if (error) {
    logger.error("createScheduledPost failed", { error })
    throw new Error("Gagal menjadwalkan postingan")
  }

  void logAudit({
    action: 'scheduled_post.create',
    entityType: 'scheduled_post',
    entityId: data?.id ?? null,
    clientId: safe.client_id ?? null,
    summary: `Scheduled new post ${data?.id ?? ''}`,
  })
  return data as ScheduledPost
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
