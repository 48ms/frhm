"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/animate-ui/components/radix/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Icons } from "@/components/icons"
import { toast } from "sonner"

export type ClientUser = {
  id: string
  email: string
  full_name: string | null
  role: string
  client_id: string
  created_at?: string
}

interface ClientAccessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  clientName: string
}

export function ClientAccessDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
}: ClientAccessDialogProps) {
  const queryClient = useQueryClient()
  const [fullName, setFullName] = React.useState("")
  const [email, setEmail] = React.useState("")

  const queryKey = ["admin", "client-users", clientId]

  const { data: users = [], isLoading } = useQuery<ClientUser[]>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`/api/admin/client-users?clientId=${clientId}`)
      if (!res.ok) {
        throw new Error("Gagal memuat pengguna klien")
      }
      const data = await res.json()
      return data.users || []
    },
    enabled: open && Boolean(clientId),
  })

  const assignMutation = useMutation({
    mutationFn: async (payload: { clientId: string; email: string; fullName: string }) => {
      const res = await fetch("/api/admin/client-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, role: "client" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal menautkan pengguna")
      return data
    },
    onSuccess: (data) => {
      toast.success(data.message || "Akses klien berhasil ditambahkan!")
      setFullName("")
      setEmail("")
      void queryClient.invalidateQueries({ queryKey })
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Gagal menambahkan akses klien")
    },
  })

  const revokeMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/client-users?userId=${userId}&clientId=${clientId}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal mencabut akses")
      return data
    },
    onSuccess: (data) => {
      toast.success(data.message || "Akses klien dicabut.")
      void queryClient.invalidateQueries({ queryKey })
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Gagal mencabut akses")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !fullName.trim()) {
      toast.error("Nama lengkap dan email wajib diisi")
      return
    }
    assignMutation.mutate({ clientId, email, fullName })
  }

  const handleCopyWhatsAppInvite = (user: ClientUser) => {
    const text = `Halo ${user.full_name || "Bapak/Ibu"},\n\nBerikut tautan akses ke Portal Klien Frhm untuk monitoring & persetujuan materi promosi ${clientName}:\n🔗 URL: ${window.location.origin}/auth/login\n✉️ Email: ${user.email}\n\nSilakan masuk menggunakan email di atas atau gunakan tombol "Masuk dengan Google". Terima kasih!`
    navigator.clipboard.writeText(text)
    toast.success("Teks undangan disalin!", {
      description: `Format WhatsApp untuk ${user.email} siap dikirimkan.`,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl bg-card border border-border/80 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Icons.users className="size-5 text-primary" />
            <span>Akses Portal Klien — {clientName}</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Pengguna yang ditautkan di bawah ini dapat login secara mandiri ke <strong>Portal Klien Frhm</strong> dan hanya dapat mengakses data milik brand {clientName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Active Client Users List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Daftar Akun Klien Aktif ({users.length})
            </h4>

            {isLoading ? (
              <div className="p-4 rounded-xl bg-muted/40 animate-pulse text-xs text-muted-foreground">
                Memuat daftar akun...
              </div>
            ) : users.length === 0 ? (
              <div className="p-4 rounded-xl bg-muted/30 border border-border/30 text-center text-xs text-muted-foreground">
                Belum ada akun pengguna yang ditautkan ke brand ini. Tambahkan akun pertama melalui form di bawah.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="p-3 rounded-xl bg-muted/40 border border-border/40 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-foreground truncate">{u.full_name || "Tanpa Nama"}</p>
                      <p className="text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopyWhatsAppInvite(u)}
                        title="Salin template WhatsApp"
                        className="h-8 px-2 text-2xs font-semibold rounded-lg hover:bg-muted cursor-pointer"
                      >
                        <Icons.whatsapp className="size-3.5 text-emerald-500 mr-1" />
                        <span>Salin WA</span>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => revokeMutation.mutate(u.id)}
                        disabled={revokeMutation.isPending}
                        className="h-8 px-2 text-2xs text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer"
                      >
                        Cabut
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form to Add / Link New Client User */}
          <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-card border border-border/50 space-y-3">
            <h4 className="text-xs font-bold text-foreground">
              Tambah Pengguna Klien Baru
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-2xs font-bold text-muted-foreground uppercase">
                  Nama Lengkap
                </label>
                <Input
                  placeholder="Contoh: Pak Adit"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-9 text-xs rounded-xl mt-1"
                />
              </div>

              <div>
                <label className="text-2xs font-bold text-muted-foreground uppercase">
                  Email Klien
                </label>
                <Input
                  type="email"
                  placeholder="adit@tarajucoffee.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9 text-xs rounded-xl mt-1"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={assignMutation.isPending}
              isLoading={assignMutation.isPending}
              className="w-full h-9 rounded-xl font-semibold text-xs bg-primary text-primary-foreground shadow-xs cursor-pointer"
            >
              <Icons.add className="size-4 mr-1.5" />
              <span>Tautkan Akses Klien</span>
            </Button>
          </form>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="rounded-xl">
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
