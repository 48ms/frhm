import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageContainer } from "@/components/layout/page-container"
import { Icons } from "@/components/icons"
import { FeedbackDialog } from "@/components/client/feedback-dialog"
import { TelegramConnectCard } from "@/components/telegram/telegram-connect-card"

export const dynamic = "force-dynamic"

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  sent: "Perlu Persetujuan",
  revision_requested: "Revisi",
  published: "Publik",
  scheduled: "Terjadwal",
}

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  revision_requested: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  published: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  scheduled: "bg-sky-500/15 text-sky-700 dark:text-sky-400",
}

export default async function ClientDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile: { client_id: string; full_name: string } | null = null
  let clientData: { id: string; name: string; telegram_chat_id: string | null; telegram_username: string | null; telegram_notifications_enabled: boolean } | null = null
  let deliverables: Array<{ id: string; title: string; type: string; status: string; updated_at: string }> = []
  let error: string | null = null

  try {
    const { data: prof } = await supabase
      .from("users")
      .select("client_id, full_name")
      .eq("id", user!.id)
      .single()
    profile = prof

    if (profile?.client_id) {
      const { data: cli } = await supabase
        .from("clients")
        .select("id, name, telegram_chat_id, telegram_username, telegram_notifications_enabled")
        .eq("id", profile.client_id)
        .maybeSingle()
      clientData = cli
    }

    const { data: deliv } = await supabase
      .from("deliverables")
      .select("id, title, type, status, updated_at")
      .eq("client_id", profile?.client_id || "")
      .order("updated_at", { ascending: false })
    deliverables = deliv || []
  } catch (e: unknown) {
    error = (e as Error).message || "Gagal memuat data"
  }

  if (error) {
    return (
      <PageContainer>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10">
            <p className="text-destructive">{error}</p>
            <Button onClick={() => window.location.reload()}>Coba Lagi</Button>
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  const brandName = clientData?.name ?? profile?.full_name ?? "Brand"
  const total = deliverables.length
  const pending = deliverables.filter((d) => d.status === "sent").length
  const published = deliverables.filter((d) => d.status === "published").length
  const inProduction = total - published - pending
  const recent = deliverables.slice(0, 5)

  const stats = [
    { label: "Total Konten", value: String(total), delta: `${published} sudah dipublikasikan`, tone: "text-success" },
    { label: "Perlu Persetujuan", value: String(pending), delta: pending > 0 ? "Menunggu review kamu" : "Tidak ada pending", tone: pending > 0 ? "text-warning" : "text-muted-foreground" },
    { label: "Dipublikasikan", value: String(published), delta: "Sudah tayang", tone: "text-muted-foreground" },
    { label: "Dalam Produksi", value: String(Math.max(0, inProduction)), delta: "Sedang dikerjakan", tone: "text-muted-foreground" },
  ]

  return (
    <PageContainer
      pageTitle={`Halo, ${brandName}`}
      pageDescription="Ringkasan konten, persetujuan, dan performa brand kamu."
      pageHeaderAction={
        pending > 0 ? (
          <Button variant="success" size="sm" className="font-medium h-9 text-xs sm:text-sm">
            <Link href="/client/approvals" className="contents">
              <Icons.notification className="mr-1.5 size-4" />
              {pending} Perlu Disetujui
              <Icons.arrowRight className="ml-1.5 size-4" />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="h-9 text-xs sm:text-sm">
            <Link href="/client/calendar" className="contents">
              <Icons.post className="mr-1.5 size-4" />
              Buka Kalender Konten
            </Link>
          </Button>
        )
      }
    >
      <div className="flex flex-1 flex-col gap-4">
        {/* Stats bar */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardHeader>
                <CardDescription>{s.label}</CardDescription>
                <CardTitle className="text-3xl font-semibold tabular-nums">{s.value}</CardTitle>
                <span className={`text-xs font-medium ${s.tone}`}>{s.delta}</span>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Recent deliverables */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Isi Terbaru</CardTitle>
              <CardDescription>Deliverable yang terakhir diperbarui tim Frhm.</CardDescription>
            </CardHeader>
            <CardContent>
              {recent.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                  <Icons.post className="size-8" />
                  <p className="text-sm">Belum ada konten dalam produksi.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {recent.map((d) => {
                    const statusLabel = STATUS_LABEL[d.status] ?? d.status
                    const statusStyle = STATUS_STYLE[d.status] ?? "bg-muted text-muted-foreground"
                    const initials = (d.title || "?").charAt(0).toUpperCase()
                    return (
                      <div key={d.id} className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold">
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{d.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {d.type ? d.type.charAt(0).toUpperCase() + d.type.slice(1) : "Konten"} ·
                            {new Date(d.updated_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle}`}>
                          {statusLabel}
                        </span>
                        <Link href={`/client/deliverables/${d.id}`} className="shrink-0" aria-label={`Detail ${d.title}`}>
                          <Icons.arrowRight className="size-4 text-muted-foreground hover:text-foreground" />
                        </Link>
                      </div>
                    )
                  })}
                </div>
              )}
              {recent.length > 0 && (
                <Button variant="ghost" className="mt-4 w-full" size="sm">
                  <Link href="/client/deliverables" className="contents">Lihat semua konten <Icons.arrowRight className="ml-1 size-3.5" /></Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Side cards */}
          <div className="flex flex-col gap-4">
            {clientData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Icons.send className="size-4 text-primary" />
                    Notifikasi Telegram
                  </CardTitle>
                  <CardDescription>Terima laporan otomatis lewat Telegram.</CardDescription>
                </CardHeader>
                <CardContent>
                  <TelegramConnectCard
                    type="client"
                    id={clientData.id}
                    name={clientData.name}
                    initialChatId={clientData.telegram_chat_id}
                    initialUsername={clientData.telegram_username}
                    initialEnabled={clientData.telegram_notifications_enabled}
                  />
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Butuh Bantuan?</CardTitle>
                <CardDescription>Kirim feedback ke tim Frhm.</CardDescription>
              </CardHeader>
              <CardContent>
                <FeedbackDialog clientId={profile?.client_id || ""} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
