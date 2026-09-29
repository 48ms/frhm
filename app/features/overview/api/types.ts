export interface PipelineStats {
  total: number
  sent: number
  approved: number
  revision: number
}

export interface TodayScheduledPost {
  id: string
  title: string
  platform: string
  scheduled_at: string
  status: string
  client_id: string
  publish_retry_count: number | null
  client_name?: string | null
}

export interface ClientOverviewSummary {
  id: string
  name: string
  contact_email: string | null
  doneSkills: number
  totalSkills: number
  awaitingReview: number
  needsRevision: number
  approved: number
  lastActivityAt: string | null
}

export interface ClientWeeklyBriefing {
  clientId: string
  clientName: string
  postsThisWeek: number
  totalReach: number
  engagementRate: number
  topPostTitle: string | null
  topPostReach: number
  scheduledNextWeek: number
}

export interface RecentDeliverableItem {
  id: string
  title: string
  type: string
  status: string
  updated_at: string
}

export interface RecentActivityItem {
  id: string
  title: string
  description: string
  timeAgo: string
}

export interface TaskItem {
  id: string
  title: string
  status: string
  due_date: string | null
  created_at: string
  client_id: string
  clients?: { name: string } | null
}

export interface ActivitySlotData {
  tasks: TaskItem[]
  recentDeliverables: RecentDeliverableItem[]
  activityItems: RecentActivityItem[]
}
