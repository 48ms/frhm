import { PageContainer } from "@/components/layout/page-container"
import { ClientManager } from "@/components/client/client-manager"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Client Workspaces | Frahma",
  description: "Kelola portofolio klien, profil brand, dan workspace multi-tenant Frahma.",
}

export default function ClientsPage() {
  return (
    <PageContainer
      pageTitle="Client Workspaces"
      pageDescription="Manage your client portfolio, brand profiles, and workspace settings."
    >
      <ClientManager />
    </PageContainer>
  )
}
