import { PageContainer } from "@/components/layout/page-container"
import { ClientManager } from "@/components/client/client-manager"

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
