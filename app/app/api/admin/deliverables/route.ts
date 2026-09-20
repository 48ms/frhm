import { NextResponse } from 'next/server'
import { requireAdmin, isResponse } from '@/lib/ai/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const ctx = await requireAdmin()
  if (isResponse(ctx)) return ctx
  const { supabase } = ctx

  const { title, content, client_id, type } = await req.json()

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Judul wajib diisi' }, { status: 400 })
  }
  if (!client_id) {
    return NextResponse.json({ error: 'client_id wajib diisi' }, { status: 400 })
  }
  const validType = ['brief', 'content', 'report'].includes(type) ? type : 'content'

  const { data, error } = await supabase
    .from('deliverables')
    .insert({
      client_id,
      type: validType,
      title: title.trim(),
      content_md: content || null,
      status: 'draft',
      created_by: ctx.userId,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ deliverable: data })
}
