import { NextResponse } from 'next/server'
import { requireAdmin, isResponse } from '@/lib/ai/server'

export const dynamic = 'force-dynamic'

// GET /api/admin/deliverable-templates
// Deliverable templates are shared content scaffolds used by the admin workspace.
// The RLS read policy is intentionally permissive (any authenticated user), but this
// endpoint returns the full list including the internal content_md bodies, so it is
// admin-only.
export async function GET(request: Request) {
  const ctx = await requireAdmin()
  if (isResponse(ctx)) return ctx
  const { supabase } = ctx

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  let query = supabase
    .from('deliverable_templates')
    .select('*')
    .order('created_at', { ascending: true })

  if (type) {
    query = query.eq('type', type)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ templates: data ?? [] })
}
