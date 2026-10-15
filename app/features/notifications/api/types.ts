import { z } from 'zod'

export type NotificationChannel = 'whatsapp' | 'telegram'
export type NotificationStatus = 'sent' | 'ready' | 'failed' | 'skipped'

export interface DispatchReviewNotificationInput {
  deliverableId: string
  channels: NotificationChannel[]
  customNote?: string
}

export interface DispatchChannelResult {
  channel: NotificationChannel
  success: boolean
  status: NotificationStatus
  clickUrl?: string
  messageId?: string | number
  error?: string
}

export interface DispatchReviewNotificationResponse {
  deliverableId: string
  clientName: string
  reviewUrl: string
  results: DispatchChannelResult[]
}

export interface NotificationTargetInfo {
  deliverableId: string
  title: string
  type: string
  status: string
  campaignTag?: string
  previewUrl?: string
  client: {
    id: string
    name: string
    contactPhone: string | null
    telegramChatId: string | null
    telegramEnabled: boolean
  }
  reviewUrl: string
  suggestedWhatsAppMessage: string
  suggestedTelegramMessage: string
}

export interface TestNotificationInput {
  channel: NotificationChannel
  destination: string
  clientName?: string
}

export interface TestNotificationResult {
  success: boolean
  channel: NotificationChannel
  destination: string
  status: NotificationStatus
  clickUrl?: string
  messageId?: string | number
  error?: string
}

export const dispatchReviewNotificationSchema = z.object({
  deliverableId: z.string().min(1, 'ID deliverable tidak valid'),
  channels: z
    .array(z.enum(['whatsapp', 'telegram']))
    .min(1, 'Pilih setidaknya satu kanal notifikasi'),
  customNote: z.string().optional(),
})

export const testNotificationSchema = z.object({
  channel: z.enum(['whatsapp', 'telegram']),
  destination: z.string().min(1, 'Tujuan notifikasi wajib diisi'),
  clientName: z.string().optional(),
})
