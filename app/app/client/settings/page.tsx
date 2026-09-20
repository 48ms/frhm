import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SettingsClient from './client'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?redirect=/client/settings')

  const { data: profile } = await supabase
    .from('users')
    .select('id, email, full_name, client_id, role, telegram_notifications_enabled')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'admin') redirect('/admin/dashboard')

  let client = null
  if (profile?.client_id) {
    const { data } = await supabase
      .from('clients')
      .select('id, name, telegram_notifications_enabled')
      .eq('id', profile.client_id)
      .single()
    client = data
  }

  return (
    <SettingsClient
      initialProfile={{ email: user.email ?? '', full_name: profile?.full_name ?? null, client_id: profile?.client_id ?? null }}
      initialClient={client}
    />
  )
}
