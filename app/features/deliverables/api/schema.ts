import { z } from "zod"

/**
 * Skema validasi input `createDeliverable`.
 * Dipisah dari service.ts karena file itu memakai direktif "use server",
 * yang hanya boleh mengekspor fungsi async (Next.js build constraint).
 */
export const createDeliverableSchema = z.object({
  clientId: z.string().min(1, "Client ID wajib diisi"),
  type: z.enum(["brief", "content", "report"]),
  title: z.string().min(3, "Judul minimal 3 karakter").max(120, "Judul terlalu panjang"),
  content_md: z.string().default(""),
  external_link: z.string().url("URL eksternal tidak valid").or(z.literal("")).default(""),
})

export type CreateDeliverableInput = z.infer<typeof createDeliverableSchema>

export const promoteSkillOutputSchema = z.object({
  outputId: z.string().min(1, "Output ID tidak valid"),
  clientId: z.string().min(1, "Client ID wajib diisi"),
  type: z.enum(["brief", "content", "report"]).optional(),
})

export type PromoteSkillOutputInput = z.infer<typeof promoteSkillOutputSchema>

export const updateDeliverableStatusSchema = z.object({
  deliverableId: z.string().min(1, "Deliverable ID tidak valid"),
  clientId: z.string().min(1, "Client ID wajib diisi"),
  status: z.enum(["draft", "sent", "approved", "revision_requested"]),
  notes: z.string().optional(),
})

export type UpdateDeliverableStatusInput = z.infer<typeof updateDeliverableStatusSchema>

export const submitDeliverableReviewSchema = z.object({
  deliverableId: z.string().min(1, "Deliverable ID tidak valid"),
  reviewToken: z.string().optional(),
  status: z.enum(["approved", "revision_requested"]),
  feedbackNote: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  clientAuthorName: z.string().optional(),
})

export type SubmitDeliverableReviewInput = z.infer<typeof submitDeliverableReviewSchema>

export const scheduleDeliverableSchema = z.object({
  deliverableId: z.string().min(1, "Deliverable ID tidak valid"),
  clientId: z.string().min(1, "Client ID wajib diisi"),
  platform: z.string().min(1, "Platform wajib dipilih"),
  scheduledAt: z.string().refine((val) => !isNaN(Date.parse(val)), "Format tanggal/waktu tidak valid"),
  customTitle: z.string().optional(),
  customContent: z.string().optional(),
  mediaUrl: z.string().url("URL media tidak valid").or(z.literal("")).optional(),
  campaignTag: z.string().optional(),
})

export type ScheduleDeliverableInput = z.infer<typeof scheduleDeliverableSchema>
