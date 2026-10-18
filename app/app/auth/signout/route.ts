import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getRequestOrigin } from '@/lib/request-origin'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const origin = getRequestOrigin(request)
  const url = new URL('/auth/login', origin)
  return NextResponse.redirect(url)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const origin = getRequestOrigin(request)
  const url = new URL('/auth/login', origin)
  return NextResponse.redirect(url)
}
