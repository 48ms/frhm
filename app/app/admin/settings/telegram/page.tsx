import Link from 'next/link'
import { ArrowLeftIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { TelegramConnectCard } from '@/components/telegram/telegram-connect-card'
import { TelegramClientsList } from '@/components/telegram/telegram-clients-list'

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
    <div className="mx-auto max-w-4xl space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/dashboard"
          className="hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors inline-flex size-11 items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Kembali ke Dashboard"
        >
          <ArrowLeftIcon className="size-5 text-neutral-600 dark:text-neutral-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">Integrasi Telegram Notifikasi</h1>
          <p className="text-neutral-500 text-sm mt-1">
            Kelola saluran notifikasi otomatis untuk Admin dan Brand Klien Frhm.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-4">
            Akun Admin (Penerima Alert)
          </h2>
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
            <p className="text-sm text-neutral-500">Admin tidak ditemukan.</p>
          )}
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-4">
            Status Notifikasi Klien
          </h2>
          <TelegramClientsList clients={clients ?? []} />
        </div>
      </div>
    </div>
  )
}
