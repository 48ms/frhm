import type { SupabaseClient } from '@/lib/supabase/client'
import type {
  PipelineStats,
  TodayScheduledPost,
  ClientOverviewSummary,
  ClientWeeklyBriefing,
  ActivitySlotData,
  TaskItem,
  RecentDeliverableItem,
  RecentActivityItem,
} from "./types"

export async function fetchPipelineStats(supabase: SupabaseClient): Promise<PipelineStats> {
  const { data: deliverables, error } = await supabase
    .from("deliverables")
    .select("id, status")

  if (error) {
    console.error("[fetchPipelineStats error]", error)
    return { total: 0, sent: 0, approved: 0, revision: 0 }
  }

  const all = deliverables ?? []
  return {
    total: all.length,
    sent: all.filter((d) => d.status === "sent").length,
    approved: all.filter((d) => d.status === "approved").length,
    revision: all.filter((d) => d.status === "revision_requested").length,
  }
}

export async function fetchTodaySchedule(supabase: SupabaseClient): Promise<TodayScheduledPost[]> {
  const startOfDay = new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
  const endOfDay = new Date(new Date().setHours(23, 59, 59, 999)).toISOString()

  const { data: posts, error } = await supabase
    .from("scheduled_posts")
    .select("id, title, platform, scheduled_at, status, client_id, publish_retry_count, clients(name)")
    .in("status", ["scheduled", "failed", "draft"])
    .gte("scheduled_at", startOfDay)
    .lte("scheduled_at", endOfDay)
    .order("scheduled_at", { ascending: true })

  if (error) {
    console.error("[fetchTodaySchedule error]", error)
    return []
  }

  type RawPost = {
    id: string
    title: string
    platform: string
    scheduled_at: string
    status: string
    client_id: string
    publish_retry_count: number | null
    clients?: { name: string } | null
  }

  return ((posts ?? []) as unknown as RawPost[]).map((p) => ({
    id: p.id,
    title: p.title,
    platform: p.platform,
    scheduled_at: p.scheduled_at,
    status: p.status,
    client_id: p.client_id,
    publish_retry_count: p.publish_retry_count,
    client_name: p.clients?.name ?? null,
  }))
}

export async function fetchClientOverviewSummaries(supabase: SupabaseClient): Promise<ClientOverviewSummary[]> {
  const { data: summaryData, error } = await supabase
    .from("dashboard_summary")
    .select(
      "client_id, client_name, contact_email, draft_count, sent_count, approved_count, revision_count, deliverable_count, last_activity_at, skills_done, skills_total"
    )
    .not("client_name", "ilike", "Test%")
    .not("client_name", "ilike", "probe%")
    .order("client_name")

  if (error) {
    console.error("[fetchClientOverviewSummaries error]", error)
    return []
  }

  return (summaryData ?? []).map((c) => ({
    id: c.client_id,
    name: c.client_name,
    contact_email: c.contact_email,
    doneSkills: Number(c.skills_done),
    totalSkills: Number(c.skills_total),
    awaitingReview: Number(c.sent_count),
    needsRevision: Number(c.revision_count),
    approved: Number(c.approved_count),
    lastActivityAt: c.last_activity_at,
  }))
}

export async function fetchWeeklyBriefings(supabase: SupabaseClient): Promise<ClientWeeklyBriefing[]> {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const [{ data: summaryData }, { data: pastPostsData }, { data: nextPostsData }] = await Promise.all([
    supabase
      .from("dashboard_summary")
      .select("client_id, client_name")
      .not("client_name", "ilike", "Test%")
      .not("client_name", "ilike", "probe%")
      .order("client_name"),
    supabase
      .from("scheduled_posts")
      .select("id, title, client_id, scheduled_at, post_metrics(reach, likes, comments, shares, saves)")
      .eq("status", "published")
      .gte("scheduled_at", sevenDaysAgo)
      .lte("scheduled_at", now.toISOString()),
    supabase
      .from("scheduled_posts")
      .select("id, client_id")
      .eq("status", "scheduled")
      .gte("scheduled_at", now.toISOString())
      .lte("scheduled_at", sevenDaysLater),
  ])

  const summary = summaryData ?? []

  return summary.map((c) => {
    const clientPast = (pastPostsData ?? []).filter((p) => p.client_id === c.client_id)
    const postsThisWeek = clientPast.length

    let totalReach = 0
    let totalEng = 0
    let topReach = 0
    let topTitle: string | null = null

    for (const post of clientPast) {
      const rawM = post.post_metrics as unknown
      const m = Array.isArray(rawM)
        ? rawM[0]
        : (rawM as { reach?: number; likes?: number; comments?: number; shares?: number; saves?: number } | null)

      if (m) {
        const reach = m.reach || 0
        const eng = (m.likes || 0) + (m.comments || 0) + (m.shares || 0) + (m.saves || 0)
        totalReach += reach
        totalEng += eng
        if (reach > topReach) {
          topReach = reach
          topTitle = post.title
        }
      }
    }

    const engagementRate = totalReach > 0 ? (totalEng / totalReach) * 100 : 0
    const scheduledNextWeek = (nextPostsData ?? []).filter((p) => p.client_id === c.client_id).length

    return {
      clientId: c.client_id,
      clientName: c.client_name,
      postsThisWeek,
      totalReach,
      engagementRate,
      topPostTitle: topTitle,
      topPostReach: topReach,
      scheduledNextWeek,
    }
  })
}

export async function fetchActivityData(supabase: SupabaseClient): Promise<ActivitySlotData> {
  const [{ data: tasksData }, { data: deliverablesData }, { data: historyData }] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, status, due_date, created_at, client_id, clients(name)")
      .in("status", ["pending", "in_progress", "Pending", "In Progress"]),
    supabase
      .from("deliverables")
      .select("id, title, type, status, updated_at")
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase
      .from("status_history")
      .select("id, from_status, to_status, created_at, deliverable_id, deliverables(title)")
      .order("created_at", { ascending: false })
      .limit(5),
  ])

  const LABEL: Record<string, string> = {
    draft: "Draft",
    sent: "Terkirim",
    approved: "Disetujui",
    revision_requested: "Minta Revisi",
  }

  type HistoryRow = {
    id: string
    from_status: string | null
    to_status: string
    created_at: string
    deliverable_id: string
    deliverables: { title: string }[] | null
  }

  const activityItems: RecentActivityItem[] = ((historyData ?? []) as unknown as HistoryRow[]).map((h) => ({
    id: h.id,
    title: h.deliverables?.[0]?.title ?? "Deliverable",
    description: `${LABEL[h.from_status ?? ""] ?? h.from_status ?? "Baru"} → ${
      LABEL[h.to_status] ?? h.to_status
    }`,
    timeAgo: new Date(h.created_at).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    }),
  }))

  const recentDeliverables: RecentDeliverableItem[] = (deliverablesData ?? []).map((d) => ({
    id: d.id,
    title: d.title,
    type: d.type,
    status: d.status,
    updated_at: d.updated_at,
  }))

  const tasks: TaskItem[] = ((tasksData ?? []) as unknown as TaskItem[]).map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    due_date: t.due_date,
    created_at: t.created_at,
    client_id: t.client_id,
    clients: t.clients,
  }))

  return {
    tasks,
    recentDeliverables,
    activityItems,
  }
}
