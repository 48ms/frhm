import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { logAudit } from '@/lib/audit/log'
import { denyUnauthorized } from '@/lib/auth/guard'

export const dynamic = 'force-dynamic'

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cs) {
          try { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    }
  )
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return denyUnauthorized()

  const body = await req.json().catch(() => ({}))
  const { client_id, category, guidelines, file_path, file_type } = body

  // Guidelines update/insert
  if (category === 'guidelines') {
    const { data: existing } = await supabase
      .from('brand_assets')
      .select('id')
      .eq('client_id', client_id)
      .eq('category', 'guidelines')
      .maybeSingle()

    let res
    if (existing) {
      res = await supabase.from('brand_assets').update({ guidelines }).eq('id', existing.id).select().single()
    } else {
      res = await supabase.from('brand_assets').insert({ client_id, category, file_path: 'none', guidelines }).select().single()
    }

    if (res.error) return NextResponse.json({ error: res.error.message }, { status: 400 })

    void logAudit({
      action: 'brand_asset.guidelines_updated',
      actorId: user.id,
      entityType: 'brand_asset',
      entityId: res.data.id,
      clientId: client_id,
      summary: 'Memperbarui brand guidelines',
      request: req,
    })

    return NextResponse.json({ data: res.data })
  }

  // File upload registration (actual file upload to storage should happen from client to bypass Vercel 4.5MB limit,
  // but DB insert + audit is done here)
  if (category === 'file') {
    const { data, error } = await supabase.from('brand_assets').insert({
      client_id,
      category,
      file_path,
      file_type,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    void logAudit({
      action: 'brand_asset.uploaded',
      actorId: user.id,
      entityType: 'brand_asset',
      entityId: data.id,
      clientId: client_id,
      summary: `Mengunggah brand asset baru: ${file_path.split('/').pop()}`,
      request: req,
    })

    return NextResponse.json({ data })
  }

  return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return denyUnauthorized()

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { data: existing } = await supabase.from('brand_assets').select('file_path, client_id').eq('id', id).single()
  if (!existing) return NextResponse.json({ error: 'Asset tidak ditemukan' }, { status: 404 })

  if (existing.file_path !== 'none') {
    // Delete from storage
    const { error: storageError } = await supabase.storage.from('brand_assets').remove([existing.file_path])
    if (storageError) console.error('Failed to remove from storage:', storageError)
  }

  const { error } = await supabase.from('brand_assets').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  void logAudit({
    action: 'brand_asset.deleted',
    actorId: user.id,
    entityType: 'brand_asset',
    entityId: id,
    clientId: existing.client_id,
    summary: `Menghapus brand asset: ${existing.file_path.split('/').pop()}`,
    request: req,
  })

  return NextResponse.json({ success: true })
}
