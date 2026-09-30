/**
 * Client Store — single source of truth untuk data MUTABLE selama sesi.
 *
 * Arsitektur 3 lapis:
 *   Layer 1 (data mentah)  : Mock Repository  (lib/mock-data.ts, deterministic seed)
 *   Layer 2 (mutable)      : STORE INI        (create/edit/delete, hidup 1 sesi SPA)
 *   Layer 3 (view state)   : URL state nuqs   (filter/tab/client — terpisah, di komponen)
 *
 * Ganti ke data asli nanti: cukup arahkan seed() ke Supabase query —
 * komponen & aksi di sini tidak berubah. Itulah kenapa mutasi diasuh
 * di satu tempat ini, bukan tersebar useState per-komponen.
 */
import { create } from "zustand"
import {
  CAMPAIGNS,
  CAMPAIGN_CLIENTS,
  type Campaign,
  type CampaignClient,
  type CampaignType,
} from "@/components/campaigns/campaign-data"
import {
  SOCIAL_CLIENTS,
  type SocialAccount,
  type SocialClient,
} from "@/components/social-accounts/social-data"

// ---- types ----

export type { Campaign, CampaignClient, CampaignType, SocialAccount, SocialClient }

/** Post antrian pipeline (content queue). */
export type PipelinePost = {
  id: string
  clientId: string
  title: string
  caption: string
  channel: string
  status: "scheduled" | "review" | "draft" | "approved" | "published" | "failed"
  scheduledAt: string
}

export type AppStore = {
  // ---- state ----
  campaigns: Campaign[]
  clients: CampaignClient[]
  socialClients: SocialClient[]
  accounts: (SocialAccount & { clientId: string })[]
  posts: PipelinePost[]

  // ---- campaign actions ----
  addCampaign: (input: {
    clientId: string
    name: string
    type: CampaignType
    startDate: string
    endDate: string
    color: string
    notes: string
  }) => void
  updateCampaign: (id: string, patch: Partial<Omit<Campaign, "id">>) => void
  removeCampaign: (id: string) => void
  campaignByClient: (clientId: string) => Campaign[]

  // ---- account actions ----
  connectAccount: (input: {
    clientId: string
    platform: string
    handle: string
    fans?: string
    icon?: string
    bg?: string
    fg?: string
  }) => void
  disconnectAccount: (id: string) => void
  updateAccount: (id: string, patch: Partial<Omit<SocialAccount, "id">>) => void
  refreshAccount: (id: string) => void
  accountsByClient: (clientId: string) => (SocialAccount & { clientId: string })[]
  /** Daftar client dengan akun live dari store (untuk board Social Accounts). */
  clientsWithAccounts: () => SocialClient[]
  /** Statistik live dihitung dari data store (bukan angka statis). */
  accountStats: () => {
    totalChannels: number
    syncedPercent: number
    aggregateReachK: number
  }

  // ---- post actions ----
  schedulePost: (input: {
    clientId: string
    title: string
    caption: string
    channel: string
    scheduledAt: string
  }) => void
  removePost: (id: string) => void

  // ---- util ----
  reset: () => void
}

// ---- seed: flattening SOCIAL_CLIENTS → account list + clientId ----

function seedAccounts(): (SocialAccount & { clientId: string })[] {
  const out: (SocialAccount & { clientId: string })[] = []
  for (const client of SOCIAL_CLIENTS) {
    for (const acc of client.accounts) {
      out.push({ ...acc, clientId: client.id })
    }
  }
  return out
}

function seedPosts(): PipelinePost[] {
  return [
    {
      id: "p1",
      clientId: "client-shell",
      title: "Spatial Identity Teaser #04",
      caption: "Engineered for B2B Shell",
      channel: "Instagram",
      status: "scheduled",
      scheduledAt: "2026-09-30T18:00:00",
    },
    {
      id: "p2",
      clientId: "client-shell",
      title: "Chromatic Blur Reveal",
      caption:
        "Why top luxury creative directors are replacing corporate blue with electric lime in 2026.",
      channel: "TikTok",
      status: "review",
      scheduledAt: "2026-10-01T12:30:00",
    },
    {
      id: "p3",
      clientId: "client-wizard",
      title: "The 3-Layer Brand Rule",
      caption:
        "The 3-layer rule for B2B Shell digital branding that algorithmic feeds cannot resist scrolling past.",
      channel: "LinkedIn",
      status: "draft",
      scheduledAt: "2026-10-03T09:00:00",
    },
  ]
}

function initialState() {
  return {
    campaigns: CAMPAIGNS,
    clients: CAMPAIGN_CLIENTS,
    socialClients: SOCIAL_CLIENTS,
    accounts: seedAccounts(),
    posts: seedPosts(),
  }
}

// ---- store ----

let seq = 0
function uid(prefix: string) {
  seq += 1
  return `${prefix}-${Date.now().toString(36)}-${seq}`
}

export const useAppStore = create<AppStore>((set, get) => ({
  ...initialState(),

  // campaigns
  addCampaign: (input) =>
    set((state) => ({
      campaigns: [
        ...state.campaigns,
        {
          id: uid("cmp"),
          clientId: input.clientId,
          name: input.name,
          type: input.type,
          startDate: input.startDate,
          endDate: input.endDate,
          color: input.color,
          notes: input.notes,
          reach: "0",
          posts: 0,
          progress: 0,
        },
      ],
    })),

  updateCampaign: (id, patch) =>
    set((state) => ({
      campaigns: state.campaigns.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })),

  removeCampaign: (id) =>
    set((state) => ({
      campaigns: state.campaigns.filter((c) => c.id !== id),
    })),

  campaignByClient: (clientId) =>
    get().campaigns.filter((c) => c.clientId === clientId),

  // accounts
  connectAccount: (input) =>
    set((state) => ({
      accounts: [
        ...state.accounts,
        {
          id: uid("acc"),
          clientId: input.clientId,
          platform: input.platform,
          handle: input.handle,
          fans: input.fans ?? "0 fans",
          status: "SYNCED",
          icon: input.icon ?? "hub",
          bg: input.bg ?? "bg-[hsl(var(--admin-cobalt))]",
          fg: input.fg ?? "text-white",
        },
      ],
    })),

  disconnectAccount: (id) =>
    set((state) => ({
      accounts: state.accounts.filter((a) => a.id !== id),
    })),

  refreshAccount: (id) =>
    set((state) => ({
      accounts: state.accounts.map((a) =>
        a.id === id ? { ...a, status: "SYNCED" } : a
      ),
    })),

  accountsByClient: (clientId) =>
    get().accounts.filter((a) => a.clientId === clientId),

  clientsWithAccounts: () =>
    get().socialClients.map((c) => ({
      ...c,
      accounts: get().accounts.filter((a) => a.clientId === c.id),
    })),

  updateAccount: (id, patch) =>
    set((state) => ({
      accounts: state.accounts.map((a) =>
        a.id === id ? { ...a, ...patch } : a
      ),
    })),

  accountStats: () => {
    const accounts = get().accounts
    const total = accounts.length
    const synced = accounts.filter((a) => a.status === "SYNCED").length
    const reachK = accounts.reduce((sum, a) => {
      const digits = parseInt(a.fans.replace(/[^0-9]/g, ""), 10)
      // "428K fans" -> 428, "1.2M" -> 1200, "112K subs" -> 112
      const isM = /m/i.test(a.fans)
      return sum + (isNaN(digits) ? 0 : isM ? digits * 1000 : digits)
    }, 0)
    return {
      totalChannels: total,
      syncedPercent: total === 0 ? 0 : Math.round((synced / total) * 100),
      aggregateReachK: reachK,
    }
  },

  // posts
  schedulePost: (input) =>
    set((state) => ({
      posts: [
        ...state.posts,
        {
          id: uid("post"),
          clientId: input.clientId,
          title: input.title,
          caption: input.caption,
          channel: input.channel,
          status: "scheduled",
          scheduledAt: input.scheduledAt,
        },
      ],
    })),

  removePost: (id) =>
    set((state) => ({
      posts: state.posts.filter((p) => p.id !== id),
    })),

  reset: () => set(initialState()),
}))
