import Link from 'next/link'
import { ArrowLeftIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { TelegramConnectCard } from '@/components/telegram/telegram-connect-card'
import * as motion from "framer-motion/client"

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
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
            className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-800/50 rounded-3xl p-6 sm:p-8 shadow-sm"
          >
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-1">Daftar Brand Klien</h3>
              <p className="text-sm text-neutral-500">
                Status penautan bot Telegram untuk setiap klien aktif (Taraju, Pawon Sengon, dll).
              </p>
            </div>
            
            <div className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 bg-neutral-50/50 dark:bg-neutral-900/50 overflow-hidden divide-y divide-neutral-200/50 dark:divide-neutral-800/50">
              {(clients ?? []).map((c) => (
                <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 gap-3 transition-colors hover:bg-white/50 dark:hover:bg-neutral-800/50">
                  <div>
                    <span className="font-medium text-neutral-900 dark:text-neutral-50">{c.name}</span>
                    <div className="text-sm text-neutral-500 mt-1">
                      {c.telegram_chat_id ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          Terhubung ({c.telegram_username ? `@${c.telegram_username}` : c.telegram_chat_id})
                        </span>
                      ) : (
                        <span>Belum menghubungkan Telegram</span>
                      )}
                    </div>
                  </div>

                  <div>
                    {c.telegram_chat_id ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border border-neutral-200 dark:border-neutral-700">
                        Nonaktif
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
