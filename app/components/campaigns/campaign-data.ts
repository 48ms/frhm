// Campaign data for the Luminous Space admin.
// Client identities + active-campaign counts + tags are lifted verbatim from the
// Stitch MCP prototype `033fb5596cc4441c8cd77031206b2e22.html`
// (window.appStore state.clients[]). The campaign records follow the real DB
// schema `content_campaigns(id, client_id, name, type, start_date, end_date,
// color, notes)` , see supabase/backup/full_backup_*.json.

export type CampaignType = "campaign" | "promo" | "event"

export type Campaign = {
  id: string
  clientId: string
  name: string
  type: CampaignType
  startDate: string
  endDate: string
  color: string
  notes: string
  /** Derived display metrics (static mock , Supabase wiring deferred). */
  reach: string
  posts: number
  progress: number
}

export type CampaignClient = {
  id: string
  name: string
  shortName: string
  initials: string
  tagline: string
  reach: string
  reachGrowth: string
  activeCount: string
  tags: string[]
}

export const CAMPAIGN_CLIENTS: CampaignClient[] = [
  {
    id: "client-shell",
    name: "B2B Shell Representatives",
    shortName: "B2B Shell",
    initials: "BS",
    tagline: "Enterprise spatial computing & industrial IoT",
    reach: "1.4M",
    reachGrowth: "+14.2%",
    activeCount: "7 Live",
    tags: ["Summer Drop", "Brand Collab", "B2B"],
  },
  {
    id: "client-wizard",
    name: "E2E Wizard Corp",
    shortName: "Wizard Corp",
    initials: "WZ",
    tagline: "Developer toolchains & generative AI infrastructure",
    reach: "2.8M",
    reachGrowth: "+26.4%",
    activeCount: "11 Live",
    tags: ["DevCon 2026", "AI Engine V4", "Cloud Scale"],
  },
  {
    id: "client-aura",
    name: "Aura Luxury Group",
    shortName: "Aura Luxury",
    initials: "AL",
    tagline: "Haute couture & spatial fashion retail",
    reach: "980K",
    reachGrowth: "+32.8%",
    activeCount: "5 Live",
    tags: ["Milan Fall", "Sustainable Silk", "Fragrance Noir"],
  },
]

export const CAMPAIGNS: Campaign[] = [
  // B2B Shell Representatives
  {
    id: "cmp-shell-1",
    clientId: "client-shell",
    name: "Summer Drop 2026",
    type: "campaign",
    startDate: "2026-06-01",
    endDate: "2026-08-31",
    color: "#4353FF",
    notes: "Peluncuran koleksi musim panas dengan showcase 3D sound design.",
    reach: "620K",
    posts: 18,
    progress: 72,
  },
  {
    id: "cmp-shell-2",
    clientId: "client-shell",
    name: "Brand Collab — Spatial Series",
    type: "campaign",
    startDate: "2026-07-15",
    endDate: "2026-09-30",
    color: "#7D3AC0",
    notes: "Kolaborasi brand dengan creative director tamu untuk seri spatial UI.",
    reach: "410K",
    posts: 12,
    progress: 54,
  },
  {
    id: "cmp-shell-3",
    clientId: "client-shell",
    name: "B2B Lead Gen Sprint",
    type: "promo",
    startDate: "2026-08-01",
    endDate: "2026-08-31",
    color: "#059669",
    notes: "Promo enterprise onboarding untuk klien B2B baru.",
    reach: "180K",
    posts: 6,
    progress: 88,
  },
  // E2E Wizard Corp
  {
    id: "cmp-wz-1",
    clientId: "client-wizard",
    name: "DevCon 2026 Keynote Blitz",
    type: "event",
    startDate: "2026-09-10",
    endDate: "2026-09-20",
    color: "#4353FF",
    notes: "Liputan keynote DevCon 2026 dan peluncuran Neural API.",
    reach: "1.2M",
    posts: 24,
    progress: 64,
  },
  {
    id: "cmp-wz-2",
    clientId: "client-wizard",
    name: "AI Engine V4 Launch",
    type: "campaign",
    startDate: "2026-08-15",
    endDate: "2026-10-15",
    color: "#D97706",
    notes: "Kampanye peluncuran mesin AI generatif generasi keempat.",
    reach: "890K",
    posts: 20,
    progress: 47,
  },
  {
    id: "cmp-wz-3",
    clientId: "client-wizard",
    name: "Cloud Scale Free Tier",
    type: "promo",
    startDate: "2026-09-01",
    endDate: "2026-09-30",
    color: "#059669",
    notes: "Promo free tier cloud infrastructure untuk developer.",
    reach: "340K",
    posts: 9,
    progress: 81,
  },
  // Aura Luxury Group
  {
    id: "cmp-aura-1",
    clientId: "client-aura",
    name: "Milan Fall Collection",
    type: "event",
    startDate: "2026-09-05",
    endDate: "2026-09-25",
    color: "#7D3AC0",
    notes: "Liputan runway Milan Fashion Week koleksi gugur.",
    reach: "740K",
    posts: 16,
    progress: 68,
  },
  {
    id: "cmp-aura-2",
    clientId: "client-aura",
    name: "Sustainable Silk Story",
    type: "campaign",
    startDate: "2026-07-01",
    endDate: "2026-09-30",
    color: "#059669",
    notes: "Storytelling keberlanjutan bahan sutra premium.",
    reach: "290K",
    posts: 11,
    progress: 76,
  },
  {
    id: "cmp-aura-3",
    clientId: "client-aura",
    name: "Fragrance Noir Reveal",
    type: "promo",
    startDate: "2026-08-20",
    endDate: "2026-09-20",
    color: "#1A1B22",
    notes: "Teaser dan reveal parfum terbaru Fragrance Noir.",
    reach: "210K",
    posts: 7,
    progress: 59,
  },
]

export const CAMPAIGN_TYPE_META: Record<
  CampaignType,
  { label: string; badge: string }
> = {
  campaign: { label: "Campaign", badge: "admin-badge-cobalt" },
  promo: { label: "Promo", badge: "admin-badge-lime" },
  event: { label: "Event", badge: "admin-badge-lavender" },
}
