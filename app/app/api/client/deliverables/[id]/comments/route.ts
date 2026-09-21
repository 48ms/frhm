import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { denyUnauthorized } from '@/lib/auth/guard'

export const dynamic = 'force-dynamic'

/**
 * Add a comment to a deliverable.
 *
 * POST /api/client/deliverables/[id]/comments
 *   body: { content: string }
 *
 * The author is taken from the authenticated session — never from the request body —
 * so a client cannot spoof another user's comment (the underlying `deliverable_comments`
 * view writes through a SECURITY DEFINER trigger that trusts the supplied author_id).
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch { /* server component */ }
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return denyUnauthorized()

  const body = await request.json().catch(() => ({}))
  const content: string = body?.content ?? ''
  if (!content.trim()) {
    return NextResponse.json({ error: 'Komentar tidak boleh kosong' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('deliverable_comments')
    .insert({
      deliverable_id: (await params).id,
      author_id: user.id,
      content: content.trim(),
    })
    .select('id, content, created_at, author_name, author_role')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ comment: data })
}