import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { AdminCommandSearch } from "@/components/admin-command-search"
import { CreateClientProvider } from "@/components/client/create-client-provider"
import { PRODUCT_NAME } from "@/lib/config"

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

  if (profile?.role !== "admin") redirect("/client/dashboard")

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .order("name")

  return (
    <CreateClientProvider>
      <SidebarProvider>
        <AppSidebar
          role="admin"
          clients={(clients ?? []).map((c) => ({ id: c.id, name: c.name }))}
          user={{
            name: profile.full_name || user.email || "Admin",
            email: user.email || "",
            avatar: "",
          }}
        />
        <SidebarInset>
          <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between px-6 w-full bg-background/60 backdrop-blur-xl transition-all">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="-ml-2 size-9" />
              <Separator orientation="vertical" className="mr-2 h-4 opacity-50" />
              <span className="text-sm font-medium text-muted-foreground/80 tracking-wide">Frhm Enterprise <span className="mx-2">/</span> <span className="text-foreground font-semibold">Workspace</span></span>
            </div>
            <div className="flex items-center gap-4">
              <AdminCommandSearch />
              <button className="relative size-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-bell"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                <span className="absolute top-2 right-2 flex size-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-75"></span>
                  <span className="relative inline-flex rounded-full size-1.5 bg-brand-accent"></span>
                </span>
              </button>
              <div className="size-8 rounded-full bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center overflow-hidden">
                <span className="text-xs font-semibold text-brand-accent">{profile.full_name?.charAt(0) || "A"}</span>
              </div>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </CreateClientProvider>
  )
}
