import { z } from "zod"

export type SocialAccountStatus = "belum" | "terhubung" | "gagal"
export type SocialPlatform = "instagram" | "tiktok" | "youtube" | "linkedin" | "twitter" | "facebook"

export type ClientChannel = {
  id: string
  client_id: string
  platform: SocialPlatform
  handle: string | null
  status: SocialAccountStatus
  note: string | null
  avatar_url: string | null
  confirmed_at: string | null
  created_at: string
  updated_at: string
}

export const BrandProfileSchema = z.object({
  who: z.string(),
  audience: z.string(),
  voice: z.string(),
  pov: z.string(),
  proof: z.string(),
  guardrails: z.string(),
  pillars: z.array(z.string()),
})
export type BrandProfile = z.infer<typeof BrandProfileSchema>

export const GenerateBrandProfileInputSchema = z.object({
  rawMaterial: z.string(),
  industry: z.string().optional(),
})
export type GenerateBrandProfileInput = z.infer<typeof GenerateBrandProfileInputSchema>

export type FrahmaClient = {
  id: string
  name: string
  contact_email: string | null
  contact_phone: string | null
  brand_profile: BrandProfile
  created_at: string
  updated_at: string
}

export type ClientWithChannels = FrahmaClient & {
  channels: ClientChannel[]
  dashboard_profile?: {
    audience_size: string | number
    [key: string]: any
  }
}
