import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const url = new URL('/auth/login', request.url)
  return NextResponse.redirect(url)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const url = new URL('/auth/login', request.url)
  return NextResponse.redirect(url)
}
