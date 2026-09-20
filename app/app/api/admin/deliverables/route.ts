import { NextResponse } from 'next/server'
import { requireAdmin, isResponse } from '@/lib/ai/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const ctx = await requireAdmin()
  if (isResponse(ctx)) return ctx
  const { supabase } = ctx

  const { title, description, content } = await req.json()

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Judul wajib diisi' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('deliverables')
    .insert({
      title: title.trim(),
      description: description || null,
      content: content || null,
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
