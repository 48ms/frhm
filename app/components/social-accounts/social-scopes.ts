// Single source of truth for the OAuth scopes each platform can grant.
// Shared by the connect wizard and the manage-access dialog.

export type ScopeInfo = {
  id: string
  description: string
  /** Required scopes keep the account working and cannot be turned off. */
  required: boolean
  /** Shown when the scope is switched off, so the trade-off is explicit. */
  impactOff?: string
}

export const PLATFORM_SCOPES: Record<string, ScopeInfo[]> = {
  Instagram: [
    {
      id: "instagram_basic",
      description: "Read the profile name, bio and picture.",
      required: true,
    },
    {
      id: "instagram_content_publish",
      description: "Publish and schedule posts, Reels and carousels.",
      required: false,
      impactOff: "Scheduled and new posts will not go out until you turn this back on.",
    },
    {
      id: "instagram_manage_insights",
      description: "Read reach, engagement and follower metrics.",
      required: false,
      impactOff: "Reach and engagement charts will stop updating.",
    },
    {
      id: "pages_show_list",
      description: "See the Facebook Pages linked to this account.",
      required: false,
      impactOff: "Linked Pages will no longer appear for this account.",
    },
  ],
  TikTok: [
    {
      id: "user.info.basic",
      description: "Read the display name, avatar and follower count.",
      required: true,
    },
    {
      id: "video.publish",
      description: "Upload and schedule short videos.",
      required: false,
      impactOff: "Scheduled and new videos will not go out until you turn this back on.",
    },
    {
      id: "video.list",
      description: "Read the account's own video library.",
      required: false,
      impactOff: "The video library tab will be empty.",
    },
    {
      id: "analytics.read",
      description: "Read views, likes and watch time.",
      required: false,
      impactOff: "View and watch-time numbers will stop updating.",
    },
  ],
  YouTube: [
    {
      id: "youtube.readonly",
      description: "Read channel details and analytics.",
      required: true,
    },
    {
      id: "youtube.upload",
      description: "Publish and schedule videos and Shorts.",
      required: false,
      impactOff: "Uploads and scheduled videos will be paused.",
    },
  ],
  LinkedIn: [
    {
      id: "r_organization_social",
      description: "Read company page posts and metrics.",
      required: true,
    },
    {
      id: "w_organization_social",
      description: "Post on behalf of a company page.",
      required: false,
      impactOff: "Scheduled company posts will not go out.",
    },
  ],
  Twitter: [
    {
      id: "tweet.read",
      description: "Read the account's posts and timeline.",
      required: true,
    },
    {
      id: "users.read",
      description: "Read profile details and follower count.",
      required: true,
    },
    {
      id: "tweet.write",
      description: "Post and schedule content.",
      required: false,
      impactOff: "Scheduled posts and threads will not go out.",
    },
  ],
}
