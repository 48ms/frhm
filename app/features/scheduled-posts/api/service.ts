"use server"

import { createClient } from "@/lib/supabase/server"
import type { 
  ScheduledPost, 
  CreateScheduledPostInput,
  UpdateScheduledPostInput
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

export async function createScheduledPost(input: CreateScheduledPostInput): Promise<ScheduledPost> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("scheduled_posts")
    .insert([input])
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
