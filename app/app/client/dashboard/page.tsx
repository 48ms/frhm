import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeftIcon, CheckCircle2Icon, SendIcon } from "lucide-react"
import { FeedbackDialog } from "@/components/client/feedback-dialog"
import { TelegramConnectCard } from "@/components/telegram/telegram-connect-card"

export const dynamic = "force-dynamic"

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
      .eq("client_id", profile?.client_id || '')
      .order("updated_at", { ascending: false })
    deliverables = deliv || []
  } catch (e: unknown) {
    error = (e as Error).message || "Gagal memuat data"
  }

  const brandName = clientData?.name ?? profile?.full_name ?? ""

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card>
          <CardContent>
            <p className="text-destructive">{error}</p>
            <Button onClick={() => window.location.reload()}>Coba Lagi</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ... existing JSX body (unchanged from original lines 65 onward) */}
      <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/client">
              <ChevronLeftIcon className="size-5 text-muted-foreground hover:text-foreground" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{brandName || "Dashboard"}</h1>
              <p className="text-sm text-muted-foreground">
                Kelola konten, jadwal, dan performa Anda
              </p>
            </div>
          </div>
        </div>

        {/* Telegram Notifications */}
        {clientData && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <SendIcon className="size-5 text-primary" />
                Notifikasi Telegram
              </CardTitle>
              <CardDescription>
                Terhubungkan akun Telegram untuk menerima laporan otomatis.
              </CardDescription>
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

        {/* Deliverables */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Konten Produksi</CardTitle>
            <CardDescription>
              {deliverables.length} item dalam produksi.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {deliverables.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada konten dalam produksi.</p>
            ) : (
              <div className="space-y-3">
                {deliverables.map(d => {
                  const statusColor = {
                    published: "text-green-600",
                    scheduled: "text-blue-600",
                    draft: "text-gray-600",
                    revision_requested: "text-amber-600",
                  }[d.status as string] || "text-gray-600"
                  const typeLabel = d.type?.charAt(0).toUpperCase() + d.type?.slice(1) || d.type
                  return (
                    <div key={d.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2Icon className={`size-4 ${statusColor}`} />
                        <span className="font-medium">{d.title}</span>
                        {d.type && <span className="text-muted-foreground">({typeLabel})</span>}
                      </div>
                      <span className={`text-xs ${statusColor}`}>{d.status}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Feedback */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
          <div>
            <h3 className="font-medium">Butuh bantuan?</h3>
            <p className="text-sm text-muted-foreground">
              Kirim feedback ke tim Frhm.
            </p>
          </div>
          <FeedbackDialog clientId={profile?.client_id || ''} />
        </div>
      </div>
    </div>
  )
}
