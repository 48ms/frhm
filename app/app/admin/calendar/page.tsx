import { createClient } from '@/lib/supabase/server'
import { AdminCalendarClient } from './calendar-client'

export const dynamic = 'force-dynamic'

export default async function AdminCalendarPage() {
  const supabase = await createClient()

  const { data: clients } = await supabase
    .from('clients')
    .select('id, name')
    .order('name')

  const { data: posts } = await supabase
    .from('scheduled_posts')
    .select('*, deliverables(title, type, status)')
    .order('scheduled_at', { ascending: true })

  return (
    <div className="space-y-6">
      <AdminCalendarClient
        clients={clients ?? []}
        initialPosts={posts ?? []}
      />
    </div>
  )
}
