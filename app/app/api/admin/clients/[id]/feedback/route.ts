import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { ClientFeedback, CreateFeedbackPayload } from '@/features/feedback/api/types'

export const dynamic = 'force-dynamic'

async function createServerSupabaseClient() {
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

// Extract clientId from URL pathname: /api/admin/clients/:clientId/feedback
function extractClientId(url: string): string | null {
  const parts = new URL(url, 'http://localhost').pathname.split('/')
  // Expected structure: /api/admin/clients/:id/feedback
  if (parts.length >= 6 && parts[5]) return parts[5]
  return null
}

export async function GET(request: Request) {
  const clientId = extractClientId(request.url)
  if (!clientId) {
    return NextResponse.json({ error: 'clientId is required' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('client_feedback')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[GET feedback error]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ feedback: (data ?? []) as ClientFeedback[] })
}

export async function POST(request: Request) {
  const clientId = extractClientId(request.url)
  if (!clientId) {
    return NextResponse.json({ error: 'clientId is required' }, { status: 400 })
  }

  const body = await request.json()
  const { rating, title, comment, deliverable_id }: CreateFeedbackPayload = body

  if (!rating || !title) {
    return NextResponse.json({ error: 'rating and title are required' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('client_feedback')
    .insert({
      client_id: clientId,
      rating,
      title,
      comment,
      deliverable_id,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    console.error('[POST feedback error]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ feedback: (data ?? {}) as ClientFeedback }, { status: 201 })
}
