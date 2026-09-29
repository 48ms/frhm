import { requireAdmin, loadClientFiles } from '@/lib/ai/server'
import { isResponse } from '@/lib/ai/server'
import { GlobalAutomationsBoard } from '@/components/admin/global-automations-board'
import { PageContainer } from '@/components/layout/page-container'

export const dynamic = 'force-dynamic'

export default async function GlobalAutomationsPage() {
  const ctx = await requireAdmin()
  if (isResponse(ctx)) throw ctx
  const { supabase } = ctx

  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, name')
    .order('name')

  if (error || !clients) {
    return <div>Error loading clients: {error?.message}</div>
  }

  // Pre-fetch which clients have brand-profile.md
  const automationClients = await Promise.all(
    clients.map(async (client) => {
      const files = await loadClientFiles(supabase, client.id)
      const hasBrandProfile = !!files['brand-profile.md']
      return {
        id: client.id,
        name: client.name,
        hasBrandProfile,
      }
    })
  )

  return (
    <PageContainer
      pageTitle="Batch Automations"
      pageDescription="Pabrik Konten: Buat ratusan kampanye untuk banyak klien sekaligus dengan AI."
    >
      <GlobalAutomationsBoard initialClients={automationClients} />
    </PageContainer>
  )
}
