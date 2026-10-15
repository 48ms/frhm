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
export const dashboardSearchParams = {
  clientId: parseAsString.withDefault(""),
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
export const campaignsSearchParams = {
  clientId: parseAsString.withDefault(""),
  status: parseAsString.withDefault("all"),
}

export const campaignsParamsCache = createSearchParamsCache(campaignsSearchParams)
export const serializeCampaignsParams = createSerializer(campaignsSearchParams)

// -------------------------------------------------------------
// 5. AI Studio (/admin/ai)
// -------------------------------------------------------------
export const AI_STUDIO_TABS = ["ideas", "batch", "trends", "brand-brain", "playbooks"] as const

export const aiSearchParams = {
  clientId: parseAsString.withDefault(""),
  tab: parseAsStringEnum([...AI_STUDIO_TABS]).withDefault("ideas"),
  category: parseAsString.withDefault("all"),
  search: parseAsString.withDefault(""),
  pack: parseAsString.withDefault("all"),
  skillId: parseAsString.withDefault(""),
}

export const aiParamsCache = createSearchParamsCache(aiSearchParams)
export const serializeAiParams = createSerializer(aiSearchParams)

// -------------------------------------------------------------
// 6. Analytics Module (/admin/analytics)
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

