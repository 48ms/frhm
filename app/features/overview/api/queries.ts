import { queryOptions, useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import type { SupabaseClient } from '@/lib/supabase/client'
import {
  fetchPipelineStats,
  fetchTodaySchedule,
  fetchClientOverviewSummaries,
  fetchWeeklyBriefings,
  fetchActivityData,
} from "./service"

export const overviewKeys = {
  all: ["overview"] as const,
  pipelineStats: () => [...overviewKeys.all, "pipeline-stats"] as const,
  schedule: () => [...overviewKeys.all, "schedule"] as const,
  clients: () => [...overviewKeys.all, "clients"] as const,
  briefings: () => [...overviewKeys.all, "briefings"] as const,
  activity: () => [...overviewKeys.all, "activity"] as const,
}

export function pipelineStatsQueryOptions(customSupabase?: SupabaseClient) {
  return queryOptions({
    queryKey: overviewKeys.pipelineStats(),
    queryFn: () => {
      const supabase = customSupabase ?? createClient()
      return fetchPipelineStats(supabase)
    },
    staleTime: 60 * 1000,
  })
}

export function todayScheduleQueryOptions(customSupabase?: SupabaseClient) {
  return queryOptions({
    queryKey: overviewKeys.schedule(),
    queryFn: () => {
      const supabase = customSupabase ?? createClient()
      return fetchTodaySchedule(supabase)
    },
    staleTime: 60 * 1000,
  })
}

export function clientOverviewQueryOptions(customSupabase?: SupabaseClient) {
  return queryOptions({
    queryKey: overviewKeys.clients(),
    queryFn: () => {
      const supabase = customSupabase ?? createClient()
      return fetchClientOverviewSummaries(supabase)
    },
    staleTime: 60 * 1000,
  })
}

export function weeklyBriefingsQueryOptions(customSupabase?: SupabaseClient) {
  return queryOptions({
    queryKey: overviewKeys.briefings(),
    queryFn: () => {
      const supabase = customSupabase ?? createClient()
      return fetchWeeklyBriefings(supabase)
    },
    staleTime: 60 * 1000,
  })
}

export function activityDataQueryOptions(customSupabase?: SupabaseClient) {
  return queryOptions({
    queryKey: overviewKeys.activity(),
    queryFn: () => {
      const supabase = customSupabase ?? createClient()
      return fetchActivityData(supabase)
    },
    staleTime: 30 * 1000,
  })
}

export function usePipelineStats() {
  return useQuery(pipelineStatsQueryOptions())
}

export function useTodaySchedule() {
  return useQuery(todayScheduleQueryOptions())
}

export function useClientOverview() {
  return useQuery(clientOverviewQueryOptions())
}

export function useWeeklyBriefings() {
  return useQuery(weeklyBriefingsQueryOptions())
}

export function useActivityData() {
  return useQuery(activityDataQueryOptions())
}
