'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  UserIcon,
  MailIcon,
  Building2Icon,
  KeyRoundIcon,
  Trash2Icon,
  BotIcon,
  CheckCircle2Icon,
  Loader2Icon,
} from 'lucide-react'

type ClientInfo = { id: string; name: string; telegram_notifications_enabled: boolean | null } | null

export default function SettingsClient({
  initialProfile,
  initialClient,
}: {
  initialProfile: { email: string; full_name: string | null; client_id: string | null }
  initialClient: ClientInfo
}) {
  const router = useRouter()
  const supabase = createClient()
  const [isPending, startTransition] = useTransition()

  // Profile state
  const [name, setName] = useState(initialProfile.full_name ?? '')
  const [nameSaved, setNameSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  // Password state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSaving, setPwSaving] = useState(false)

  // Telegram state
  const [client, setClient] = useState<ClientInfo>(initialClient)
  const [telegramLoading, setTelegramLoading] = useState(false)
  const telegramEnabled = client?.telegram_notifications_enabled ?? false

  // Delete state
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)

  const handleNameUpdate = async () => {
    if (!name.trim()) return
    setSaving(true)
    // Update auth metadata (self-scoped, secure)
    const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } })
    setSaving(false)
    if (error) return toast.error('Gagal: ' + error.message)
    setNameSaved(true)
    setTimeout(() => setNameSaved(false), 2000)
  }

  async function handlePasswordChange() {
    setPwError('')
    if (newPassword.length < 6) { setPwError('Password minimal 6 karakter'); return }
    if (newPassword !== confirmPassword) { setPwError('Konfirmasi tidak cocok'); return }
    setPwSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPwSaving(false)
    if (error) { setPwError(error.message); return }
    setNewPassword('')
    setConfirmPassword('')
    toast.success('Password berhasil diubah. Silakan login ulang.')
    router.push('/auth/login')
  }

  async function handleTelegramToggle() {
    if (!client?.id) return
    setTelegramLoading(true)
    const newEnabled = !telegramEnabled
    // Optimistic update (will be reverted on failure below)
    setClient((prev) => prev ? { ...prev, telegram_notifications_enabled: newEnabled } : prev)
    try {
      const res = await fetch('/api/telegram/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newEnabled, type: 'client', id: client.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal mengupdate preferensi Telegram')
    } catch (err) {
      // Revert optimistic update
      setClient((prev) => prev ? { ...prev, telegram_notifications_enabled: !newEnabled } : prev)
      toast.error('Gagal: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setTelegramLoading(false)
    }
  }

  async function handleDelete() {
    if (deleteConfirm !== 'HAPUS AKUN') return
    setDeleting(true)
    // Call GDPR delete endpoint which properly anonymises PII
    try {
      const res = await fetch('/api/client/me', { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || 'Failed to delete account')
      }
      await supabase.auth.signOut()
      router.push('/auth/login')
    } catch (err) {
      toast.error('Gagal: ' + (err instanceof Error ? err.message : String(err)))
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan Akun</h1>
        <p className="text-sm text-muted-foreground">Kelola profil, keamanan, dan notifikasi.</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="size-4" /> Profil
          </CardTitle>
          <CardDescription>Informasi akun Anda</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Email</Label>
            <div className="flex items-center gap-2 rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              <MailIcon className="size-4 shrink-0" />
              {initialProfile.email}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <div className="flex gap-2">
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lengkap" className="max-w-sm" />
              <Button onClick={handleNameUpdate} disabled={saving || isPending} size="sm">
                {saving ? <Loader2Icon className="size-4 animate-spin" /> : nameSaved ? <CheckCircle2Icon className="size-4 text-green-600" /> : 'Simpan'}
              </Button>
            </div>
            {nameSaved && <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2Icon className="size-3" /> Tersimpan</p>}
          </div>
          {client && (
            <div className="flex flex-col gap-2">
              <Label>Client</Label>
              <div className="flex items-center gap-2 rounded-md border border-input bg-muted/50 px-3 py-2 text-sm">
                <Building2Icon className="size-4 shrink-0" />
                {client.name}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRoundIcon className="size-4" /> Keamanan
          </CardTitle>
          <CardDescription>Ganti password akun Anda</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="pw-new">Password Baru</Label>
            <Input id="pw-new" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimal 6 karakter" className="max-w-sm" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="pw-confirm">Konfirmasi Password</Label>
            <Input id="pw-confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Ulangi password baru" className="max-w-sm" />
          </div>
          {pwError && <p className="text-sm text-destructive">{pwError}</p>}
          <Button onClick={handlePasswordChange} disabled={pwSaving} variant="outline" size="sm" className="self-start">
            {pwSaving ? <Loader2Icon className="size-4 animate-spin" /> : 'Ubah Password'}
          </Button>
        </CardContent>
      </Card>

      {/* Telegram */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BotIcon className="size-4" /> Notifikasi Telegram
          </CardTitle>
          <CardDescription>Terima notifikasi deliverable melalui Telegram</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm">Aktifkan notifikasi</span>
              <Badge variant={telegramEnabled ? 'default' : 'secondary'}>
                {telegramEnabled ? 'Aktif' : 'Nonaktif'}
              </Badge>
            </div>
            <Button onClick={handleTelegramToggle} disabled={telegramLoading || !client?.id} variant={telegramEnabled ? 'outline' : 'default'} size="sm">
              {telegramLoading ? <Loader2Icon className="size-4 animate-spin" /> : telegramEnabled ? 'Matikan' : 'Nyalakan'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2Icon className="size-4" /> Hapus Akun
          </CardTitle>
          <CardDescription>Tindakan ini tidak dapat dibatalkan.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Input placeholder='Ketik "HAPUS AKUN" untuk konfirmasi' value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} className="max-w-xs text-sm" />
          <Button onClick={handleDelete} disabled={deleteConfirm !== 'HAPUS AKUN' || deleting} variant="destructive" size="sm" className="self-start">
            {deleting ? <Loader2Icon className="size-4 animate-spin" /> : 'Hapus Akun'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
