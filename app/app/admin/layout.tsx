import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { USER_HEADERS } from "@/lib/supabase/identity-headers"
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

/**
 * Resolve the current admin identity.
 *
 * FAST PATH: the middleware (proxy.ts) already ran `auth.getUser()` and the
 * `users` profile query for every /admin request, then forwarded the result as
 * request headers. Reading them costs 0 network round-trips.
 *
 * FALLBACK: if the headers are missing (middleware skipped, or a non-/admin
 * entry point), we query Supabase directly so the layout never breaks.
 */
async function resolveIdentity() {
  const h = await headers()
  const id = h.get(USER_HEADERS.id)

  if (id) {
    return {
      userId: id,
      email: h.get(USER_HEADERS.email) ?? "",
      role: h.get(USER_HEADERS.role) ?? "",
      fullName: h.get(USER_HEADERS.name) ?? "",
    }
  }

  // Fallback: no forwarded headers — query directly (slower, but correct).
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from("users")
    .select("role, full_name")
    .eq("id", user.id)
    .single()

  return {
    userId: user.id,
    email: user.email ?? "",
    role: profile?.role ?? "",
    fullName: profile?.full_name ?? "",
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const identity = await resolveIdentity()

  if (!identity) redirect("/auth/login?next=/admin/dashboard")
  if (identity.role === "client") redirect("/client/dashboard")
  if (identity.role !== "admin") redirect("/waitlist")

  const displayName = identity.fullName || identity.email || "Admin"

  return (
    <div className="admin-theme admin-viewport">
      {/* Ambient glow orbs (decorative). */}
      <div aria-hidden className="admin-orb admin-orb-lavender" />
      <div aria-hidden className="admin-orb admin-orb-lime" />
      <div aria-hidden className="admin-orb admin-orb-cobalt" />

      <SidebarProvider>
        <CreateClientProvider>
          <AppSidebar
            user={{
              name: displayName,
              email: identity.email,
              avatar: "",
              role: identity.role,
            }}
          />
          <SidebarInset id="main-content" className="min-h-svh flex-1">
            <SkipLink />
            <InfobarProvider defaultOpen={false}>
              <div className="flex flex-1 flex-col min-w-0">
                <AdminHeader
                  userName={displayName}
                  unreadCount={0}
                />
                {/* Mobile: 16px top padding for header; Desktop: no extra padding */}
                <div data-slot="admin-main" className="mx-auto w-full max-w-[1440px] flex-1 space-y-8 p-4 pb-6 lg:p-8 md:pt-0">
                  {children}
                  <AdminFooter />
                </div>
              </div>
              <InfoSidebar />
            </InfobarProvider>
          </SidebarInset>
        </CreateClientProvider>
      </SidebarProvider>
    </div>
  )
}
