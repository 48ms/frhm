// Campaign data for the Luminous Space admin.
// Client identities + active-campaign counts + tags are lifted verbatim from the
// Stitch MCP prototype `033fb5596cc4441c8cd77031206b2e22.html`
// (window.appStore state.clients[]). The campaign records follow the real DB
// schema `content_campaigns(id, client_id, name, type, start_date, end_date,
// color, notes)` , see supabase/backup/full_backup_*.json.

export type CampaignType = "campaign" | "promo" | "event"



export const CAMPAIGN_TYPE_META: Record<
  CampaignType,
  { label: string; badge: string }
> = {
  campaign: { label: "Campaign", badge: "admin-badge-cobalt" },
  promo: { label: "Promo", badge: "admin-badge-lime" },
  event: { label: "Event", badge: "admin-badge-lavender" },
}
