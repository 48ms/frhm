export type CampaignType = "campaign" | "promo" | "event"

export type Campaign = {
  id: string
  client_id: string
  name: string
  type: CampaignType
  start_date: string | null
  end_date: string | null
  color: string | null
  notes: string | null
  created_at: string | null
}

export type CreateCampaignInput = Omit<Campaign, "id" | "created_at">
export type UpdateCampaignInput = Partial<CreateCampaignInput>
