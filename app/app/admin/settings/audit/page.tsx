import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AuditLogList } from './list'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

// Build a PostgREST `or` filter that matches `q` in summary or actor_name.
// The value is wrapped in double quotes and backslash/quote are escaped, because
// PostgREST parses commas and parentheses in an unquoted value as logic-tree
// syntax: a raw comma makes the request fail with "failed to parse logic tree".
// (Verified against the live table: raw comma -> parse error, quoted -> 0 rows,
// normal word still matches.) `%` and `_` keep their LIKE wildcard meaning, which
// is the usual behaviour of a search box.
function ilikeFilter(q: string): string {
  const escaped = q.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const pattern = `"%${escaped}%"`
  return `summary.ilike.${pattern},actor_name.ilike.${pattern}`
}

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

interface AuditPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AuditPage({ searchParams }: AuditPageProps) {
  const sp = await searchParams
  const page = Math.max(1, parseInt((sp.page as string) ?? '1', 10) || 1)
  const action = (sp.action as string) ?? 'all'
  const q = ((sp.q as string) ?? '').trim()
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

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

  // Server-side pagination, backed by audit_log_created_at_idx (created_at DESC).
  // Filtering and search run in the database so they cover the whole table, not
  // just the rows on screen. count:'exact' returns the total for the current filter.
  let query = supabase
    .from('audit_log')
    .select('id, actor_id, actor_role, actor_name, action, entity_type, entity_id, client_id, summary, metadata, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
  if (action !== 'all') query = query.eq('action', action)
  if (q) query = query.or(ilikeFilter(q))
  query = query.range(from, to)

  const { data: rows, count } = await query

  // Distinct actions with counts for the filter. One short text column; the
  // count is done in JS so no extra database object is needed.
  const { data: actionRows } = await supabase.from('audit_log').select('action')
  const actionMap = new Map<string, number>()
  for (const r of actionRows ?? []) actionMap.set(r.action, (actionMap.get(r.action) ?? 0) + 1)
  const actionOptions = Array.from(actionMap.entries()).sort((a, b) => b[1] - a[1])
  const totalAll = actionRows?.length ?? 0

  // Client names for the rows on this page (one query, not N)
  const clientIds = Array.from(new Set((rows ?? []).map((r) => r.client_id).filter(Boolean))) as string[]
  const nameById = new Map<string, string>()
  if (clientIds.length > 0) {
    const { data: clients } = await supabase
      .from('clients').select('id, name').in('id', clientIds)
    for (const c of clients ?? []) nameById.set(c.id, c.name)
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 md:p-6">
      <AuditLogList
        rows={(rows ?? []) as AuditRow[]}
        clientNames={Object.fromEntries(nameById)}
        actionOptions={actionOptions}
        totalAll={totalAll}
        total={count ?? 0}
        page={page}
        pageSize={PAGE_SIZE}
        currentAction={action}
        query={q}
      />
    </div>
  )
}
