import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
  SOCIAL_CLIENTS,
  type SocialAccount,
  type SocialClient,
} from "@/components/social-accounts/social-data"
import {
  CAMPAIGNS,
  type Campaign,
  type CampaignType,
} from "@/components/campaigns/campaign-data"
import { MOCK_SCHEDULED_POSTS } from "@/lib/mock-data"

export type { Campaign, CampaignType }
export type CampaignStatus = "Active" | "Scheduled" | "Completed" | "Draft"

export type PostStatus =
  | "draft"
  | "review"
  | "sent"
  | "approved"
  | "revision_requested"
  | "scheduled"
  | "published"
  | "failed"

export interface PipelinePost {
  id: string
  clientId: string
  title: string
  caption: string
  /** Canonical platform name, e.g. "Instagram". */
  platform: string
  /** Legacy alias kept in sync with `platform` for older call sites. */
  channel?: string
  status: PostStatus
  scheduledAt: string
  mediaUrl?: string
  author: string
}

type AccountRecord = SocialAccount & { clientId: string }

interface AppStore {
  campaigns: Campaign[]
  socialClients: SocialClient[]
  accounts: AccountRecord[]
  posts: PipelinePost[]

  // lifecycle
  reset: () => void

  // campaign actions
  addCampaign: (input: Omit<Campaign, "id" | "reach" | "posts" | "progress">) => void
  updateCampaign: (id: string, patch: Partial<Omit<Campaign, "id">>) => void
  removeCampaign: (id: string) => void
  campaignByClient: (clientId: string) => Campaign[]

  // social account actions
  addSocialClient: (input: { name: string }) => void
  addSocialAccount: (clientId: string, account: SocialAccount) => void
  removeSocialAccount: (id: string) => void
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
  accountsByClient: (clientId: string) => AccountRecord[]
  clientsWithAccounts: () => SocialClient[]
  accountStats: () => {
    totalChannels: number
    syncedPercent: number
    aggregateReachK: number
  }
  actionNeededCount: () => number
  actionNeededAccounts: () => AccountRecord[]

  // post actions
  schedulePost: (input: {
    clientId: string
    title: string
    caption: string
    channel: string
    scheduledAt: string
    status?: PostStatus
  }) => void
  addPost: (post: Omit<PipelinePost, "id">) => void
  updatePost: (id: string, patch: Partial<Omit<PipelinePost, "id">>) => void
  removePost: (id: string) => void
}

/* Helpers                                                             */

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 11)}`
}

/** Parse "428K" / "1.2M" / "1.2K fans" into a numeric value in thousands. */
function fansToK(fans: string): number {
  const m = String(fans).replace(/,/g, "").match(/([\d.]+)\s*([KMB])?/i)
  if (!m) return 0
  const n = parseFloat(m[1])
  if (Number.isNaN(n)) return 0
  const unit = (m[2] ?? "").toUpperCase()
  if (unit === "B") return n * 1_000_000
  if (unit === "M") return n * 1_000
  return n
}

function seedAccounts(): AccountRecord[] {
  const out: AccountRecord[] = []
  for (const client of SOCIAL_CLIENTS) {
    for (const acc of client.accounts) out.push({ ...acc, clientId: client.id })
  }
  return out
}

function seedPosts(): PipelinePost[] {
  return MOCK_SCHEDULED_POSTS.map((p) => ({
    id: p.id,
    clientId: p.client_id,
    title: p.title,
    caption: p.campaign_tag ?? "",
    platform: p.platform,
    channel: p.platform,
    status: "scheduled" as PostStatus,
    scheduledAt: p.scheduled_at,
    author: "Studio",
  }))
}

function seedCampaigns(): Campaign[] {
  return CAMPAIGNS.map((c) => ({ ...c }))
}

function seedClients(): SocialClient[] {
  return SOCIAL_CLIENTS.map((c) => ({ ...c, accounts: [...c.accounts] }))
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      campaigns: seedCampaigns(),
      socialClients: seedClients(),
      accounts: seedAccounts(),
      posts: seedPosts(),

      reset: () =>
        set({
          campaigns: seedCampaigns(),
          socialClients: seedClients(),
          accounts: seedAccounts(),
          posts: seedPosts(),
        }),

      /* campaigns */

      addCampaign: (input) =>
        set((state) => ({
          campaigns: [
            ...state.campaigns,
            { ...input, id: uid("camp"), reach: "0", posts: 0, progress: 0 },
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

      campaignByClient: (clientId) => get().campaigns.filter((c) => c.clientId === clientId),

      /* social accounts */

      addSocialClient: ({ name }) =>
        set((state) => ({
          socialClients: [
            ...state.socialClients,
            {
              id: uid("client"),
              name,
              shortName: name,
              initials: name.slice(0, 2).toUpperCase(),
              tagline: "",
              accounts: [],
            },
          ],
        })),

      addSocialAccount: (clientId, account) =>
        set((state) => ({
          accounts: [...state.accounts, { ...account, clientId }],
          socialClients: state.socialClients.map((client) =>
            client.id === clientId
              ? { ...client, accounts: [...client.accounts, account] }
              : client
          ),
        })),

      removeSocialAccount: (id) =>
        set((state) => ({
          accounts: state.accounts.filter((a) => a.id !== id),
          socialClients: state.socialClients.map((client) => ({
            ...client,
            accounts: client.accounts.filter((a) => a.id !== id),
          })),
        })),

      connectAccount: ({ clientId, platform, handle, fans, icon, bg, fg }) => {
        const account: SocialAccount = {
          id: uid("acc"),
          platform: platform as SocialAccount["platform"],
          handle,
          fans: fans ?? "0 fans",
          status: "SYNCED",
          icon: icon ?? "hub",
          bg: bg ?? "bg-[hsl(var(--admin-surface-high))]",
          fg: fg ?? "text-on-surface",
        }
        get().addSocialAccount(clientId, account)
      },

      disconnectAccount: (id) => get().removeSocialAccount(id),

      updateAccount: (id, patch) =>
        set((state) => ({
          accounts: state.accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)),
          socialClients: state.socialClients.map((client) => ({
            ...client,
            accounts: client.accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)),
          })),
        })),

      refreshAccount: (id) => get().updateAccount(id, { status: "SYNCED" }),

      accountsByClient: (clientId) => get().accounts.filter((a) => a.clientId === clientId),

      clientsWithAccounts: () => {
        const accounts = get().accounts
        return get().socialClients.map((client) => ({
          ...client,
          accounts: accounts.filter((a) => a.clientId === client.id),
        }))
      },

      accountStats: () => {
        const accounts = get().accounts
        const synced = accounts.filter((a) => a.status === "SYNCED").length
        return {
          totalChannels: accounts.length,
          syncedPercent: accounts.length ? Math.round((synced / accounts.length) * 100) : 0,
          aggregateReachK: accounts.reduce((n, a) => n + fansToK(a.fans), 0),
        }
      },

      actionNeededCount: () => get().accounts.filter((a) => a.status !== "SYNCED").length,

      actionNeededAccounts: () => get().accounts.filter((a) => a.status !== "SYNCED"),

      /* posts */

      schedulePost: ({ clientId, title, caption, channel, scheduledAt, status }) =>
        set((state) => ({
          posts: [
            ...state.posts,
            {
              id: uid("post"),
              clientId,
              title,
              caption,
              platform: channel,
              channel,
              status: status ?? "scheduled",
              scheduledAt,
              author: "Studio",
            },
          ],
        })),

      addPost: (post) =>
        set((state) => ({
          posts: [...state.posts, { ...post, id: uid("post") }],
        })),

      updatePost: (id, patch) =>
        set((state) => ({
          posts: state.posts.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),

      removePost: (id) =>
        set((state) => ({
          posts: state.posts.filter((p) => p.id !== id),
        })),
    }),
    {
      name: "frhm-storage",
    }
  )
)
