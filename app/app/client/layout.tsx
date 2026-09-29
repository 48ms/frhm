import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ClientSidebar } from "@/components/client-sidebar"
import { BottomNav } from "@/components/bottom-nav"
import { ClientHeader } from "@/components/client/client-header"
import { DeliverableNotifier } from "@/components/client/deliverable-notifier"

export const dynamic = "force-dynamic"

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login?redirect=/client/dashboard")

  const { data: profile } = await supabase
    .from("users")
    .select("role, full_name, client_id")
    .eq("id", user.id)
    .single()

  if (profile?.role === "admin") redirect("/admin/dashboard")

  const [{ count: pendingDeliverables }, { count: pendingPosts }] = await Promise.all([
    supabase
      .from("deliverables")
      .select("id", { count: "exact", head: true })
      .eq("client_id", profile?.client_id ?? "")
      .eq("status", "sent"),
    supabase
      .from("platform_posts")
      .select("id", { count: "exact", head: true })
      .eq("client_id", profile?.client_id ?? "")
      .eq("status", "InReview"),
  ])

  const totalPending = (pendingDeliverables ?? 0) + (pendingPosts ?? 0)

  let brandName = profile?.full_name || "Portal Klien"
  if (profile?.client_id) {
    const { data: clientData } = await supabase
      .from("clients")
      .select("name")
      .eq("id", profile.client_id)
      .maybeSingle()
    if (clientData?.name) brandName = clientData.name
  }

  return (
    <SidebarProvider>
      <ClientSidebar
        pendingCount={totalPending}
        user={{
          name: profile?.full_name || user.email || "Client",
          email: user.email || "",
          avatar: "",
        }}
      />
      <SidebarInset>
        <ClientHeader
          brandName={brandName}
          userName={profile?.full_name || user.email || "Klien"}
          userEmail={user.email || ""}
          pendingCount={totalPending}
        />
        <div className="flex flex-1 flex-col gap-4 p-4 pb-20 md:p-6 md:pb-6">
          <DeliverableNotifier clientId={profile?.client_id ?? ""} />
          {children}
        </div>
      </SidebarInset>
      <BottomNav pendingCount={totalPending} />
    </SidebarProvider>
  )
}
