// Data lifted verbatim from the Stitch MCP prototype `033fb5596cc4441c8cd77031206b2e22.html`
// (window.appStore state.clients[].accounts). Used for static visual parity.

export type SocialAccount = {
  id: string
  platform: string
  handle: string
  fans: string
  status: string
  icon: string
  /** Tailwind bg classes for the icon tile, exactly as in the reference. */
  bg: string
  /** Icon foreground token, e.g. `text-white` or `text-primary-container`. */
  fg: string
}

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
    shortName: "B2B Shell",
    initials: "BS",
    tagline: "Enterprise spatial computing & industrial IoT",
    accounts: [
      {
        id: "acc-shell-1",
        platform: "Instagram",
        handle: "@shell.creative",
        fans: "428K fans",
        status: "SYNCED",
        icon: "photo_camera",
        bg: "bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600",
        fg: "text-white",
      },
      {
        id: "acc-shell-2",
        platform: "TikTok",
        handle: "@b2bshell",
        fans: "890K fans",
        status: "SYNCED",
        icon: "music_note",
        bg: "bg-[hsl(var(--admin-on-surface))]",
        fg: "text-[hsl(var(--brand-accent))]",
      },
      {
        id: "acc-shell-3",
        platform: "YouTube",
        handle: "Shell Agency TV",
        fans: "112K subs",
        status: "SYNCED",
        icon: "smart_display",
        bg: "bg-[#ba1a1a]",
        fg: "text-white",
      },
      {
        id: "acc-shell-4",
        platform: "LinkedIn",
        handle: "FRHM Digital Group",
        fans: "45.2K peers",
        status: "SYNCED",
        icon: "work",
        bg: "bg-[hsl(var(--admin-cobalt))]",
        fg: "text-white",
      },
    ],
  },
  {
    id: "client-wizard",
    name: "E2E Wizard Corp",
    shortName: "Wizard Corp",
    initials: "WZ",
    tagline: "Developer toolchains & generative AI infrastructure",
    accounts: [
      {
        id: "acc-wz-1",
        platform: "YouTube",
        handle: "E2E Wizard Developers",
        fans: "450K devs",
        status: "SYNCED",
        icon: "smart_display",
        bg: "bg-[#ba1a1a]",
        fg: "text-white",
      },
      {
        id: "acc-wz-2",
        platform: "LinkedIn",
        handle: "E2E Wizard Corp Global",
        fans: "185K peers",
        status: "SYNCED",
        icon: "work",
        bg: "bg-[hsl(var(--admin-cobalt))]",
        fg: "text-white",
      },
      {
        id: "acc-wz-3",
        platform: "Twitter / X",
        handle: "@e2ewizard",
        fans: "620K devs",
        status: "SYNCED",
        icon: "twitter",
        bg: "bg-[hsl(var(--admin-on-surface))]",
        fg: "text-white",
      },
      {
        id: "acc-wz-4",
        platform: "TikTok",
        handle: "@wizardcode",
        fans: "210K fans",
        status: "SYNCED",
        icon: "music_note",
        bg: "bg-[hsl(var(--admin-on-surface))]",
        fg: "text-[hsl(var(--brand-accent))]",
      },
    ],
  },
  {
    id: "client-aura",
    name: "Aura Luxury Group",
    shortName: "Aura Luxury",
    initials: "AL",
    tagline: "Haute couture & spatial fashion retail",
    accounts: [
      {
        id: "acc-aura-1",
        platform: "Instagram",
        handle: "@auraluxury.paris",
        fans: "740K fans",
        status: "SYNCED",
        icon: "photo_camera",
        bg: "bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600",
        fg: "text-white",
      },
      {
        id: "acc-aura-2",
        platform: "TikTok",
        handle: "@aura.maison",
        fans: "510K fans",
        status: "SYNCED",
        icon: "music_note",
        bg: "bg-[hsl(var(--admin-on-surface))]",
        fg: "text-[hsl(var(--brand-accent))]",
      },
      {
        id: "acc-aura-3",
        platform: "YouTube",
        handle: "Aura Haute Couture TV",
        fans: "280K subs",
        status: "SYNCED",
        icon: "smart_display",
        bg: "bg-[#ba1a1a]",
        fg: "text-white",
      },
    ],
  },
]

export const ALL_PLATFORMS = [
  "Instagram",
  "TikTok",
  "YouTube",
  "LinkedIn",
  "Twitter / X",
  "Threads",
  "Facebook",
]
