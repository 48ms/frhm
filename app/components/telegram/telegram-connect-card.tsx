'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SendIcon, CheckCircle2Icon, ExternalLinkIcon, RefreshCwIcon, BellIcon, BellOffIcon, ShieldCheckIcon } from 'lucide-react'
import { motion } from 'framer-motion'

interface TelegramConnectCardProps {
  type: 'client' | 'admin'
  id: string
  name: string
  initialChatId?: string | null
  initialUsername?: string | null
  initialEnabled?: boolean
  onStatusChange?: (connected: boolean) => void
}

export function TelegramConnectCard({
  type,
  id,
  name,
  initialChatId,
  initialUsername,
  initialEnabled = true,
  onStatusChange,
}: TelegramConnectCardProps) {
  const [chatId, setChatId] = useState<string | null>(initialChatId ?? null)
  const [username, setUsername] = useState<string | null>(initialUsername ?? null)
  const [enabled, setEnabled] = useState<boolean>(initialEnabled)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testSuccess, setTestSuccess] = useState<string | null>(null)
  const [testError, setTestError] = useState<string | null>(null)

  const botUsername = (process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'FrhmBot').replace(/^@/, '')
  const deepLink = `https://t.me/${botUsername}?start=${type}_${id}`

  const isConnected = Boolean(chatId)

  // 3-state status
  const connectionStatus = isConnected
    ? (enabled ? 'connected' : 'paused')
    : 'disconnected'

  async function handleTestNotification() {
    setIsTesting(true)
    setTestSuccess(null)
    setTestError(null)

    try {
      const res = await fetch('/api/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setTestSuccess('Pesan uji coba berhasil terkirim ke Telegram Anda.')
      } else {
        setTestError(data.error || 'Gagal mengirim pesan uji coba.')
      }
    } catch {
      setTestError('Terjadi kendala jaringan saat mengirim pesan uji coba.')
    } finally {
      setIsTesting(false)
    }
  }

  async function handleDisconnect() {
    if (!confirm('Apakah Anda yakin ingin memutuskan koneksi notifikasi Telegram?')) {
      return
    }

    setIsDisconnecting(true)
    try {
      const res = await fetch('/api/telegram/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id }),
      })

      if (res.ok) {
        setChatId(null)
        setUsername(null)
        setEnabled(false)
        onStatusChange?.(false)
      }
    } catch {
      // keep current state
    } finally {
      setIsDisconnecting(false)
    }
  }

  async function handleToggleEnabled() {
    setIsToggling(true)
    const newEnabled = !enabled
    // Optimistic update
    setEnabled(newEnabled)

    try {
      const res = await fetch('/api/telegram/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id, enabled: newEnabled }),
      })

      const data = await res.json()
      if (!res.ok || !data.ok) {
        // Rollback on failure
        setEnabled(enabled)
        throw new Error(data.error || 'Gagal mengubah preferensi notifikasi')
      }
    } catch (err) {
      setTestError(err instanceof Error ? err.message : 'Gagal mengubah preferensi notifikasi')
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-800/50 rounded-3xl p-6 shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/20">
            <SendIcon className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-1">Notifikasi Telegram</h3>
            <p className="text-sm text-neutral-500">
              {type === 'client'
                ? 'Terima pemberitahuan langsung saat materi konten siap direview.'
                : 'Terima peringatan instan saat klien memberi approval atau revisi.'}
            </p>
          </div>
        </div>
        <div>
          {connectionStatus === 'connected' ? (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1.5 h-7 px-3 rounded-full text-xs font-medium">
              <CheckCircle2Icon className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Terhubung</span>
            </Badge>
          ) : connectionStatus === 'paused' ? (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 gap-1.5 h-7 px-3 rounded-full text-xs font-medium">
              <BellOffIcon className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Dijeda</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border-neutral-200 dark:border-neutral-700 h-7 px-3 rounded-full text-xs font-medium">
              Belum Terhubung
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {isConnected ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 bg-neutral-50/50 dark:bg-neutral-900/50 p-4 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
              <div className="space-y-1.5">
                <div className="text-neutral-500 text-xs font-medium uppercase tracking-wider">Penerima Notifikasi</div>
                <div className="font-medium text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
                  <ShieldCheckIcon className="h-4 w-4 text-blue-500" aria-hidden="true" />
                  <span>{username ? `@${username}` : `Chat ID: ${chatId}`}</span>
                  <span className="text-xs text-neutral-500 font-normal">({name})</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {type === 'admin' && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isTesting || isToggling}
                    onClick={handleTestNotification}
                    className="h-9 rounded-xl text-xs px-3"
                  >
                    <RefreshCwIcon className={`h-3.5 w-3.5 mr-1.5 ${isTesting ? 'animate-spin' : ''}`} aria-hidden="true" />
                    Uji Notifikasi
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isToggling}
                  onClick={handleToggleEnabled}
                  className="h-9 rounded-xl text-xs px-3"
                >
                  {enabled ? (
                    <>
                      <BellOffIcon className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                      Jeda
                    </>
                  ) : (
                    <>
                      <BellIcon className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                      Aktifkan
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isDisconnecting}
                  onClick={handleDisconnect}
                  className="h-9 rounded-xl text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 px-3"
                >
                  Putuskan
                </Button>
              </div>
            </div>

            {testSuccess && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20"
              >
                {testSuccess}
              </motion.div>
            )}
            {testError && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/20"
              >
                {testError}
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 p-5 space-y-4"
          >
            <div className="text-sm text-neutral-500 leading-relaxed max-w-2xl">
              Hubungkan akun Telegram dengan sekali klik. Saat tim Frhm menyelesaikan materi, notifikasi akan langsung terkirim ke Telegram Anda tanpa perlu sering mengecek dashboard.
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={deepLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-5 gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <SendIcon className="h-4 w-4" aria-hidden="true" />
                Hubungkan Telegram
                <ExternalLinkIcon className="h-3.5 w-3.5 opacity-80" aria-hidden="true" />
              </a>

              <span className="text-xs text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1.5 rounded-lg">
                Membuka tautan bot <b className="font-medium text-neutral-900 dark:text-neutral-50">@{botUsername}</b>
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}