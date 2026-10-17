import { createSearchParamsCache, createSerializer, parseAsString, parseAsStringEnum } from "nuqs/server"

/**
 * Frhm Centralized URL State Synchronization (nuqs)
 * Sesuai Aturan 4 AGENTS.md:
 * - Server Component: definisikan parser di lib/searchparams.ts memakai createSearchParamsCache + createSerializer
 * - Dilarang menulis URL search params manual (new URLSearchParams, router.replace("?..."))
 */

// -------------------------------------------------------------
// 1. Dashboard / Multi-Tenant Tenancy
// -------------------------------------------------------------
export const DASHBOARD_PERIODS = ["7d", "30d", "90d"] as const

export const dashboardSearchParams = {
  clientId: parseAsString.withDefault(""),
  period: parseAsStringEnum([...DASHBOARD_PERIODS]).withDefault("30d"),
}

export const dashboardParamsCache = createSearchParamsCache(dashboardSearchParams)
export const searchParamsCache = dashboardParamsCache // Alias backward compatibility
export const serializeDashboardParams = createSerializer(dashboardSearchParams)

// -------------------------------------------------------------
// 2. Calendar Module (/admin/calendar)
// -------------------------------------------------------------
export const CALENDAR_PLATFORM_FILTERS = ["all", "instagram", "tiktok", "shorts", "linkedin"] as const
export const CALENDAR_VIEW_MODES = ["month", "week", "list"] as const

export const calendarSearchParams = {
  clientId: parseAsString.withDefault(""),
  platform: parseAsStringEnum([...CALENDAR_PLATFORM_FILTERS]).withDefault("all"),
  view: parseAsStringEnum([...CALENDAR_VIEW_MODES]).withDefault("month"),
  mediaUrl: parseAsString.withDefault(""),
  caption: parseAsString.withDefault(""),
  title: parseAsString.withDefault(""),
  new: parseAsString.withDefault(""),
  export: parseAsString.withDefault(""),
}

export const calendarParamsCache = createSearchParamsCache(calendarSearchParams)
export const serializeCalendarParams = createSerializer(calendarSearchParams)

// -------------------------------------------------------------
// 3. Composer Module (/admin/composer)
// -------------------------------------------------------------
export const composerSearchParams = {
  clientId: parseAsString.withDefault(""),
  title: parseAsString.withDefault(""),
  content: parseAsString.withDefault(""),
  mediaUrl: parseAsString.withDefault(""),
  platform: parseAsString.withDefault(""),
}

export const composerParamsCache = createSearchParamsCache(composerSearchParams)
export const serializeComposerParams = createSerializer(composerSearchParams)

// -------------------------------------------------------------
// 4. Campaigns Board (/admin/campaigns)
// -------------------------------------------------------------
export const CAMPAIGN_TABS = ["all", "active", "review", "completed", "draft"] as const
export const CAMPAIGN_VIEW_MODES = ["list", "gantt"] as const

export const campaignsSearchParams = {
  clientId: parseAsString.withDefault(""),
  tab: parseAsStringEnum([...CAMPAIGN_TABS]).withDefault("all"),
  status: parseAsString.withDefault("all"), // Backward compatibility alias
  q: parseAsString.withDefault(""),
  new: parseAsString.withDefault(""),
  view: parseAsStringEnum([...CAMPAIGN_VIEW_MODES]).withDefault("list"),
}

export const campaignsParamsCache = createSearchParamsCache(campaignsSearchParams)
export const serializeCampaignsParams = createSerializer(campaignsSearchParams)

// -------------------------------------------------------------
// 5. Marketing ERP & Deliverables (/admin/erp)
// -------------------------------------------------------------
export const ERP_TABS = ["deliverables", "expenses", "ledger", "ads", "events"] as const
export const ERP_DELIVERABLE_STATUSES = [
  "all",
  "sent",
  "revision_requested",
  "approved",
  "draft",
] as const

export const erpSearchParams = {
  clientId: parseAsString.withDefault(""),
  tab: parseAsStringEnum([...ERP_TABS]).withDefault("deliverables"),
  status: parseAsStringEnum([...ERP_DELIVERABLE_STATUSES]).withDefault("all"),
  q: parseAsString.withDefault(""),
}

export const erpParamsCache = createSearchParamsCache(erpSearchParams)
export const serializeErpParams = createSerializer(erpSearchParams)

// -------------------------------------------------------------
// 6. Media Library (/admin/library)
// -------------------------------------------------------------
export const LIBRARY_FILE_TYPES = ["all", "image", "video"] as const

export const librarySearchParams = {
  clientId: parseAsString.withDefault(""),
  fileType: parseAsStringEnum([...LIBRARY_FILE_TYPES]).withDefault("all"),
  tag: parseAsString.withDefault(""),
  q: parseAsString.withDefault(""),
}

export const libraryParamsCache = createSearchParamsCache(librarySearchParams)
export const serializeLibraryParams = createSerializer(librarySearchParams)

// -------------------------------------------------------------
// 7. AI Studio (/admin/ai)
// -------------------------------------------------------------
export const AI_STUDIO_TABS = ["ideas", "batch", "trends", "brand-brain", "playbooks"] as const
export const AI_STUDIO_VIEW_MODES = ["packs", "all"] as const

export const aiSearchParams = {
  clientId: parseAsString.withDefault(""),
  tab: parseAsStringEnum([...AI_STUDIO_TABS]).withDefault("ideas"),
  category: parseAsString.withDefault("all"),
  search: parseAsString.withDefault(""),
  pack: parseAsString.withDefault("all"),
  skill: parseAsString.withDefault(""),
  skillId: parseAsString.withDefault(""), // Backward compatibility alias
  interview: parseAsString.withDefault(""),
  viewMode: parseAsStringEnum([...AI_STUDIO_VIEW_MODES]).withDefault("packs"),
}

export const aiParamsCache = createSearchParamsCache(aiSearchParams)
export const serializeAiParams = createSerializer(aiSearchParams)

// -------------------------------------------------------------
// 8. Analytics Module (/admin/analytics)
// -------------------------------------------------------------
export const ANALYTICS_PLATFORMS = ["all", "instagram", "tiktok", "youtube", "twitter", "x"] as const
export const ANALYTICS_PERIODS = ["7d", "30d", "90d", "all"] as const

export const analyticsSearchParams = {
  clientId: parseAsString.withDefault(""),
  platform: parseAsStringEnum([...ANALYTICS_PLATFORMS]).withDefault("all"),
  period: parseAsStringEnum([...ANALYTICS_PERIODS]).withDefault("30d"),
}

export const analyticsParamsCache = createSearchParamsCache(analyticsSearchParams)
export const serializeAnalyticsParams = createSerializer(analyticsSearchParams)

// -------------------------------------------------------------
// 9. Client Workspaces (/admin/clients)
// -------------------------------------------------------------
export const clientsSearchParams = {
  q: parseAsString.withDefault(""),
  onboarding: parseAsString.withDefault(""),
}

export const clientsParamsCache = createSearchParamsCache(clientsSearchParams)
export const serializeClientsParams = createSerializer(clientsSearchParams)

// -------------------------------------------------------------
// 10. Client Review Hub (/client/review)
// -------------------------------------------------------------
export const CLIENT_REVIEW_STATUSES = ["all", "sent", "revision_requested", "approved"] as const
export const CLIENT_REVIEW_SCOPES = ["deliverables", "batch_schedule"] as const

export const clientReviewSearchParams = {
  clientId: parseAsString.withDefault(""),
  status: parseAsStringEnum([...CLIENT_REVIEW_STATUSES]).withDefault("all"),
  scope: parseAsStringEnum([...CLIENT_REVIEW_SCOPES]).withDefault("deliverables"),
}

export const clientReviewParamsCache = createSearchParamsCache(clientReviewSearchParams)
export const serializeClientReviewParams = createSerializer(clientReviewSearchParams)

// -------------------------------------------------------------
// 11. Support & Helpdesk (/client/support & /admin/support)
// -------------------------------------------------------------
export const supportSearchParams = {
  clientId: parseAsString.withDefault(""),
  topic: parseAsString.withDefault(""),
}

export const supportParamsCache = createSearchParamsCache(supportSearchParams)
export const serializeSupportParams = createSerializer(supportSearchParams)

// -------------------------------------------------------------
// 12. Events & Offline Activation (/admin/events)
// -------------------------------------------------------------
export const EVENT_STATUSES = ["all", "upcoming", "ongoing", "completed", "cancelled"] as const

export const eventsSearchParams = {
  clientId: parseAsString.withDefault(""),
  status: parseAsStringEnum([...EVENT_STATUSES]).withDefault("all"),
  q: parseAsString.withDefault(""),
}

export const eventsParamsCache = createSearchParamsCache(eventsSearchParams)
export const serializeEventsParams = createSerializer(eventsSearchParams)



