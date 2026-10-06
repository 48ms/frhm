"use server"

import { createClient } from "@/lib/supabase/server"
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
    console.error("Error fetching scheduled posts:", error)
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
    console.error("Error fetching all scheduled posts:", error)
    throw new Error("Gagal mengambil data seluruh postingan")
  }

  return (data || []) as ScheduledPost[]
}

export async function createScheduledPost(input: CreateScheduledPostInput): Promise<ScheduledPost> {
  // Server-side validation: reject malformed input before hitting Supabase.
  // Without this, a missing client_id or invalid status would reach the DB
  // and rely solely on RLS — which only catches tenant leakage, not schema
  // corruption. Zod parse throws with a descriptive error if the shape is
  // wrong, keeping bad data out of scheduled_posts.
  const safe = CreateScheduledPostSchema.parse(input)

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("scheduled_posts")
    .insert([safe])
    .select()
    .single()

  if (error) {
    console.error("Error creating scheduled post:", error)
    throw new Error("Gagal menjadwalkan postingan")
  }

  return data as ScheduledPost
}

export async function updateScheduledPost({ id, ...patch }: { id: string } & UpdateScheduledPostInput): Promise<ScheduledPost> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("scheduled_posts")
    .update(patch)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating scheduled post:", error)
    throw new Error("Gagal mengupdate postingan")
  }

  return data as ScheduledPost
}

export async function deleteScheduledPost(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("scheduled_posts")
    .delete()
    .eq("id", id)

  if (error) {
    console.error("Error deleting scheduled post:", error)
    throw new Error("Gagal menghapus postingan")
  }
}
