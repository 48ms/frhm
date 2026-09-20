'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2Icon, Sparkles, Building2Icon, Loader2 } from 'lucide-react'
import { NICHE_OPTIONS, type NicheId } from '@/lib/onboarding/niche-packs'

export { NICHE_OPTIONS }
export type { NicheId }

export interface CreateClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (client: { id: string; name: string }) => void
}

export function CreateClientDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateClientDialogProps) {
  const router = useRouter()

  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string
    password: string
    clientName: string
    brandProfileGenerated?: boolean
  } | null>(null)

  const [form, setForm] = useState({
    name: '',
    niche: 'fnb' as string,
    target_audience: '',
    products: '',
    usp: '',
    contact_email: '',
    contact_phone: '',
  })

  const resetForm = () => {
    setForm({
      name: '',
      niche: 'fnb',
      target_audience: '',
      products: '',
      usp: '',
      contact_email: '',
      contact_phone: '',
    })
    setErr(null)
  }

  const handleCreate = async () => {
    setErr(null)
    if (!form.name.trim()) {
      setErr('Nama client wajib diisi')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal membuat client')

      if (json.credentials) {
        setCreatedCredentials({
          email: json.credentials.email,
          password: json.credentials.password,
          clientName: form.name,
          brandProfileGenerated: json.brandProfileGenerated,
        })
      } else {
        onOpenChange(false)
      }

      resetForm()
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

  const handleCredentialsClose = () => {
    setCreatedCredentials(null)
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open && !createdCredentials} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2Icon className="size-5 text-brand-accent" /> Client Baru & Onboarding
            </DialogTitle>
            <DialogDescription>
              Tambah client baru dan otomatis generate brand profile strategi AI.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Dasar */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="c-name" className="text-xs font-semibold">
                  Nama Brand / Client <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="c-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Contoh: Pawon Sengon"
                  className="h-10 rounded-lg text-sm"
                  disabled={saving}
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="c-niche" className="text-xs font-semibold">
                  Niche / Kategori Industri
                </Label>
                <select
                  id="c-niche"
                  value={form.niche}
                  onChange={(e) => setForm({ ...form, niche: e.target.value })}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                  disabled={saving}
                >
                  {NICHE_OPTIONS.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Smart Marketing Fields */}
            <div className="rounded-xl border bg-muted/20 p-3.5 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-accent">
                <Sparkles className="size-3.5" />
                Fondasi Strategi AI (Otomatisasi Skill)
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="c-target" className="text-xs text-muted-foreground font-medium">
                  Target Audiens Utama
                </Label>
                <Input
                  id="c-target"
                  value={form.target_audience}
                  onChange={(e) => setForm({ ...form, target_audience: e.target.value })}
                  placeholder="Misal: Ibu rumah tangga & keluarga muda kelas menengah"
                  className="h-9 rounded-lg text-xs"
                  disabled={saving}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="c-products" className="text-xs text-muted-foreground font-medium">
                  Produk / Layanan Utama
                </Label>
                <Input
                  id="c-products"
                  value={form.products}
                  onChange={(e) => setForm({ ...form, products: e.target.value })}
                  placeholder="Misal: Nasi Liwet Gurih, Ayam Bakar Madu, Wedang Uwuh"
                  className="h-9 rounded-lg text-xs"
                  disabled={saving}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="c-usp" className="text-xs text-muted-foreground font-medium">
                  Keunikan / USP Brand
                </Label>
                <Textarea
                  id="c-usp"
                  value={form.usp}
                  onChange={(e) => setForm({ ...form, usp: e.target.value })}
                  placeholder="Misal: Resep rempah turun-temurun 1985, dimasak kayu bakar, tanpa MSG."
                  className="h-16 resize-none rounded-lg text-xs"
                  disabled={saving}
                />
              </div>
            </div>

            {/* Kredensial Kontak & Login */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="c-email" className="text-xs font-medium">
                  Email Login Client (Opsional)
                </Label>
                <Input
                  id="c-email"
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                  placeholder="owner@client.id"
                  className="h-9 rounded-lg text-xs"
                  disabled={saving}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-phone" className="text-xs font-medium">
                  No. Telepon / WA (Opsional)
                </Label>
                <Input
                  id="c-phone"
                  value={form.contact_phone}
                  onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                  placeholder="08xxxxxxxxxx"
                  className="h-9 rounded-lg text-xs"
                  disabled={saving}
                />
              </div>
            </div>

            {err && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive">
                {err}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="h-10 lg:h-9"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Batal
            </Button>
            <Button
              className="h-10 lg:h-9 bg-brand-accent hover:bg-brand-accent/90"
              onClick={handleCreate}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" /> Menyiapkan Onboarding...
                </>
              ) : (
                <>
                  <Sparkles className="size-4 mr-2" /> Simpan & Generate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Kredensial */}
      <Dialog open={createdCredentials !== null} onOpenChange={(o) => { if (!o) handleCredentialsClose() }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2Icon className="size-5 text-green-600" /> Akun Client Dibuat
            </DialogTitle>
            <DialogDescription>
              Bagikan kredensial ini ke client {createdCredentials?.clientName}. Password hanya ditampilkan sekali.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Email</Label>
              <p className="font-mono text-sm">{createdCredentials?.email}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Password Baru</Label>
              <p className="font-mono text-sm">{createdCredentials?.password}</p>
            </div>
            {createdCredentials?.brandProfileGenerated ? (
              <p className="text-[11px] text-green-600 flex items-center gap-1 font-medium">
                <Sparkles className="size-3" /> Brand Profile strategi AI berhasil digenerate!
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button className="h-10 lg:h-9 w-full" onClick={handleCredentialsClose}>
              Salin & Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
