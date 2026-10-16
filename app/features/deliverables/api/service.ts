"use server"

import { createClient } from "@/lib/supabase/server"
import { createSupabaseServiceClient } from "@/lib/supabase/service"
import { logger } from "@/lib/logger"
import { env } from "@/lib/env"
import { logAudit } from "@/lib/audit/log"
import {
  createDeliverableSchema,
  promoteSkillOutputSchema,
  updateDeliverableStatusSchema,
  submitDeliverableReviewSchema,
  scheduleDeliverableSchema,
  type CreateDeliverableInput,
  type PromoteSkillOutputInput,
  type UpdateDeliverableStatusInput,
  type SubmitDeliverableReviewInput,
  type ScheduleDeliverableInput,
} from "./schema"
import type { Deliverable, DeliverableType, DeliverableDetailResponse } from "./types"
import type { ScheduledPost } from "@/features/scheduled-posts/api/types"
import { sendTelegramMessage } from "@/lib/telegram/service"

/**
 * Service Layer untuk Deliverables.
 * 100% Supabase Auth & PostgreSQL RLS (sesuai aturan Frhm).
 * Degrade gracefully -> [] saat error agar useSuspenseQuery tidak reject saat render.
 */
export async function getDeliverablesByClient(clientId: string): Promise<Deliverable[]> {
  if (!clientId) return []
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("deliverables")
    .select("id, client_id, type, title, content_md, external_link, status, created_by, updated_by, created_at, updated_at, sent_at, approved_at")
    .eq("client_id", clientId)
    .order("updated_at", { ascending: false })

  if (error) {
    logger.error("getDeliverablesByClient failed", { error })
    return []
  }
  return (data ?? []) as Deliverable[]
}

export async function createDeliverable(input: CreateDeliverableInput): Promise<Deliverable> {
  const safe = createDeliverableSchema.parse(input)

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("deliverables")
    .insert({
      client_id: safe.clientId,
      type: safe.type as DeliverableType,
      title: safe.title,
      content_md: safe.content_md,
      external_link: safe.external_link || null,
      status: "draft",
    })
    .select()
    .single()

  if (error) {
    logger.error("createDeliverable failed", { error })
    throw new Error("Gagal membuat deliverable")
  }

  void logAudit({
    action: 'deliverable.create',
    entityType: 'deliverable',
    entityId: data?.id ?? null,
    clientId: safe.clientId ?? null,
    summary: `Created deliverable "${safe.title}"`,
  })

  return data as Deliverable
}

/**
 * Mempromosikan skill_output menjadi deliverable resmi yang dikirimkan ke klien.
 * Sesuai arsitektur 017_skill_outputs.sql:
 * - Menambahkan row baru di public.deliverables (status: 'sent')
 * - Mengupdate public.skill_outputs: deliverable_id = deliverable.id, status = 'sent'
 */
export async function promoteSkillOutputToDeliverable(
  input: PromoteSkillOutputInput
): Promise<{ success: boolean; deliverable?: Deliverable; error?: string }> {
  try {
    const safe = promoteSkillOutputSchema.parse(input)
    const service = createSupabaseServiceClient()

    // 1. Ambil output yang ingin dipromosikan
    const { data: output, error: fetchErr } = await service
      .from("skill_outputs")
      .select("id, client_id, skill_id, stage, title, content, status, deliverable_id")
      .eq("id", safe.outputId)
      .single()

    if (fetchErr || !output) {
      logger.error("promoteSkillOutputToDeliverable.fetchFailed", { error: fetchErr?.message })
      return { success: false, error: "Dokumen strategi tidak ditemukan" }
    }

    // Cegah cross-tenant: output harus milik client yang sama
    if (output.client_id && output.client_id !== safe.clientId) {
      logger.error("promoteSkillOutputToDeliverable.tenantMismatch", {
        outputClientId: output.client_id,
        requestedClientId: safe.clientId,
      })
      return { success: false, error: "Dokumen strategi tidak cocok dengan klien yang ditentukan" }
    }

    // Tentukan deliverable type: jika diberikan eksplisit, gunakan; jika tidak, deteksi dari skill_id
    let deliverableType: DeliverableType = safe.type || "content"
    if (!safe.type) {
      const sId = (output.skill_id || "").toLowerCase()
      if (sId.includes("report") || sId.includes("audit") || sId.includes("metric") || sId.includes("analytic")) {
        deliverableType = "report"
      } else if (sId.includes("brief") || sId.includes("strategy") || sId.includes("plan") || sId.includes("foundation")) {
        deliverableType = "brief"
      }
    }

    const now = new Date().toISOString()

    // 2. Insert ke deliverables
    const { data: deliverable, error: insertErr } = await service
      .from("deliverables")
      .insert({
        client_id: safe.clientId,
        type: deliverableType,
        title: output.title,
        content_md: output.content,
        status: "sent",
        sent_at: now,
      })
      .select()
      .single()

    if (insertErr || !deliverable) {
      logger.error("promoteSkillOutputToDeliverable.insertFailed", { error: insertErr?.message })
      return { success: false, error: insertErr?.message ?? "Gagal membuat deliverable" }
    }

    // 3. Update skill_outputs dengan deliverable_id dan status 'sent'
    const { error: updateErr } = await service
      .from("skill_outputs")
      .update({
        deliverable_id: deliverable.id,
        status: "sent",
        updated_at: now,
      })
      .eq("id", output.id)

    if (updateErr) {
      logger.warn("promoteSkillOutputToDeliverable.updateOutputWarn", { error: updateErr.message })
    }

    void logAudit({
      action: "deliverable.promote_from_skill_output",
      entityType: "deliverable",
      entityId: deliverable.id,
      clientId: safe.clientId,
      summary: `Dipromosikan dari skill output "${output.title}" (${output.skill_id})`,
    })

    return { success: true, deliverable: deliverable as Deliverable }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error("promoteSkillOutputToDeliverable.exception", { error: msg })
    return { success: false, error: msg ?? "Gagal mempromosikan dokumen" }
  }
}

/**
 * Memperbarui status deliverable (sent -> approved | revision_requested).
 * Secara otomatis mensinkronkan status skill_output terkait jika ada.
 */
export async function updateDeliverableStatus(
  input: UpdateDeliverableStatusInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const safe = updateDeliverableStatusSchema.parse(input)
    const service = createSupabaseServiceClient()

    const now = new Date().toISOString()
    const updatePayload: Record<string, any> = {
      status: safe.status,
      updated_at: now,
    }

    if (safe.status === "approved") {
      updatePayload.approved_at = now
    }

    let updateQuery = service
      .from("deliverables")
      .update(updatePayload)
      .eq("id", safe.deliverableId)

    if (safe.clientId) {
      updateQuery = updateQuery.eq("client_id", safe.clientId)
    }

    const { error: delivErr } = await updateQuery

    if (delivErr) {
      logger.error("updateDeliverableStatus.failed", { error: delivErr.message })
      return { success: false, error: delivErr.message }
    }

    // Sinkronkan ke skill_outputs terkait jika ada
    await service
      .from("skill_outputs")
      .update({
        status: safe.status,
        updated_at: now,
      })
      .eq("deliverable_id", safe.deliverableId)

    // Catat audit
    void logAudit({
      action: `deliverable.${safe.status}`,
      entityType: "deliverable",
      entityId: safe.deliverableId,
      clientId: safe.clientId,
      summary: `Status deliverable diubah menjadi "${safe.status}"`,
    })

    return { success: true }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error("updateDeliverableStatus.exception", { error: msg })
    return { success: false, error: msg ?? "Gagal memperbarui status" }
  }
}

/**
 * Mengambil detail sebuah deliverable beserta info client, komentar, dan feedback.
 * Digunakan untuk halaman review klien mandiri (/review/[id]).
 */
export async function getDeliverableById(
  deliverableId: string
): Promise<DeliverableDetailResponse | null> {
  if (!deliverableId) return null
  const service = createSupabaseServiceClient()

  try {
    const { data: deliverable, error: delivErr } = await service
      .from("deliverables")
      .select("id, client_id, type, title, content_md, external_link, status, created_by, updated_by, created_at, updated_at, sent_at, approved_at")
      .eq("id", deliverableId)
      .maybeSingle()

    if (delivErr || !deliverable) {
      logger.error("getDeliverableById failed", { error: delivErr?.message })
      return null
    }

    // Ambil data client
    const { data: client } = await service
      .from("clients")
      .select("id, name, brand_profile")
      .eq("id", deliverable.client_id)
      .maybeSingle()

    // Ambil komentar review
    const { data: comments } = await service
      .from("deliverable_comments")
      .select("id, deliverable_id, author_name, author_role, content, created_at")
      .eq("deliverable_id", deliverableId)
      .order("created_at", { ascending: true })

    // Ambil feedback bintang
    const { data: feedback } = await service
      .from("feedback")
      .select("id, deliverable_id, client_id, rating, title, comment, status, created_at")
      .eq("deliverable_id", deliverableId)
      .order("created_at", { ascending: false })

    return {
      deliverable: deliverable as Deliverable,
      client: client ?? null,
      comments: (comments ?? []) as any[],
      feedback: (feedback ?? []) as any[],
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error("getDeliverableById.exception", { error: msg })
    return null
  }
}

/**
 * Menyimpan review langsung dari sisi klien (approval atau revision_requested).
 * - Mengupdate deliverables.status dan approved_at
 * - Sinkronkan skill_outputs.status
 * - Menyimpan catatan feedback ke deliverable_comments & rating ke feedback
 * - Mengirim notifikasi real-time ke Telegram admin
 */
export async function submitDeliverableReview(
  input: SubmitDeliverableReviewInput
): Promise<{ success: boolean; deliverable?: Deliverable; error?: string }> {
  try {
    const safe = submitDeliverableReviewSchema.parse(input)
    const service = createSupabaseServiceClient()

    // 1. Ambil deliverable saat ini
    const { data: deliverable, error: fetchErr } = await service
      .from("deliverables")
      .select("id, client_id, title, content_md, type, status")
      .eq("id", safe.deliverableId)
      .maybeSingle()

    if (fetchErr || !deliverable) {
      return { success: false, error: "Deliverable tidak ditemukan" }
    }

    const { data: client } = await service
      .from("clients")
      .select("id, name")
      .eq("id", deliverable.client_id)
      .maybeSingle()

    const now = new Date().toISOString()
    const updatePayload: Record<string, any> = {
      status: safe.status,
      updated_at: now,
    }
    if (safe.status === "approved") {
      updatePayload.approved_at = now
    }

    // 2. Update status deliverable
    const { data: updatedDeliverable, error: updateErr } = await service
      .from("deliverables")
      .update(updatePayload)
      .eq("id", safe.deliverableId)
      .select()
      .single()

    if (updateErr) {
      logger.error("submitDeliverableReview.updateFailed", { error: updateErr.message })
      return { success: false, error: updateErr.message }
    }

    // 3. Sinkronkan status ke skill_outputs jika ada
    await service
      .from("skill_outputs")
      .update({
        status: safe.status,
        updated_at: now,
      })
      .eq("deliverable_id", safe.deliverableId)

    // 4. Jika ada feedback/komentar teks, simpan ke deliverable_comments
    if (safe.feedbackNote && safe.feedbackNote.trim()) {
      await service.from("deliverable_comments").insert({
        deliverable_id: safe.deliverableId,
        author_name: safe.clientAuthorName || client?.name || "Klien",
        author_role: "client",
        content: safe.feedbackNote.trim(),
      })
    }

    // 5. Jika ada rating bintang, simpan ke tabel feedback
    if (safe.rating) {
      await service.from("feedback").insert({
        client_id: deliverable.client_id,
        deliverable_id: safe.deliverableId,
        rating: safe.rating,
        title: `Review: ${deliverable.title}`,
        comment: safe.feedbackNote?.trim() || null,
        status: "acknowledged",
      })
    }

    // 6. Catat audit trail
    void logAudit({
      action: `deliverable.client_${safe.status}`,
      entityType: "deliverable",
      entityId: safe.deliverableId,
      clientId: deliverable.client_id,
      summary: `Klien ${client?.name || ""} memberikan review "${safe.status}" pada deliverable "${deliverable.title}"`,
    })

    // 7. Notifikasi Telegram Admin (non-blocking)
    try {
      const adminChatId = env.server.ADMIN_TELEGRAM_CHAT_ID || env.server.TELEGRAM_ADMIN_CHAT_ID
      if (adminChatId) {
        const statusBadge = safe.status === "approved" ? "DISETUJUI ✅" : "MINTA REVISI ⚠️"
        const stars = safe.rating ? "⭐".repeat(safe.rating) : "-"
        await sendTelegramMessage({
          chatId: adminChatId,
          text: `🔔 <b>[Frhm Client Portal Review]</b>\n\nKlien: <b>${client?.name || "Klien"}</b>\nDokumen: <b>${deliverable.title}</b>\nStatus: <b>${statusBadge}</b>\nRating: <b>${stars}</b>\n\nCatatan:\n<i>${safe.feedbackNote?.trim() || "Tidak ada catatan."}</i>`,
          parseMode: "HTML",
          recipientType: "admin",
          recipientId: "system",
          eventType: "deliverable_review_submitted",
        })
      }
    } catch (tgErr: unknown) {
      logger.warn("submitDeliverableReview.telegramFailed", { error: tgErr instanceof Error ? tgErr.message : String(tgErr) })
    }

    return { success: true, deliverable: updatedDeliverable as Deliverable }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error("submitDeliverableReview.exception", { error: msg })
    return { success: false, error: msg ?? "Terjadi kesalahan saat menyimpan review" }
  }
}

/**
 * Menjadwalkan deliverable yang sudah disetujui (Approved) ke kalender postingan sosial media (public.scheduled_posts).
 * Siap dipublish otomatis oleh /api/cron/publish atau WoopSocial MCP Bridge.
 */
export async function scheduleApprovedDeliverable(
  input: ScheduleDeliverableInput
): Promise<{ success: boolean; scheduledPost?: ScheduledPost; error?: string }> {
  try {
    const safe = scheduleDeliverableSchema.parse(input)
    const service = createSupabaseServiceClient()

    // 1. Verifikasi deliverable
    const { data: deliverable, error: delivErr } = await service
      .from("deliverables")
      .select("id, client_id, title, content_md, external_link, status, type")
      .eq("id", safe.deliverableId)
      .maybeSingle()

    if (delivErr || !deliverable) {
      return { success: false, error: "Deliverable tidak ditemukan" }
    }

    // Boundary check: deliverable harus milik client yang sama
    if (deliverable.client_id && deliverable.client_id !== safe.clientId) {
      logger.error("scheduleApprovedDeliverable.tenantMismatch", {
        deliverableClientId: deliverable.client_id,
        requestedClientId: safe.clientId,
      })
      return { success: false, error: "Deliverable tidak cocok dengan klien yang ditentukan" }
    }

    const { data: client } = await service
      .from("clients")
      .select("id, name")
      .eq("id", safe.clientId)
      .maybeSingle()

    const postTitle = safe.customTitle?.trim() || deliverable.title
    const postContent = safe.customContent?.trim() || deliverable.content_md || ""

    // 2. Insert ke scheduled_posts
    const newPostPayload = {
      client_id: safe.clientId,
      deliverable_id: safe.deliverableId,
      platform: safe.platform,
      title: postTitle,
      content: postContent,
      scheduled_at: safe.scheduledAt,
      status: "scheduled",
      media_url: safe.mediaUrl || deliverable.external_link || null,
      campaign_tag: safe.campaignTag || `#${deliverable.type || "deliverable"}`,
      priority: "high",
      author: "Frhm Auto-Schedule Engine",
    }

    const { data: scheduledPost, error: insertErr } = await service
      .from("scheduled_posts")
      .insert([newPostPayload])
      .select()
      .single()

    if (insertErr) {
      logger.error("scheduleApprovedDeliverable.insertFailed", { error: insertErr.message })
      return { success: false, error: insertErr.message }
    }

    // 3. Catat audit trail
    void logAudit({
      action: "scheduled_post.create_from_deliverable",
      entityType: "scheduled_post",
      entityId: scheduledPost.id,
      clientId: safe.clientId,
      summary: `Deliverable "${deliverable.title}" dijadwalkan ke ${safe.platform} pada ${safe.scheduledAt}`,
    })

    // 4. Notifikasi Telegram Admin (non-blocking)
    try {
      const adminChatId = env.server.ADMIN_TELEGRAM_CHAT_ID || env.server.TELEGRAM_ADMIN_CHAT_ID
      if (adminChatId) {
        const formattedDate = new Date(safe.scheduledAt).toLocaleString("id-ID", {
          dateStyle: "full",
          timeStyle: "short",
        })
        await sendTelegramMessage({
          chatId: adminChatId,
          text: `📅 <b>[Frhm Auto-Schedule Engine]</b>\n\nDeliverable: <b>${deliverable.title}</b>\nKlien: <b>${client?.name || "Klien"}</b>\nPlatform: <b>${safe.platform.toUpperCase()}</b>\nJadwal Tayang: <b>${formattedDate} WIB</b>\n\nStatus: <b>SCHEDULED ✅</b>`,
          parseMode: "HTML",
          recipientType: "admin",
          recipientId: "system",
          eventType: "deliverable_scheduled",
        })
      }
    } catch (tgErr: unknown) {
      logger.warn("scheduleApprovedDeliverable.telegramFailed", { error: tgErr instanceof Error ? tgErr.message : String(tgErr) })
    }

    return { success: true, scheduledPost: scheduledPost as ScheduledPost }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    logger.error("scheduleApprovedDeliverable.exception", { error: msg })
    return { success: false, error: msg ?? "Terjadi kesalahan saat menjadwalkan deliverable" }
  }
}

