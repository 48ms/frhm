import { NextResponse } from 'next/server'
import { requireAdmin, isResponse } from '@/lib/ai/server'

export const dynamic = 'force-dynamic'

/**
 * Add a comment to a deliverable (admin).
 *
 * POST /api/admin/deliverables/[id]/comments
 *   body: { content: string }
 *
 * The author is taken from the authenticated admin session — never from the request body —
 * so the author_id of a comment can never be spoofed (the underlying
 * `deliverable_comments` view writes through a SECURITY DEFINER trigger that trusts
 * the supplied author_id).
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const ctx = await requireAdmin()
  if (isResponse(ctx)) return ctx
  const { supabase } = ctx

  const body = await req.json().catch(() => ({}))
  const content: string = body?.content ?? ''
  if (!content.trim()) {
    return NextResponse.json({ error: 'Komentar tidak boleh kosong' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('deliverable_comments')
    .insert({
      deliverable_id: params.id,
      author_id: ctx.userId,
      content: content.trim(),
    })
    .select('id, content, created_at, author_name, author_role')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ comment: data })
}
