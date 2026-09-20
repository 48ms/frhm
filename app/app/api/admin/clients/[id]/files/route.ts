import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, isResponse } from '@/lib/ai/server'
import { logAudit } from '@/lib/audit/log'

export const dynamic = 'force-dynamic'

/** List the files in a client's folder. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireAdmin()
  if (isResponse(ctx)) return ctx
  const { id } = await params

  const { data, error } = await ctx.supabase
    .from('client_files')
    .select('path, content, updated_at')
    .eq('client_id', id)
    .order('path')
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ files: data ?? [] })
}

/** Write (create or overwrite) one file in a client's folder. */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireAdmin()
  if (isResponse(ctx)) return ctx
  const { id } = await params

  const body = await request.json().catch(() => ({}))
  const path: string | undefined = body?.path
  const content: string | undefined = body?.content
  if (!path || typeof content !== 'string') {
    return NextResponse.json({ error: 'path dan content wajib' }, { status: 400 })
  }
  // keep paths inside the client folder
  if (path.includes('..') || path.startsWith('/')) {
    return NextResponse.json({ error: 'path tidak valid' }, { status: 400 })
  }

  const { data, error } = await ctx.supabase
    .from('client_files')
    .upsert(
      { client_id: id, path, content, updated_at: new Date().toISOString() },
      { onConflict: 'client_id,path' }
    )
    .select('path, updated_at')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await logAudit({
    actorId: ctx.userId,
    actorRole: 'admin',
    action: 'client.file.write',
    entityType: 'client',
    entityId: id,
    clientId: id,
    summary: `Admin menulis file client "${path}"`,
    metadata: { path, content_length: content.length },
  })

  return NextResponse.json({ success: true, file: data })
}

/** Delete one file. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireAdmin()
  if (isResponse(ctx)) return ctx
  const { id } = await params

  const path = new URL(request.url).searchParams.get('path')
  if (!path) return NextResponse.json({ error: 'path wajib' }, { status: 400 })

  const { error } = await ctx.supabase
    .from('client_files')
    .delete()
    .eq('client_id', id)
    .eq('path', path)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
