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
