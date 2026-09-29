import { TelegramConnectCard } from '@/components/telegram/telegram-connect-card'
import { TelegramClientsList } from '@/components/telegram/telegram-clients-list'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function TelegramSettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: adminUser } = user
    ? await supabase
        .from('users')
        .select('id, full_name, telegram_chat_id, telegram_username, telegram_notifications_enabled')
        .eq('id', user.id)
        .single()
    : { data: null }

  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, telegram_chat_id, telegram_username, telegram_notifications_enabled')
    .order('name')

  return (
    <div className="space-y-6 rounded-xl border bg-card p-6">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Akun Admin (Penerima Alert)</h2>
      </div>
      <div className="space-y-8">
        {adminUser ? (
          <TelegramConnectCard
            type="admin"
            id={adminUser.id}
            name={adminUser.full_name || 'Admin Frhm'}
            initialChatId={adminUser.telegram_chat_id}
            initialUsername={adminUser.telegram_username}
            initialEnabled={adminUser.telegram_notifications_enabled}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Admin tidak ditemukan.</p>
        )}

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Status Notifikasi Klien</h2>
          <div className="mt-4">
            <TelegramClientsList clients={clients ?? []} />
          </div>
        </div>
      </div>
    </div>
  )
}
