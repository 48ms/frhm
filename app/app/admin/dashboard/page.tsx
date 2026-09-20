import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { NumberTicker } from "@/components/motion/number-ticker"
import { ClientOverview, ActionStrip, type ClientSummary } from "./client-overview"
import { WeeklyBriefingWidget, type ClientBriefing } from "./weekly-briefing-widget"
import { ActionCenterWidget } from "@/components/dashboard/action-center-widget"
import { PlusIcon, CalendarIcon, ExternalLinkIcon, SendIcon, FileTextIcon, History } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

export default async function AdminDashboard() {
  const supabase = await createClient()

  const { data: deliverables } = await supabase
    .from("deliverables")
    .select("id, title, type, status, updated_at, client_id")
    .order("updated_at", { ascending: false })

  const all = deliverables ?? []
  const stats = {
    total: all.length,
    draft: all.filter((d) => d.status === "draft").length,
    sent: all.filter((d) => d.status === "sent").length,
    approved: all.filter((d) => d.status === "approved").length,
    revision: all.filter((d) => d.status === "revision_requested").length,
  }

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const [{ data: clients }, { data: clientSkills }, { data: delivByClient }, { data: todayPostsData }, { data: pastPostsData }, { data: nextPostsData }, { data: tasksData }] = await Promise.all([
    supabase.from("clients").select("id, name, contact_email").order("name"),
    supabase.from("client_skills").select("client_id, status"),
    supabase.from("deliverables").select("client_id, status, updated_at"),
    supabase.from("scheduled_posts")
      .select("id, title, platform, scheduled_at, status, client_id, publish_retry_count, clients(name)")
      .in("status", ["scheduled", "failed", "draft"])
      .gte("scheduled_at", new Date(new Date().setHours(0,0,0,0)).toISOString())
      .lte("scheduled_at", new Date(new Date().setHours(23,59,59,999)).toISOString())
      .order("scheduled_at", { ascending: true }),
    supabase.from("scheduled_posts")
      .select("id, title, client_id, scheduled_at, post_metrics(reach, likes, comments, shares, saves)")
      .eq("status", "published")
      .gte("scheduled_at", sevenDaysAgo)
      .lte("scheduled_at", now.toISOString()),
    supabase.from("scheduled_posts")
      .select("id, client_id")
      .eq("status", "scheduled")
      .gte("scheduled_at", now.toISOString())
      .lte("scheduled_at", sevenDaysLater),
    supabase.from("tasks")
      .select("id, title, status, created_at, client_id")
      .in("status", ["pending", "in_progress"]),
  ])

  // Aggregate weekly briefing per client
  const clientBriefings: ClientBriefing[] = (clients ?? []).map((c) => {
    const clientPast = (pastPostsData ?? []).filter((p) => p.client_id === c.id)
    const postsThisWeek = clientPast.length
    
    let totalReach = 0
    let totalEng = 0
    let topReach = 0
    let topTitle: string | null = null

    for (const post of clientPast) {
      const m = (post.post_metrics as unknown as Array<{ reach: number; likes: number; comments: number; shares: number; saves: number }>)?.[0]
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
    const scheduledNextWeek = (nextPostsData ?? []).filter((p) => p.client_id === c.id).length

    return {
      clientId: c.id,
      clientName: c.name,
      postsThisWeek,
      totalReach,
      engagementRate,
      topPostTitle: topTitle,
      topPostReach: topReach,
      scheduledNextWeek,
    }
  })

  const skillTotals = new Map<string, { done: number; total: number }>()
  for (const cs of clientSkills ?? []) {
    const t = skillTotals.get(cs.client_id) ?? { done: 0, total: 0 }
    t.total += 1
    if (cs.status === "selesai") t.done += 1
    skillTotals.set(cs.client_id, t)
  }

  const delivTotals = new Map<string, { review: number; revision: number; approved: number; last: string | null }>()
  for (const d of delivByClient ?? []) {
    const t = delivTotals.get(d.client_id) ?? { review: 0, revision: 0, approved: 0, last: null }
    if (d.status === "sent") t.review += 1
    if (d.status === "revision_requested") t.revision += 1
    if (d.status === "approved") t.approved += 1
    if (d.updated_at && (!t.last || d.updated_at > t.last)) t.last = d.updated_at
    delivTotals.set(d.client_id, t)
  }

  const clientSummaries: ClientSummary[] = (clients ?? []).map((c) => {
    const sk = skillTotals.get(c.id) ?? { done: 0, total: 0 }
    const dv = delivTotals.get(c.id) ?? { review: 0, revision: 0, approved: 0, last: null }
    return {
      id: c.id,
      name: c.name,
      contact_email: c.contact_email,
      doneSkills: sk.done,
      totalSkills: sk.total,
      awaitingReview: dv.review,
      needsRevision: dv.revision,
      approved: dv.approved,
      lastActivityAt: dv.last,
    }
  })

  const { data: history } = await supabase
    .from("status_history")
    .select("id, from_status, to_status, created_at, deliverable_id, deliverables(title)")
    .order("created_at", { ascending: false })
    .limit(8)

  const LABEL: Record<string, string> = {
    draft: "Draft", sent: "Terkirim", approved: "Disetujui", revision_requested: "Minta Revisi",
  }

  type HistoryRow = {
    id: string
    from_status: string | null
    to_status: string
    created_at: string
    deliverable_id: string
    deliverables: { title: string }[] | null
  }

  const activityItems = ((history ?? []) as unknown as HistoryRow[]).map((h) => ({
    title: h.deliverables?.[0]?.title ?? "Deliverable",
    description: `${LABEL[h.from_status ?? ""] ?? h.from_status ?? "Baru"} → ${LABEL[h.to_status] ?? h.to_status}`,
    timeAgo: new Date(h.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
    kind: h.to_status === "approved" ? "success" : h.to_status === "revision_requested" ? "warning" : "info",
  }))

  const recent = all.slice(0, 5)
  const todayPosts = todayPostsData as unknown as { id: string, title: string, platform: string, scheduled_at: string, status: string, client_id: string, publish_retry_count: number | null, clients?: { name: string } }[] | null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Ringkasan deliverable klien</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/settings/telegram">
            <Button variant="outline" className="h-11 sm:h-9 text-xs sm:text-sm">
              <SendIcon className="size-4 mr-1.5" />
              Notifikasi Telegram
            </Button>
          </Link>
          <Link href="/admin/deliverables/new">
            <Button className="h-11 sm:h-9 text-xs sm:text-sm">
              <PlusIcon className="size-4 mr-1.5" />
              Deliverable Baru
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <Card className="rounded-2xl border-border/40 shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold">Total deliverable</CardDescription>
          </CardHeader>
          <CardContent>
            <NumberTicker value={stats.total} className="text-5xl font-extrabold tracking-tighter tabular-nums text-brand-accent" />
            <p className="text-muted-foreground mt-2 text-xs font-medium">Semua deliverable lintas klien</p>
          </CardContent>
        </Card>
        <div className="rounded-2xl overflow-hidden border border-border/40 shadow-sm bg-card/50 backdrop-blur-sm">
          <ActionStrip
            awaitingReview={stats.sent}
            needsRevision={stats.revision}
            approved={stats.approved}
          />
        </div>
      </div>

      <Card className="rounded-2xl border-brand-accent/20 bg-brand-accent/5 shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2 font-bold">
              <CalendarIcon className="size-4 text-brand-accent" />
              Jadwal Tayang Hari Ini
            </CardTitle>
            <CardDescription className="font-medium mt-1">
              {todayPosts?.length ? `${todayPosts.length} konten harus tayang hari ini` : "Tidak ada jadwal tayang hari ini"}
            </CardDescription>
          </div>
          <Link href="/admin/calendar">
            <Button variant="outline" size="sm" className="h-10 sm:h-9 gap-1 rounded-xl bg-background shadow-sm border-border/50 hover:border-brand-accent/50 hover:text-brand-accent transition-colors">
              Kalender <ExternalLinkIcon className="size-3" />
            </Button>
          </Link>
        </CardHeader>
        {todayPosts && todayPosts.length > 0 && (
          <CardContent className="pt-0">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {todayPosts.map((post) => {
                const time = new Date(post.scheduled_at).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })
                return (
                  <div key={post.id} className="flex flex-col gap-2 rounded-xl border border-border/50 bg-background/80 shadow-sm p-4 hover:border-brand-accent/40 transition-colors group">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs font-semibold tabular-nums text-muted-foreground group-hover:text-foreground">
                        {time}
                      </Badge>
                      <div className="flex items-center gap-1.5">
                        {post.publish_retry_count && post.publish_retry_count > 0 && (
                          <Badge variant="outline" className="text-[10px] font-bold tracking-wide border-amber-500/40 bg-amber-500/10 text-amber-600">
                            Retry {post.publish_retry_count}/3
                          </Badge>
                        )}
                        <Badge variant={post.status === 'failed' ? 'destructive' : 'secondary'} className="text-[10px] uppercase font-bold tracking-wider bg-brand-accent/10 text-brand-accent border-none">
                          {post.platform}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-1">
                      <p className="text-sm font-semibold leading-tight line-clamp-2">{post.title}</p>
                      <p className="text-xs text-muted-foreground mt-1.5 font-medium">{post.clients?.name}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        )}
      </Card>

      <div className="rounded-2xl border border-border/40 shadow-sm bg-card/50 overflow-hidden">
        <ActionCenterWidget initialTasks={tasksData || []} />
      </div>
      
      {/* Weekly Briefing Widget per Spec §5 / Design §6 */}
      <div className="rounded-2xl border border-border/40 shadow-sm bg-card/50 overflow-hidden">
        <WeeklyBriefingWidget briefings={clientBriefings} />
      </div>

      <div className="rounded-2xl border border-border/40 shadow-sm bg-card/50 overflow-hidden">
        <ClientOverview clients={clientSummaries} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/40 shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Deliverable Terbaru</h3>
          </CardHeader>
          <CardContent className="pt-0">
            {recent.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <FileTextIcon className="size-6 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Belum ada deliverable.</p>
                <Link href="/admin/deliverables/new" className="mt-2 text-sm font-semibold text-brand-accent hover:underline">
                  Buat yang pertama
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {recent.map((d) => (
                  <Link
                    key={d.id}
                    href={`/admin/deliverables/${d.id}`}
                    className="-mx-4 flex items-center justify-between px-4 py-3.5 transition-colors hover:bg-muted/50 group"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground group-hover:text-brand-accent transition-colors">{d.title}</p>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">{d.type}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {activityItems.length > 0 ? (
          <Card className="rounded-2xl border-border/40 shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Aktivitas Terbaru</h3>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              {activityItems.map((item, i) => (
                <div key={i} className="flex items-start gap-4 text-sm group">
                  <div className="mt-0.5 size-2 rounded-full bg-brand-accent/50 group-hover:bg-brand-accent group-hover:scale-125 transition-all" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 font-medium">{item.description}</p>
                  </div>
                  <time className="text-xs font-semibold text-muted-foreground tabular-nums whitespace-nowrap bg-muted/50 px-2 py-1 rounded-md">{item.timeAgo}</time>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-2xl border-border/40 shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Aktivitas Terbaru</h3>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <History className="size-6 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-muted-foreground max-w-[200px]">
                  Belum ada aktivitas. Perubahan status deliverable akan tampil di sini.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}