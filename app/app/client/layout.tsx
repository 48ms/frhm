import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { USER_HEADERS } from "@/lib/supabase/identity-headers"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ClientSidebar } from "@/components/client/client-sidebar"
import { ClientHeader } from "@/components/client/client-header"
import { SkipLink } from "@/components/ui/skip-link"
import { ClientFooter } from "@/components/layout/client-footer"
import { resolveClientId } from "@/features/dashboard/lib/resolve-client-id"
import "@/app/admin/admin-stage.css"

export const dynamic = "force-dynamic"

async function resolveClientIdentity() {
  const h = await headers()
  const id = h.get(USER_HEADERS.id)

  if (id) {
    return {
      userId: id,
      email: h.get(USER_HEADERS.email) ?? "",
      role: h.get(USER_HEADERS.role) ?? "",
      fullName: h.get(USER_HEADERS.name) ?? "",
      clientId: h.get(USER_HEADERS.clientId) ?? "",
    }
  }

  // Fallback: no forwarded headers from middleware
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from("users")
    .select("role, full_name, client_id")
    .eq("id", user.id)
    .single()

  return {
    userId: user.id,
    email: user.email ?? "",
    role: profile?.role ?? "",
    fullName: profile?.full_name ?? "",
    clientId: profile?.client_id ?? "",
  }
}

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const identity = await resolveClientIdentity()

  if (!identity) redirect("/auth/login?next=/client/dashboard")
  if (identity.role !== "client" && identity.role !== "admin") redirect("/waitlist")

  const supabase = await createClient()
  let resolvedId = identity.clientId

  // If admin is viewing the client portal, allow fallback to first active client if none bound
  if (identity.role === "admin" && !resolvedId) {
    resolvedId = await resolveClientId(null)
  }

  if (!resolvedId) {
    redirect("/waitlist")
  }

  const { data: clientRecord } = await supabase
    .from("clients")
    .select("id, name, logo_url, contact_email")
    .eq("id", resolvedId)
    .single()

  const clientInfo = {
    id: resolvedId,
    name: clientRecord?.name ?? "Client Partner",
    logo_url: clientRecord?.logo_url ?? null,
    contact_email: clientRecord?.contact_email ?? null,
  }

  const userInfo = {
    name: identity.fullName || identity.email || "Client Partner",
    email: identity.email,
  }

  return (
    <div className="admin-theme admin-viewport">
      {/* Ambient glow orbs */}
      <div aria-hidden className="admin-orb admin-orb-lavender" />
      <div aria-hidden className="admin-orb admin-orb-lime" />
      <div aria-hidden className="admin-orb admin-orb-cobalt" />

      <SidebarProvider>
        <ClientSidebar client={clientInfo} user={userInfo} />
        <SidebarInset id="main-content" className="min-h-svh flex-1">
          <SkipLink />
          <div className="flex flex-1 flex-col min-w-0">
            <ClientHeader
              clientName={clientInfo.name}
              clientId={clientInfo.id}
              userName={userInfo.name}
              isAdmin={identity.role === "admin"}
            />
            <main
              data-slot="client-main"
              className="mx-auto w-full max-w-[1440px] flex-1 flex flex-col gap-6 p-4 pb-6 lg:p-8 md:pt-4"
            >
              {children}
              <ClientFooter clientId={clientInfo.id} clientName={clientInfo.name} />
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
