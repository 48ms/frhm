"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/animate-ui/components/radix/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/icons"
import { useUpdateClient } from "@/features/clients/api/queries"
import type { ClientWithChannels } from "@/features/social-accounts/api/types"
import { NICHE_OPTIONS } from "@/components/client/create-client-dialog"

interface EditClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: ClientWithChannels | null
}

export function EditClientDialog({ open, onOpenChange, client }: EditClientDialogProps) {
  const updateMutation = useUpdateClient()

  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [niche, setNiche] = React.useState("")
  const [telegramId, setTelegramId] = React.useState("")
  const [tagline, setTagline] = React.useState("")
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  // Populate data saat client berganti
  React.useEffect(() => {
    if (client) {
      setName(client.name || "")
      setEmail(client.contact_email || "")
      setPhone(client.contact_phone || "")
      const bp = (client.brand_profile as Record<string, unknown>) || {}
      setNiche(typeof bp.niche === "string" ? bp.niche : "")
      setTelegramId(typeof (client as any).telegram_chat_id === "string" ? (client as any).telegram_chat_id : "")
      setTagline(typeof bp.tagline === "string" ? bp.tagline : "")
      setErrorMsg(null)
    }
  }, [client])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!client) return

    if (!name.trim()) {
      setErrorMsg("Nama brand / workspace wajib diisi.")
      return
    }

    setErrorMsg(null)
    try {
      await updateMutation.mutateAsync({
        id: client.id,
        name: name.trim(),
        contact_email: email.trim() || undefined,
        contact_phone: phone.trim() || undefined,
        telegram_chat_id: telegramId.trim() || undefined,
        niche: niche.trim() || undefined,
        tagline: tagline.trim() || undefined,
      })
      onOpenChange(false)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan saat memperbarui client.")
    }
  }

  if (!client) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border-border/40 bg-card p-6 rounded-2xl shadow-xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Icons.edit className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Edit Client Workspace</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Perbarui identitas profil brand, kontak, dan integrasi notifikasi.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {errorMsg && (
          <div className="p-3 text-xs rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-2">
            <Icons.alertCircle className="size-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-client-name" className="text-xs font-semibold">
              Nama Brand / Workspace <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-client-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Taraju Coffee Roastery"
              className="h-9 text-xs rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-client-niche" className="text-xs font-semibold">
                Niche / Industri
              </Label>
              <Input
                id="edit-client-niche"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="Contoh: F&B / Cafe"
                className="h-9 text-xs rounded-xl"
                list="edit-niche-list"
              />
              <datalist id="edit-niche-list">
                {NICHE_OPTIONS.map((n) => (
                  <option key={n.id} value={n.label} />
                ))}
              </datalist>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-client-tagline" className="text-xs font-semibold">
                Tagline Singkat
              </Label>
              <Input
                id="edit-client-tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Contoh: Craft Specialty Coffee"
                className="h-9 text-xs rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-client-email" className="text-xs font-semibold">
                Email Kontak Utama
              </Label>
              <Input
                id="edit-client-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@brand.com"
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-client-phone" className="text-xs font-semibold">
                No. WhatsApp / Telepon
              </Label>
              <Input
                id="edit-client-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0812xxxxxxxx"
                className="h-9 text-xs rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-client-telegram" className="text-xs font-semibold flex items-center justify-between">
              <span>Telegram Chat ID</span>
              <span className="text-2xs text-muted-foreground font-normal">Untuk routing alert bot</span>
            </Label>
            <Input
              id="edit-client-telegram"
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value)}
              placeholder="Contoh: -100123456789 atau ID user"
              className="h-9 text-xs rounded-xl"
            />
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 text-xs rounded-xl"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              isLoading={updateMutation.isPending}
              className="h-9 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
