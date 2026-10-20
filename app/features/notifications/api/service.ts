"use server"

import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import { logAudit } from "@/lib/audit/log"
import {
  formatReviewNotificationMessage,
  sendWhatsAppNotification,
  normalizeWhatsAppPhone,
} from "@/lib/whatsapp/service"
import {
  sendTelegramMessage,
  TelegramButton,
} from "@/lib/telegram/service"
import { buildReviewUrl } from "@/lib/review/token"
import {
  dispatchReviewNotificationSchema,
  testNotificationSchema,
  type DispatchReviewNotificationInput,
  type DispatchReviewNotificationResponse,
  type DispatchChannelResult,
  type NotificationTargetInfo,
  type TestNotificationInput,
  type TestNotificationResult,
} from "./types"

/**
 * AGENTS.md Rule 2: Service Layer 3-Lapis per Fitur (service.ts)
 * Data access & business logic murni untuk pengiriman notifikasi review dan multi-channel webhook.
 */

export async function getNotificationTargetForDeliverable(
  deliverableId: string
): Promise<NotificationTargetInfo | null> {
  if (!deliverableId) return null

  const supabase = await createClient()

  // 1. Ambil data deliverable
  const { data: deliverable, error: delError } = await supabase
    .from("deliverables")
    .select("*")
    .eq("id", deliverableId)
    .maybeSingle()

  if (delError || !deliverable) {
    logger.warn("notification.deliverable_not_found", { deliverableId, error: delError?.message })
    return null
  }

  // 2. Ambil data client terkait
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, name, contact_phone, telegram_chat_id, telegram_notif_enabled")
    .eq("id", deliverable.client_id)
    .maybeSingle()

  if (clientError || !client) {
    logger.warn("notification.client_not_found", { clientId: deliverable.client_id })
    return null
  }

  const reviewUrl = buildReviewUrl(deliverable.id)
  if (!reviewUrl) {
    throw new Error("Tautan review belum dikonfigurasi di server.")
  }

  const suggestedWhatsAppMessage = formatReviewNotificationMessage({
    clientName: client.name,
    title: deliverable.title,
    reviewUrl,
    previewUrl: deliverable.external_link || undefined,
  })

  const suggestedTelegramMessage = [
    `<b>Konten Baru Siap Direview</b>`,
    ``,
    `Halo tim <b>${client.name}</b>,`,
    `Materi konten baru telah selesai diproduksi dan siap untuk ditinjau:`,
    ``,
    `<b>Judul:</b> ${deliverable.title}`,
    ``,
    `Silakan buka portal review Frhm untuk memeriksa materi atau menyetujui langsung.`,
  ].join("\n")

  return {
    deliverableId: deliverable.id,
    title: deliverable.title,
    type: deliverable.type,
    status: deliverable.status,
    previewUrl: deliverable.external_link || undefined,
    client: {
      id: client.id,
      name: client.name,
      contactPhone: client.contact_phone || null,
      telegramChatId: client.telegram_chat_id || null,
      telegramEnabled: !!client.telegram_notif_enabled,
    },
    reviewUrl,
    suggestedWhatsAppMessage,
    suggestedTelegramMessage,
  }
}

export async function dispatchReviewNotification(
  rawInput: DispatchReviewNotificationInput
): Promise<DispatchReviewNotificationResponse> {
  const input = dispatchReviewNotificationSchema.parse(rawInput)
  const target = await getNotificationTargetForDeliverable(input.deliverableId)

  if (!target) {
    throw new Error("Deliverable atau klien tidak ditemukan.")
  }

  const results: DispatchChannelResult[] = []

  // 1. Eksekusi kanal WhatsApp jika dipilih
  if (input.channels.includes("whatsapp")) {
    if (!target.client.contactPhone) {
      results.push({
        channel: "whatsapp",
        success: false,
        status: "failed",
        error: "Nomor WhatsApp klien belum dikonfigurasi.",
      })
    } else {
      const messageText = input.customNote
        ? `${target.suggestedWhatsAppMessage}\n\n💬 *Catatan:* ${input.customNote}`
        : target.suggestedWhatsAppMessage

      const waRes = await sendWhatsAppNotification({
        phone: target.client.contactPhone,
        text: messageText,
        recipientType: "client",
        recipientId: target.client.id,
        deliverableId: target.deliverableId,
        eventType: "deliverable.review_requested",
      })

      results.push({
        channel: "whatsapp",
        success: waRes.success,
        status: waRes.status,
        clickUrl: waRes.clickUrl,
        messageId: waRes.messageId,
        error: waRes.error,
      })
    }
  }

  // 2. Eksekusi kanal Telegram jika dipilih
  if (input.channels.includes("telegram")) {
    if (!target.client.telegramChatId) {
      results.push({
        channel: "telegram",
        success: false,
        status: "skipped",
        error: "Akun Telegram klien belum terhubung.",
      })
    } else {
      const tgText = input.customNote
        ? `${target.suggestedTelegramMessage}\n\n<b>Catatan:</b> ${input.customNote}`
        : target.suggestedTelegramMessage

      const buttons: TelegramButton[][] = [
        [
          {
            text: "Buka Portal Review",
            url: target.reviewUrl,
          },
        ],
      ]

      if (target.previewUrl) {
        buttons[0].push({
          text: "File Media",
          url: target.previewUrl,
        })
      }

      const tgRes = await sendTelegramMessage({
        chatId: target.client.telegramChatId,
        text: tgText,
        parseMode: "HTML",
        buttons,
        recipientType: "client",
        recipientId: target.client.id,
        eventType: "deliverable.review_requested",
      })

      results.push({
        channel: "telegram",
        success: tgRes.success,
        status: tgRes.success ? "sent" : "failed",
        messageId: tgRes.messageId,
        error: tgRes.error,
      })
    }
  }

  // Log Audit trail
  await logAudit({
    action: "notification.review_dispatched",
    entityType: "deliverable",
    entityId: target.deliverableId,
    clientId: target.client.id,
    summary: `Notifikasi review konten ${target.title} disiapkan untuk ${target.client.name}`,
    metadata: {
      channels: input.channels,
      results,
    },
  })

  return {
    deliverableId: target.deliverableId,
    clientName: target.client.name,
    reviewUrl: target.reviewUrl,
    results,
  }
}

export async function testNotificationDispatch(
  rawInput: TestNotificationInput
): Promise<TestNotificationResult> {
  const input = testNotificationSchema.parse(rawInput)

  if (input.channel === "telegram") {
    const text = [
      `🧪 <b>Uji Coba Notifikasi Frhm</b>`,
      ``,
      `Koneksi Telegram berhasil terhubung dengan sistem Frhm Marketing Platform.`,
      `Waktu uji: ${new Date().toLocaleString("id-ID")}`,
    ].join("\n")

    const res = await sendTelegramMessage({
      chatId: input.destination,
      text,
      parseMode: "HTML",
      eventType: "test_ping",
    })

    return {
      success: res.success,
      channel: "telegram",
      destination: input.destination,
      status: res.success ? "sent" : "failed",
      messageId: res.messageId,
      error: res.error,
    }
  }

  if (input.channel === "whatsapp") {
    const normalized = normalizeWhatsAppPhone(input.destination)
    const text = [
      `🧪 *Uji Coba Notifikasi Frhm*`,
      ``,
      `Koneksi WhatsApp berhasil terhubung dengan sistem Frhm Marketing Platform.`,
      `Waktu uji: ${new Date().toLocaleString("id-ID")}`,
    ].join("\n")

    const res = await sendWhatsAppNotification({
      phone: normalized,
      text,
      eventType: "test_ping",
    })

    return {
      success: res.success,
      channel: "whatsapp",
      destination: normalized,
      status: res.status,
      clickUrl: res.clickUrl,
      messageId: res.messageId,
      error: res.error,
    }
  }

  throw new Error("Kanal tidak didukung.")
}
