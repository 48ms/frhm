import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'
import { NICHE_OPTIONS, type NicheId } from '@/lib/onboarding/niche-packs'
import { toast } from 'sonner'
import { useAppForm } from '@/lib/form'
import { createNewClient } from '@/features/dashboard/api/service'

export { NICHE_OPTIONS }
export type { NicheId }

interface CreateClientWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (client: { id: string; name: string }) => void
}

const createClientSchema = z.object({
  name: z.string().min(1, 'Nama brand wajib diisi').max(50, 'Nama brand terlalu panjang'),
  niche: z.string().min(1, 'Pilih niche/industri terlebih dahulu'),
  contact_email: z.string().email('Format email tidak valid').or(z.literal('')),
  contact_phone: z.string(),
  telegram_chat_id: z.string(),
})

import { useQueryClient } from '@tanstack/react-query'
import { dashboardKeys } from '@/features/dashboard/api/queries'
import { socialKeys } from '@/features/social-accounts/api/queries'

export function CreateClientWizard({ open, onOpenChange, onCreated }: CreateClientWizardProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  
  const [step, setStep] = useState<1 | 2>(1)
  const [err, setErr] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string
    password: string
    clientId: string
    clientName: string
    seededSkills: number
  } | null>(null)

  const form = useAppForm({
    defaultValues: {
      name: '',
      niche: '',
      contact_email: '',
      contact_phone: '',
      telegram_chat_id: '',
    },
    validators: {
      onSubmit: createClientSchema
    },
    onSubmit: async ({ value }) => {
      setErr(null)
      try {
        const client = await createNewClient({
          name: value.name.trim(),
          contact_email: value.contact_email || undefined,
          contact_phone: value.contact_phone || undefined,
          telegram_chat_id: value.telegram_chat_id || undefined,
          niche: value.niche || undefined,
        })
        
        toast.success('Client workspace berhasil dibuat di database.')

        // OPTIMISTIC UPDATE (fakta): createNewClient adalah Server Action yang
        // mengembalikan `id` asli, jadi kita bisa menyuntikkan klien baru ke
        // cache TanStack pakai id nyata (bukan temp-id). UI (sidebar + grid)
        // langsung ter-update tanpa menunggu refetch server. `invalidateQueries`
        // di bawah hanya untuk rekonsiliasi background (stale-while-revalidate),
        // sehingga tidak ada jeda "client belum muncul".
        const nowIso = new Date().toISOString()
        const optimisticClient = {
          id: client.id,
          name: client.name,
          contact_email: value.contact_email || null,
          contact_phone: value.contact_phone || null,
          brand_profile: {
            who: '', audience: '', voice: '', pov: '', proof: '', guardrails: '', pillars: [],
            ...(value.niche ? { niche: value.niche } : {}),
          },
          created_at: nowIso,
          updated_at: nowIso,
          channels: [],
        }

        queryClient.setQueryData(socialKeys.clients(), (old: any) =>
          Array.isArray(old) ? [...old, optimisticClient] : [optimisticClient]
        )
        queryClient.setQueryData(dashboardKeys.clients(), (old: any) =>
          Array.isArray(old)
            ? [...old, { id: client.id, name: client.name, contact_email: value.contact_email || null }]
            : [{ id: client.id, name: client.name, contact_email: value.contact_email || null }]
        )

        setCreatedCredentials({
          email: value.contact_email.trim() || 'admin@frhm.saas',
          password: '(tersimpan aman)',
          clientId: client.id,
          clientName: client.name,
          seededSkills: 1,
        })

        if (onCreated) {
          onCreated({ id: client.id, name: client.name })
        }
        // Rekonsiliasi background dengan sumber kebenaran server (tanpa
        // memblokir UI — data optimistik sudah tampil lebih dulu).
        queryClient.invalidateQueries({ queryKey: dashboardKeys.clients() })
        queryClient.invalidateQueries({ queryKey: socialKeys.clients() })
      } catch (e: any) {
        setErr(e instanceof Error ? e.message : 'Terjadi kesalahan')
      }
    }
  })

  const handleNextStep = () => {
    setErr(null)
    const vals = form.state.values
    if (!vals.name.trim() || !vals.niche) {
      setErr('Mohon lengkapi Nama Brand dan Niche terlebih dahulu')
      return
    }
    setStep(2)
  }

  const handleClose = () => {
    form.reset()
    setStep(1)
    setShowAdvanced(false)
    setErr(null)
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
        <DialogContent className="max-w-md overflow-hidden p-0 gap-0 border-primary/20 shadow-2xl">
          {/* Header Progress Bar */}
          <div className="bg-muted/40 border-b p-6 pb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                {/* Icons.sparkles = Brand creation wizard AI assistant indicator (R-04 exception) */}
                <Icons.sparkles className="size-3.5 text-primary" />
                Tambah Client Baru
              </span>
              <span className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full border border-primary/20">
                Langkah {step} dari 2
              </span>
            </div>
            
            {/* Stepper Indicator */}
            <div className="grid grid-cols-2 gap-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="bg-primary transition-all duration-300" />
              <div className={`transition-all duration-300 ${step === 2 ? 'bg-primary' : 'bg-transparent'}`} />
            </div>
          </div>

          <form
            id="create-client-form"
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              void form.handleSubmit()
            }}
            className="p-6 space-y-4"
          >
            {step === 1 ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-1">
                  <h3 className="font-semibold text-base">Identitas Brand Utama</h3>
                  <p className="text-xs text-muted-foreground">
                    Masukkan nama brand dan niche untuk menyiapkan workspace AI.
                  </p>
                </div>

                <div className="space-y-3">
                  <form.AppField
                    name="name"
                    children={(field) => (
                      <field.TextField
                        label="Nama Brand"
                        placeholder="Contoh: Pawon Sengon"
                        autoFocus
                        required
                      />
                    )}
                  />

                  <form.AppField
                    name="niche"
                    children={(field) => (
                      <field.SelectField
                        label="Niche / Industri"
                        placeholder="-- Pilih Niche --"
                        options={NICHE_OPTIONS.map(n => ({ value: n.id, label: n.label }))}
                        required
                      />
                    )}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-1">
                  <h3 className="font-semibold text-base">Detail Kontak & Akses Client</h3>
                  <p className="text-xs text-muted-foreground">
                    Opsional. Dapatkan akses login portal klien dan notifikasi Telegram.
                  </p>
                </div>

                <div className="rounded-xl border bg-muted/20 p-4 space-y-4 shadow-sm">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <form.AppField
                      name="contact_email"
                      children={(field) => (
                        <field.TextField
                          label="Email Login Portal"
                          placeholder="owner@brand.id"
                          type="email"
                        />
                      )}
                    />
                    <form.AppField
                      name="contact_phone"
                      children={(field) => (
                        <field.TextField
                          label="No. WhatsApp"
                          placeholder="08xxxxxxxxxx"
                        />
                      )}
                    />
                  </div>

                  {!showAdvanced ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs font-semibold text-primary/70 hover:text-primary p-0 h-auto hover:bg-transparent"
                      onClick={() => setShowAdvanced(true)}
                    >
                      Tambah Telegram Chat ID (Opsional)
                    </Button>
                  ) : (
                    <div className="pt-2 border-t border-muted-foreground/10 animate-in fade-in zoom-in-95 duration-200">
                      <form.AppField
                        name="telegram_chat_id"
                        children={(field) => (
                          <field.TextField
                            label="Telegram Chat ID"
                            placeholder="Contoh: 123456789"
                          />
                        )}
                      />
                    </div>
                  )}
                </div>

                <div className="rounded-lg bg-primary/5 border border-primary/20 p-3.5 text-xs flex gap-3 items-start shadow-inner">
                  <div className="bg-primary/10 p-1.5 rounded-md mt-0.5 shrink-0">
                    <Icons.sparkles className="size-3.5 text-primary" />
                  </div>
                  <div>
                    <span className="font-semibold block text-foreground mb-0.5">Satu Langkah Lagi!</span>
                    <span className="text-muted-foreground leading-relaxed">
                      Setelah ini Anda akan langsung dipandu oleh AI untuk wawancara pembentukan brand profile.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {err && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <Icons.alertCircle className="size-4 shrink-0" />
                <span className="font-medium">{err}</span>
              </div>
            )}
            
            {form.state.errors.length > 0 && !err && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <Icons.alertCircle className="size-4 shrink-0" />
                <span className="font-medium">Mohon periksa kembali isian formulir Anda.</span>
              </div>
            )}
          </form>

          <div className="bg-muted/30 border-t p-4 flex justify-between items-center rounded-b-lg">
            {step === 1 ? (
              <>
                <Button variant="ghost" size="sm" onClick={handleClose} className="text-muted-foreground hover:text-foreground">
                  Batal
                </Button>
                <Button size="sm" onClick={handleNextStep} className="font-semibold px-4 active:scale-95 transition-all">
                  Lanjut ke Kontak <Icons.arrowRight className="size-3.5 ml-1.5" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => setStep(1)} disabled={form.state.isSubmitting} className="active:scale-95 transition-all">
                  <Icons.arrowLeft className="size-3.5 mr-1.5" /> Kembali
                </Button>
                <Button 
                  type="submit" 
                  form="create-client-form" 
                  size="sm" 
                  className="font-semibold px-4 active:scale-95 transition-all"
                  isLoading={form.state.isSubmitting}
                  disabled={!form.state.canSubmit}
                >
                  <Icons.userPlus className="size-4 mr-1.5" /> Siapkan Workspace
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Launchpad Dialog */}
      <Dialog open={createdCredentials !== null} onOpenChange={(o) => { if (!o) handleClose() }}>
        <DialogContent className="max-w-md p-6 border-green-500/20 shadow-2xl">
          <div className="text-center space-y-3">
            <div className="size-14 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 flex items-center justify-center mx-auto shadow-inner">
              <Icons.check className="size-7 stroke-[3]" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">Workspace Client Siap!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Klien <strong className="text-foreground">{createdCredentials?.clientName}</strong> berhasil didaftarkan.
              </p>
            </div>
          </div>

          <div className="my-5 rounded-xl border bg-muted/40 p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">Skill Tersedia:</span>
              <span className="font-bold text-primary flex items-center gap-1.5">
                <Icons.sparkles className="size-3.5" />
                {createdCredentials?.seededSkills} Skill Siap
              </span>
            </div>
            {createdCredentials?.email && (
              <div className="pt-3 border-t border-muted-foreground/10 space-y-1.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Email Portal:</span>
                  <span className="font-mono bg-background px-2 py-0.5 rounded border text-foreground/80">{createdCredentials.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Password:</span>
                  <span className="font-mono bg-background px-2 py-0.5 rounded border text-foreground/80">{createdCredentials.password}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2.5">
            <Button
              className="w-full h-11 text-sm font-bold shadow-md hover:shadow-lg active:scale-[0.98] transition-all bg-primary text-primary-foreground"
              onClick={handleStartInterview}
            >
              <Icons.sparkles className="size-4 mr-2" />
              Mulai Interview Brand Profile
            </Button>
            <Button variant="ghost" className="w-full h-9 text-xs font-semibold text-muted-foreground hover:text-foreground" onClick={handleClose}>
              Lanjut ke Dashboard Dulu
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
