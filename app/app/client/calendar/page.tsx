import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ClientCalendarClient } from './calendar-client'

export const dynamic = 'force-dynamic'

export default async function ClientCalendarPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/client/calendar')

  const { data: profile } = await supabase
    .from('users')
    .select('role, client_id, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'client') redirect('/admin/dashboard')

  const clientId = profile.client_id
  if (!clientId) redirect('/client/dashboard')

  const { data: clientRow } = await supabase
    .from('clients')
    .select('name')
    .eq('id', clientId)
    .single()

  const { data: posts } = await supabase
    .from('scheduled_posts')
    .select('*, deliverables(title, type, status)')
    .eq('client_id', clientId)
    .order('scheduled_at', { ascending: true })

  return (
    <ClientCalendarClient
      clientName={clientRow?.name ?? 'Client'}
      fullName={profile.full_name ?? ''}
      posts={posts ?? []}
    />
  )
}