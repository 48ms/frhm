import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SkipLink } from "@/components/ui/skip-link"
import { AdminHeader } from "./header"
import { InfobarProvider } from "@/components/ui/infobar"
import { InfoSidebar } from "@/components/layout/info-sidebar"
import { AdminFooter } from "@/components/layout/admin-footer"
import { CreateClientProvider } from "@/components/client/create-client-provider"
import "./admin-stage.css"

export const dynamic = "force-dynamic"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login?redirect=/admin/dashboard")

  const { data: profile } = await supabase
    .from("users")
    .select("role, full_name")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") redirect("/admin/dashboard")

  return (
    <div className="admin-theme admin-viewport">
      {/* Ambient glow orbs (decorative). */}
      <div aria-hidden className="admin-orb admin-orb-lavender" />
      <div aria-hidden className="admin-orb admin-orb-lime" />
      <div aria-hidden className="admin-orb admin-orb-cobalt" />

      <SidebarProvider>
        <AppSidebar
          user={{
            name: profile?.full_name || user.email || "Admin",
            email: user.email || "",
            avatar: "",
          }}
        />
        <SidebarInset id="main-content" className="min-h-svh flex-1">
          <SkipLink />
          <InfobarProvider defaultOpen={false}>
            <CreateClientProvider>
            <div className="flex flex-1 flex-col min-w-0">
              <AdminHeader
                userName={profile?.full_name || user.email || "Admin"}
                unreadCount={1}
              />
              {/* Mobile: 16px top padding for header; Desktop: no extra padding */}
              <div data-slot="admin-main" className="mx-auto w-full max-w-[1440px] flex-1 space-y-8 p-4 pb-6 lg:p-8 md:pt-0">
                {children}
                <AdminFooter />
              </div>
            </div>
            </CreateClientProvider>
            <InfoSidebar />
          </InfobarProvider>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
