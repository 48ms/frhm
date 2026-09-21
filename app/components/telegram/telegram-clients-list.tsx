'use client'

import { motion } from 'motion/react'

export interface TelegramClient {
  id: string
  name: string
  telegram_chat_id: string | null
  telegram_username: string | null
  telegram_notifications_enabled: boolean | null
}

// Client component only because motion needs the browser. The data is fetched
// server-side and passed in as plain props.
export function TelegramClientsList({ clients }: { clients: TelegramClient[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.1 }}
      className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-800/50 rounded-3xl p-6 sm:p-8 shadow-sm"
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-1">Daftar Brand Klien</h3>
        <p className="text-sm text-neutral-500">
          Status penautan bot Telegram untuk setiap klien aktif.
        </p>
      </div>

      {clients.length === 0 ? (
        <p className="text-sm text-neutral-500 py-6 text-center">Belum ada klien terdaftar.</p>
      ) : (
        <div className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 bg-neutral-50/50 dark:bg-neutral-900/50 overflow-hidden divide-y divide-neutral-200/50 dark:divide-neutral-800/50">
          {clients.map((c) => (
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
      )}
    </motion.div>
  )
}
