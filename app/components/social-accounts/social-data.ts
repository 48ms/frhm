// Prototype data copied verbatim from the Stitch MCP prototype for visual parity.

export type SocialAccount = {
  id: string
  platform: "Instagram" | "TikTok" | "YouTube" | "LinkedIn" | "Twitter" | "X"
  handle: string
  name?: string
  fans: string
  growth?: string
  status: "ACTIVE" | "SYNCED" | "TOKEN_EXPIRING" | "LIVE_SYNC" | "ACTION_NEEDED" | "FAILED"
  icon: string
  bg: string
  fg: string
  metrics?: {
    reach?: string
    posts?: string
    likes?: string
    saves?: string
    engagement?: string
    watchTime?: string
    drift?: string
    shopStatus?: string
  }
  tokenExpiry?: string
  bandwidth?: string
  webhookHealth?: string
  /** OAuth scopes currently granted to this account. Missing means "all granted". */
  scopes?: string[]
}

export const ALL_PLATFORMS = ["Instagram", "TikTok", "YouTube", "LinkedIn", "Twitter"] as const

export type SocialClient = {
  id: string
  name: string
  shortName: string
  initials: string
  tagline: string
  accounts: SocialAccount[]
}

export const SOCIAL_CLIENTS: SocialClient[] = [
  {
    id: "client-shell",
    name: "B2B Shell Representatives",
    shortName: "B2B Shell Reps",
    initials: "BS",
    tagline: "Enterprise spatial computing & industrial IoT",
    accounts: [
      {
        id: "acc-shell-1",
        platform: "Instagram",
        handle: "@shell.creative",
        name: "Shell Creative Studio Global",
        fans: "428K",
        growth: "+12.4%",
        status: "SYNCED",
        icon: "photo_camera",
        bg: "bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600",
        fg: "text-white",
        metrics: { reach: "1.2M", posts: "48", likes: "14.2K" },
        tokenExpiry: "58 days",
        bandwidth: "HIGH BANDWIDTH",
      },
      {
        id: "acc-shell-2",
        platform: "Instagram",
        handle: "@shell.global.b2b",
        name: "B2B Enterprise Solutions",
        fans: "182K",
        growth: "+4.8%",
        status: "ACTIVE",
        icon: "photo_camera",
        bg: "bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600",
        fg: "text-white",
        metrics: { reach: "420K", posts: "21", saves: "1.8K" },
        tokenExpiry: "24 days",
        bandwidth: "CAROUSEL REELS READY",
      },
      {
        id: "acc-shell-3",
        platform: "Instagram",
        handle: "@shell.careers.id",
        name: "Talent & Culture Hub",
        fans: "34.5K",
        growth: "3 Days Remaining",
        status: "TOKEN_EXPIRING",
        icon: "photo_camera",
        bg: "bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600",
        fg: "text-white",
        metrics: { reach: "12K", posts: "5", engagement: "2.1%" },
        tokenExpiry: "Expiring",
      },
      {
        id: "acc-shell-4",
        platform: "TikTok",
        handle: "@b2bshell",
        name: "Flagship Viral Account",
        fans: "890K",
        growth: "14.8M Total Likes",
        status: "LIVE_SYNC",
        icon: "music_note",
        bg: "bg-[hsl(var(--admin-on-surface))]",
        fg: "text-[hsl(var(--brand-accent))]",
        metrics: { drift: "94 / 100", shopStatus: "LINKED & VERIFIED" },
        webhookHealth: "AUTO-BOOST READY",
      },
      {
        id: "acc-shell-5",
        platform: "TikTok",
        handle: "@shellcreativelab",
        name: "R&D / Creative Sandbox",
        fans: "240K",
        growth: "3.2M Total Likes",
        status: "LIVE_SYNC",
        icon: "music_note",
        bg: "bg-[hsl(var(--admin-on-surface))]",
        fg: "text-[hsl(var(--brand-accent))]",
        metrics: { watchTime: "28.4s" },
        webhookHealth: "SANDBOX ON",
      },
      {
        id: "acc-shell-6",
        platform: "TikTok",
        handle: "@b2b.insider",
        name: "Editorial Thought Leadership",
        fans: "98.2K",
        growth: "1.1M Total Likes",
        status: "LIVE_SYNC",
        icon: "music_note",
        bg: "bg-[hsl(var(--admin-on-surface))]",
        fg: "text-[hsl(var(--brand-accent))]",
        metrics: { drift: "82.1%" },
        webhookHealth: "RESTRICTED ADMIN",
      },
    ],
  },
  {
    id: "client-wizard",
    name: "E2E Wizard Corp",
    shortName: "Wizard Corp",
    initials: "WZ",
    tagline: "Full-stack development & QA automation",
    accounts: [
      {
        id: "acc-wiz-1",
        platform: "YouTube",
        handle: "Wizard Devs",
        name: "E2E Wizard Developers",
        fans: "112K",
        growth: "+2.1%",
        status: "SYNCED",
        icon: "smart_display",
        bg: "bg-[#ba1a1a]",
        fg: "text-white",
        metrics: { reach: "500K", posts: "124" },
      },
    ],
  },
  {
    id: "client-aura",
    name: "Aura Luxury",
    shortName: "Aura Luxury",
    initials: "AL",
    tagline: "High-end fashion & jewelry curation",
    accounts: [
      {
        id: "acc-aura-1",
        platform: "Instagram",
        handle: "@auraluxury.paris",
        name: "Aura Haute Couture",
        fans: "2.1M",
        growth: "+18.2%",
        status: "SYNCED",
        icon: "photo_camera",
        bg: "bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600",
        fg: "text-white",
        metrics: { reach: "8.4M", posts: "12" },
      },
    ],
  },
]
