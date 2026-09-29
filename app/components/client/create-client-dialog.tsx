'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Icons } from '@/components/icons'
import { NICHE_OPTIONS, type NicheId } from '@/lib/onboarding/niche-packs'

export { NICHE_OPTIONS }
export type { NicheId }

interface CreateClientWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (client: { id: string; name: string }) => void
}

export function CreateClientWizard({ open, onOpenChange, onCreated }: CreateClientWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string
    password: string
    clientId: string
    clientName: string
    seededSkills: number
  } | null>(null)

  const [form, setForm] = useState({
    name: '',
    niche: '' as NicheId | '',
    contact_email: '',
    contact_phone: '',
    telegram_chat_id: '',
  })

  const updateField = (key: string, value: string) =>
    setForm(f => ({ ...f, [key]: value }))

  const handleNextStep = () => {
    setErr(null)
    if (!form.name.trim()) { setErr('Nama brand wajib diisi'); return }
    if (!form.niche) { setErr('Pilih niche/industri terlebih dahulu'); return }
    setStep(2)
  }

  const handleSubmit = async () => {
    setErr(null)
    setSaving(true)
    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          niche: form.niche as NicheId,
          contact_email: form.contact_email.trim() || null,
          contact_phone: form.contact_phone.trim() || null,
          telegram_chat_id: form.telegram_chat_id.trim() || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal membuat client')

      setCreatedCredentials({
        email: json.credentials?.email ?? '',
        password: json.credentials?.password ?? '',
        clientId: json.data.id,
        clientName: form.name,
        seededSkills: json.seededSkillCount ?? 0,
      })

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('client:created', { detail: json.data }))
      }
      if (onCreated && json.data) {
        onCreated({ id: json.data.id, name: json.data.name })
      }
      router.refresh()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    setStep(1)
    setShowAdvanced(false)
    setCreatedCredentials(null)
    onOpenChange(false)
  }

  const handleStartInterview = () => {
    const cid = createdCredentials?.clientId
    if (!cid) return
    handleClose()
    router.push(`/admin/clients/${cid}?interview=brand-profile`)
  }

  return (
    <>
      <Dialog open={open && !createdCredentials} onOpenChange={handleClose}>
        <DialogContent className="max-w-md overflow-hidden p-0 gap-0">
          {/* Header Progress Bar */}
          <div className="bg-muted/40 border-b p-6 pb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Icons.sparkles className="size-3.5 text-brand-accent" />
                Tambah Client Baru
              </span>
              <span className="text-xs font-medium bg-brand-accent/10 text-brand-accent px-2 py-0.5 rounded-full">
                Langkah {step} dari 2
              </span>
            </div>
            
            {/* Stepper Indicator */}
            <div className="grid grid-cols-2 gap-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="bg-brand-accent transition-all duration-300" />
              <div className={`transition-all duration-300 ${step === 2 ? 'bg-brand-accent' : 'bg-transparent'}`} />
            </div>
          </div>

          <div className="p-6 space-y-4">
            {step === 1 ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="font-semibold text-base">Identitas Brand Utama</h3>
                  <p className="text-xs text-muted-foreground">
                    Masukkan nama brand dan niche untuk menyiapkan workspace AI.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="c-name" className="text-xs font-semibold">
                    Nama Brand <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="c-name"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Contoh: Pawon Sengon"
                    className="h-10 rounded-lg text-sm"
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="c-niche" className="text-xs font-semibold">
                    Niche / Industri <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="c-niche"
                    value={form.niche}
                    onChange={(e) => updateField('niche', e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm"
                  >
                    <option value="">-- Pilih Niche --</option>
                    {NICHE_OPTIONS.map((n) => (
                      <option key={n.id} value={n.id}>{n.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="font-semibold text-base">Detail Kontak & Akses Client</h3>
                  <p className="text-xs text-muted-foreground">
                    Opsional. Dapatkan akses login portal klien dan notifikasi Telegram.
                  </p>
                </div>

                <div className="rounded-xl border bg-muted/20 p-3 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="c-email" className="text-xs text-muted-foreground">Email Login Portal</Label>
                      <Input
                        id="c-email"
                        type="email"
                        value={form.contact_email}
                        onChange={(e) => updateField('contact_email', e.target.value)}
                        placeholder="owner@brand.id"
                        className="h-9 rounded-lg text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="c-phone" className="text-xs text-muted-foreground">No. WhatsApp</Label>
                      <Input
                        id="c-phone"
                        value={form.contact_phone}
                        onChange={(e) => updateField('contact_phone', e.target.value)}
                        placeholder="08xxxxxxxxxx"
                        className="h-9 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  {!showAdvanced ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground hover:text-foreground p-0 h-auto"
                      onClick={() => setShowAdvanced(true)}
                    >
                      + Tambah Telegram Chat ID (Opsional)
                    </Button>
                  ) : (
                    <div className="space-y-1.5 pt-1">
                      <Label htmlFor="c-telegram" className="text-xs text-muted-foreground">Telegram Chat ID</Label>
                      <Input
                        id="c-telegram"
                        value={form.telegram_chat_id}
                        onChange={(e) => updateField('telegram_chat_id', e.target.value)}
                        placeholder="Contoh: 123456789"
                        className="h-9 rounded-lg text-xs"
                      />
                    </div>
                  )}
                </div>

                <div className="rounded-lg bg-brand-accent/5 border border-brand-accent/20 p-3 text-xs flex gap-2.5 items-start">
                  <Icons.sparkles className="size-4 text-brand-accent shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-foreground">Satu Langkah Lagi!</span>
                    Setelah ini Anda akan langsung dipandu oleh AI untuk wawancara pembentukan brand profile.
                  </div>
                </div>
              </div>
            )}

            {err && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive flex items-center gap-2">
                <Icons.alertCircle className="size-4 shrink-0" />
                {err}
              </div>
            )}
          </div>

          <div className="bg-muted/30 border-t p-4 flex justify-between items-center">
            {step === 1 ? (
              <>
                <Button variant="ghost" size="sm" onClick={handleClose}>
                  Batal
                </Button>
                <Button size="sm" className="bg-brand-accent hover:bg-brand-accent/90" onClick={handleNextStep}>
                  Lanjut ke Kontak <Icons.arrowRight className="size-3.5 ml-1.5" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => setStep(1)} disabled={saving}>
                  <Icons.arrowLeft className="size-3.5 mr-1.5" /> Kembali
                </Button>
                <Button size="sm" className="bg-brand-accent hover:bg-brand-accent/90" onClick={handleSubmit} disabled={saving}>
                  {saving ? (
                    <><Icons.spinner className="size-4 mr-2 animate-spin" /> Mendaftarkan...</>
                  ) : (
                    <><Icons.userPlus className="size-4 mr-1.5" /> Siapkan Workspace Client</>
                  )}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Launchpad Dialog */}
      <Dialog open={createdCredentials !== null} onOpenChange={(o) => { if (!o) handleClose() }}>
        <DialogContent className="max-w-md p-6">
          <div className="text-center space-y-3">
            <div className="size-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto">
              <Icons.check className="size-6 stroke-[3]" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Workspace Client Siap!</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Klien <strong className="text-foreground">{createdCredentials?.clientName}</strong> berhasil didaftarkan.
              </p>
            </div>
          </div>

          <div className="my-4 rounded-xl border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Skill Tersedia:</span>
              <span className="font-semibold text-brand-accent">{createdCredentials?.seededSkills} Skill Siap</span>
            </div>
            {createdCredentials?.email && (
              <div className="pt-2 border-t space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email Portal:</span>
                  <span className="font-mono">{createdCredentials.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Password:</span>
                  <span className="font-mono">{createdCredentials.password}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Button
              className="w-full h-11 bg-brand-accent hover:bg-brand-accent/90 text-sm font-semibold shadow-md"
              onClick={handleStartInterview}
            >
              <Icons.sparkles className="size-4 mr-2" />
              Mulai Interview Brand Profile (Rekomendasi)
            </Button>
            <Button variant="ghost" className="w-full h-9 text-xs text-muted-foreground" onClick={handleClose}>
              Lanjut ke Dashboard Dulu
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
