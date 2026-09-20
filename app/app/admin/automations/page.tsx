import { requireAdmin, loadClientFiles } from '@/lib/ai/server'
import { isResponse } from '@/lib/ai/server'
import { GlobalAutomationsBoard } from '@/components/admin/global-automations-board'

export const dynamic = 'force-dynamic'

export default async function GlobalAutomationsPage() {
  const ctx = await requireAdmin()
  if (isResponse(ctx)) return ctx
  const { supabase } = ctx

  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, name')
    .order('name')

  if (error || !clients) {
    return <div>Error loading clients: {error?.message}</div>
  }

  // Pre-fetch which clients have brand-profile.md
  // We process this sequentially or with Promise.all
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Batch Automations</h1>
        <p className="text-muted-foreground">
          Pabrik Konten: Buat ratusan kampanye untuk banyak klien sekaligus dengan AI.
        </p>
      </div>
      
      <GlobalAutomationsBoard initialClients={automationClients} />
    </div>
  )
}
