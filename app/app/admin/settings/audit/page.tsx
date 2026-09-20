import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AuditLogList } from './list'

export const dynamic = 'force-dynamic'

export type AuditRow = {
  id: string
  actor_id: string | null
  actor_role: string | null
  actor_name: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  client_id: string | null
  summary: string
  metadata: Record<string, unknown>
  created_at: string
}

export default async function AuditPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() { /* read-only page */ },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/client/dashboard')

  // RLS already restricts to admins; the explicit order keeps the list stable
  const { data: rows } = await supabase
    .from('audit_log')
    .select('id, actor_id, actor_role, actor_name, action, entity_type, entity_id, client_id, summary, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(300)

  // client names for the rows that reference one (one query, not N)
  const clientIds = Array.from(new Set((rows ?? []).map((r) => r.client_id).filter(Boolean))) as string[]
  const nameById = new Map<string, string>()
  if (clientIds.length > 0) {
    const { data: clients } = await supabase
      .from('clients').select('id, name').in('id', clientIds)
    for (const c of clients ?? []) nameById.set(c.id, c.name)
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-muted-foreground text-sm">
          Jejak tindakan penting: publish, kirim, persetujuan, revisi, dan reset password.
        </p>
      </div>
      <AuditLogList
        rows={(rows ?? []) as AuditRow[]}
        clientNames={Object.fromEntries(nameById)}
      />
    </div>
  )
}
