import { z } from "zod"

export const PostStatusSchema = z.enum(["draft", "scheduled", "published", "failed", "cancelled"])
export type PostStatus = z.infer<typeof PostStatusSchema>

export const ScheduledPostSchema = z.object({
  id: z.string().uuid(),
  client_id: z.string().uuid(),
  title: z.string(),
  content: z.string(),
  platform: z.string(),
  scheduled_at: z.string(), // ISO string
  status: PostStatusSchema,
  media_url: z.string().optional().nullable(),
  author: z.string().optional().nullable(),
  deliverable_id: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  is_reserved: z.boolean().optional().nullable(),
  is_placeholder: z.boolean().optional().nullable(),
  reserved_for: z.string().optional().nullable(),
  reserved_until: z.string().optional().nullable(),
  priority: z.string().optional().nullable(),
  campaign_tag: z.string().optional().nullable(),
  created_at: z.string(),
})

export type ScheduledPost = z.infer<typeof ScheduledPostSchema>

export const CreateScheduledPostSchema = ScheduledPostSchema.omit({ 
  id: true, 
  created_at: true 
})
export type CreateScheduledPostInput = z.infer<typeof CreateScheduledPostSchema>

export const UpdateScheduledPostSchema = CreateScheduledPostSchema.partial()
export type UpdateScheduledPostInput = z.infer<typeof UpdateScheduledPostSchema>
