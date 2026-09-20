import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { BottomNav } from "@/components/bottom-nav"
import { Separator } from "@/components/ui/separator"
import { PRODUCT_NAME } from "@/lib/config"
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

  const { count: pendingCount } = await supabase
    .from("deliverables")
    .select("id", { count: "exact", head: true })
    .eq("client_id", profile?.client_id ?? "")
    .eq("status", "sent")

  return (
    <SidebarProvider>
      <AppSidebar
        role="client"
        pendingCount={pendingCount ?? 0}
        user={{
          name: profile?.full_name || user.email || "Client",
          email: user.email || "",
          avatar: "",
        }}
      />
      <SidebarInset>
        <header className="hidden md:flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1 size-7" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="text-sm font-medium">{PRODUCT_NAME}</span>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pb-20 md:p-6 md:pb-6">
          <DeliverableNotifier clientId={profile?.client_id ?? ""} />
          {children}
        </div>
      </SidebarInset>
      <BottomNav pendingCount={pendingCount ?? 0} />
    </SidebarProvider>
  )
}
