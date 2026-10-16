import { z } from "zod"
import type { FrahmaClient, ClientWithChannels } from "@/features/social-accounts/api/types"

export type { FrahmaClient, ClientWithChannels }

export const UpdateClientSchema = z.object({
  id: z.string().min(1, "ID client tidak valid"),
  name: z.string().min(1, "Nama brand wajib diisi").max(100, "Nama brand maksimal 100 karakter"),
  contact_email: z.string().email("Format email tidak valid").nullable().optional().or(z.literal("")),
  contact_phone: z.string().nullable().optional(),
  telegram_chat_id: z.string().nullable().optional(),
  niche: z.string().nullable().optional(),
  tagline: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
})

export type UpdateClientInput = z.infer<typeof UpdateClientSchema>

export const DeleteClientSchema = z.object({
  id: z.string().uuid("ID client tidak valid"),
  confirmName: z.string().min(1, "Konfirmasi nama wajib diisi"),
})

export type DeleteClientInput = z.infer<typeof DeleteClientSchema>
