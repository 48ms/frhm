'use client'

import { useCallback, useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  CircleCheckIcon, CircleAlertIcon, CircleDashedIcon, LoaderIcon,
  RefreshCwIcon, TrashIcon, ExternalLinkIcon, KeyRoundIcon,
} from 'lucide-react'
import { motion } from "motion/react"

type Account = {
  id: string
  platform: string
  username: string
  status: string
}
type Project = { id: string; name: string }
type Status = {
  configured: boolean
  connected: boolean
  projects?: Project[]
  accounts?: Account[]
  mediaCount?: number | null
  hint?: string
  error?: string
  status?: number | null
}

export function BridgeConfig() {
  const [status, setStatus] = useState<Status | null>(null)
  const [loading, setLoading] = useState(true)
  const [key, setKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/bridge')
      const data = await r.json()
      setStatus(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function save(clear = false) {
    setSaving(true)
    setMsg(null)
    try {
      const r = await fetch('/api/admin/bridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: clear ? '' : key }),
      })
      const j = await r.json()
      if (!r.ok) {
        setMsg(`Gagal: ${j.error}`)
      } else {
        setMsg(clear ? 'API key dihapus.' : 'API key disimpan.')
        setKey('')
        await load()
      }
    } finally {
      setSaving(false)
    }
  }

  const s = status

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-800/50 rounded-3xl p-6 sm:p-8 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-semibold text-neutral-900 dark:text-neutral-50 mb-1">
              <KeyRoundIcon className="size-5 text-neutral-500" /> Bridge Publishing (WoopSocial)
            </h2>
            <p className="text-sm text-neutral-500 max-w-2xl">
              Tahap Publish mengirim post lewat bridge ini. Repo{' '}
              <code className="font-mono text-xs bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded">social-media-skills</code>{' '}
              mengarahkan semua skill publishing ke WoopSocial.
            </p>
          </div>
          {s && (
            <Badge variant="secondary" className="shrink-0 gap-1.5 h-7 px-3 text-xs font-medium rounded-full bg-neutral-100 dark:bg-neutral-800">
              {loading ? (
                <LoaderIcon className="size-3.5 animate-spin text-neutral-500" />
              ) : s.connected ? (
                <CircleCheckIcon className="size-3.5 text-green-500" />
              ) : s.configured ? (
                <CircleAlertIcon className="size-3.5 text-amber-500" />
              ) : (
                <CircleDashedIcon className="size-3.5 text-neutral-400" />
              )}
              {loading ? 'memeriksa' : s.connected ? 'terhubung' : s.configured ? 'gagal' : 'belum diatur'}
            </Badge>
          )}
        </div>

        <div className="space-y-6">
          {s && !s.connected && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm text-amber-800 dark:text-amber-200"
            >
              <strong>{s.error}</strong>
              {', '}
              {s.hint ??
                'Isi API key untuk mengaktifkan publish. Tanpa ini, skill publishing tetap jalan tapi berhenti di langkah koneksi dan memberi tabel jadwal manual.'}
            </motion.div>
          )}

          {s?.connected && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 bg-neutral-50/50 dark:bg-neutral-900/50 p-4">
                  <p className="text-neutral-500 text-xs font-medium uppercase tracking-wider mb-1.5">Project</p>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                    {s.projects?.length ? s.projects.map((p) => p.name).join(', ') : 'Kosong'}
                  </p>
                </div>
                <div className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 bg-neutral-50/50 dark:bg-neutral-900/50 p-4">
                  <p className="text-neutral-500 text-xs font-medium uppercase tracking-wider mb-1.5">Akun terhubung</p>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                    {s.accounts?.length ? `${s.accounts.length} akun` : 'belum ada'}
                  </p>
                </div>
                <div className="rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 bg-neutral-50/50 dark:bg-neutral-900/50 p-4">
                  <p className="text-neutral-500 text-xs font-medium uppercase tracking-wider mb-1.5">Media library</p>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-50">
                    {s.mediaCount == null ? '0' : `${s.mediaCount} item`}
                  </p>
                </div>
              </div>

              {s.mediaCount === 0 && (s.accounts?.length ?? 0) > 0 && (
                <p className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm text-amber-800 dark:text-amber-200">
                  <strong>Media library masih kosong.</strong> Instagram menolak post tanpa
                  minimal satu media item. Unggah media lewat bridge sebelum menjadwalkan post
                  Instagram.
                </p>
              )}

              {s.accounts?.length ? (
                <div className="space-y-2 pt-2">
                  <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-50 mb-3">Daftar Akun:</h3>
                  {s.accounts.map((a) => (
                    <div key={a.id} className="flex items-center gap-3 rounded-xl border border-neutral-200/50 dark:border-neutral-800/50 bg-white/50 dark:bg-neutral-900/50 p-3 sm:p-4 text-sm shadow-sm transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                      <CircleCheckIcon className="size-5 shrink-0 text-green-500" />
                      <span className="font-medium text-neutral-900 dark:text-neutral-50">{a.platform}</span>
                      <code className="text-neutral-500 text-xs bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">@{a.username}</code>
                      <span className="text-neutral-400 ml-auto text-xs hidden sm:inline-block">{a.status}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-500 rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50 bg-neutral-50/50 dark:bg-neutral-900/50 p-4 text-sm">
                  Belum ada akun sosial terhubung. Buka dashboard WoopSocial → Connect Accounts,
                  lalu hubungkan akun client.
                </p>
              )}
            </motion.div>
          )}

          <div className="space-y-3 pt-6 border-t border-neutral-200/50 dark:border-neutral-800/50">
            <Label htmlFor="bridge-key" className="text-sm font-medium">
              {s?.configured ? 'Ganti API key' : 'API key WoopSocial'}
            </Label>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                id="bridge-key"
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder={s?.configured ? '•••••••••••• (tersimpan)' : 'tempel API key di sini'}
                autoComplete="off"
                className="h-11 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all bg-neutral-50/50 dark:bg-neutral-900/50 font-mono flex-1"
              />
              <div className="flex gap-2">
                <Button onClick={() => save(false)} disabled={saving || !key.trim()} className="h-11 rounded-xl bg-neutral-900 dark:bg-neutral-50 text-white dark:text-neutral-900 w-full sm:w-auto">
                  {saving ? <LoaderIcon className="size-4 animate-spin mr-2" /> : null} Simpan
                </Button>
                {s?.configured && (
                  <Button variant="outline" onClick={() => save(true)} disabled={saving} className="h-11 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 border-red-200 dark:border-red-500/20 w-full sm:w-auto">
                    <TrashIcon className="size-4 mr-2" /> Hapus
                  </Button>
                )}
              </div>
            </div>
            <p className="text-neutral-500 text-xs pt-1">
              Key disimpan di server dan tidak pernah ditampilkan kembali. Buat di{' '}
              <a
                href="https://app.woopsocial.com/api-access"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-0.5 text-primary hover:underline font-medium"
              >
                app.woopsocial.com/api-access <ExternalLinkIcon className="size-3" />
              </a>
              . Akses API ada di paket berbayar.
            </p>
          </div>

          {msg && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`text-sm font-medium p-3 rounded-lg ${msg?.startsWith('Gagal') ? 'bg-red-500/10 text-red-600 dark:text-red-400' : 'bg-green-500/10 text-green-600 dark:text-green-400'}`}
            >
              {msg}
            </motion.p>
          )}

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={load} disabled={loading} className="h-11 rounded-xl">
              <RefreshCwIcon className={`size-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Cek koneksi ulang
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}