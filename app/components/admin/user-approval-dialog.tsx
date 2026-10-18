'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/animate-ui/components/radix/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/animate-ui/components/radix/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/animate-ui/components/radix/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { usePendingUsers, useApproveUserMutation } from '@/features/pending-users/api/queries'
import type { PendingUser } from '@/features/pending-users/api/types'

interface UserApprovalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialSelectedUserId?: string
}

export function UserApprovalDialog({
  open,
  onOpenChange,
  initialSelectedUserId,
}: UserApprovalDialogProps) {
  const { data, isLoading, refetch } = usePendingUsers({ enabled: open })
  const approveMutation = useApproveUserMutation()

  const pendingUsers = data?.pendingUsers ?? []
  const clients = data?.clients ?? []

  const [selectedUserId, setSelectedUserId] = React.useState<string>('')
  const [selectedRole, setSelectedRole] = React.useState<'client' | 'admin'>('client')
  const [selectedClientId, setSelectedClientId] = React.useState<string>('')

  // Sync selected user when pending users load or change
  React.useEffect(() => {
    if (pendingUsers.length === 0) {
      setSelectedUserId('')
      return
    }

    if (initialSelectedUserId && pendingUsers.some((u) => u.id === initialSelectedUserId)) {
      setSelectedUserId(initialSelectedUserId)
    } else if (!selectedUserId || !pendingUsers.some((u) => u.id === selectedUserId)) {
      // Default to first user (or bebekbek9191 if present)
      const target = pendingUsers.find((u) => u.email.includes('bebekbek9191')) || pendingUsers[0]
      setSelectedUserId(target.id)
    }
  }, [pendingUsers, initialSelectedUserId, selectedUserId])

  // Current active user
  const activeUser: PendingUser | undefined = pendingUsers.find((u) => u.id === selectedUserId)

  // Default client id to first client if not set
  React.useEffect(() => {
    if (clients.length > 0 && !selectedClientId) {
      setSelectedClientId(clients[0].id)
    }
  }, [clients, selectedClientId])

  const handleApprove = async () => {
    if (!activeUser) return

    if (selectedRole === 'client' && !selectedClientId) {
      toast.error('Pilih Brand Klien untuk menautkan pengguna ber-role Klien.')
      return
    }

    try {
      const res = await approveMutation.mutateAsync({
        userId: activeUser.id,
        role: selectedRole,
        clientId: selectedRole === 'admin' ? null : selectedClientId,
      })

      toast.success(res.message || `Akun ${activeUser.email} berhasil disetujui!`)

      // Refetch latest pending list
      await refetch()

      // If this was the last pending user, close after brief delay
      if (pendingUsers.length <= 1) {
        onOpenChange(false)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyetujui akun'
      toast.error(msg)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden rounded-2xl border border-border/40 bg-card shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-border/40 bg-muted/20 text-left">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Icons.userCheck className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">
                Persetujuan Akses & Role Pengguna
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Pilih peran (Admin Agensi vs Klien Partner) untuk akun yang mendaftar.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
              <Icons.spinner className="size-6 animate-spin text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Memuat antrean pengguna baru...</p>
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
              <div className="size-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-1">
                <Icons.circleCheck className="size-6" />
              </div>
              <h4 className="text-sm font-semibold text-foreground">Tidak Ada Antrean Persetujuan</h4>
              <p className="text-xs text-muted-foreground max-w-sm">
                Semua pengguna baru telah disetujui dan memiliki hak akses ke sistem.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="mt-4 text-xs"
              >
                Tutup
              </Button>
            </div>
          ) : (
            <>
              {/* User Selector if multiple pending */}
              {pendingUsers.length > 1 && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Pilih Pengguna yang Menunggu ({pendingUsers.length} antrean):
                  </label>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {pendingUsers.map((u) => {
                      const isSelected = u.id === selectedUserId
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => setSelectedUserId(u.id)}
                          className={cn(
                            'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-colors shrink-0 cursor-pointer',
                            isSelected
                              ? 'bg-primary/10 border-primary text-foreground font-semibold'
                              : 'bg-muted/30 border-border/40 text-muted-foreground hover:bg-muted/60'
                          )}
                        >
                          <Avatar size="sm" className="size-5">
                            {u.avatarUrl && <AvatarImage src={u.avatarUrl} alt={u.fullName} />}
                            <AvatarFallback className="text-[10px]">
                              {u.fullName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate max-w-[140px]">{u.email}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Active User Card */}
              {activeUser && (
                <div className="p-4 rounded-xl border border-border/40 bg-muted/20 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar size="lg" className="size-11">
                        {activeUser.avatarUrl && (
                          <AvatarImage src={activeUser.avatarUrl} alt={activeUser.fullName} />
                        )}
                        <AvatarFallback className="text-sm font-semibold">
                          {activeUser.fullName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground leading-tight">
                          {activeUser.fullName}
                        </h4>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          {activeUser.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" className="text-2xs capitalize">
                        {activeUser.provider === 'google' ? (
                          <span className="flex items-center gap-1 text-sky-500">
                            <Icons.mail className="size-3" /> Google Login
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Icons.mail className="size-3" /> Email
                          </span>
                        )}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        Terdaftar: {new Date(activeUser.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Role Selection Options */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-foreground block">
                  Pilih Peran (Role) untuk Akun Ini:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option: Klien Partner */}
                  <div
                    onClick={() => setSelectedRole('client')}
                    className={cn(
                      'p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between text-left space-y-2',
                      selectedRole === 'client'
                        ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-xs'
                        : 'border-border/40 bg-card hover:bg-muted/30'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="size-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                        <Icons.building className="size-4" />
                      </div>
                      <div
                        className={cn(
                          'size-4 rounded-full border flex items-center justify-center transition-colors',
                          selectedRole === 'client'
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-muted-foreground/40'
                        )}
                      >
                        {selectedRole === 'client' && <Icons.check className="size-2.5 stroke-3" />}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Klien Partner</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        Akses terbatas hanya ke portal review & workspace brand yang ditugaskan.
                      </p>
                    </div>
                  </div>

                  {/* Option: Admin Agensi */}
                  <div
                    onClick={() => setSelectedRole('admin')}
                    className={cn(
                      'p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between text-left space-y-2',
                      selectedRole === 'admin'
                        ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-xs'
                        : 'border-border/40 bg-card hover:bg-muted/30'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <Icons.shieldCheck className="size-4" />
                      </div>
                      <div
                        className={cn(
                          'size-4 rounded-full border flex items-center justify-center transition-colors',
                          selectedRole === 'admin'
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-muted-foreground/40'
                        )}
                      >
                        {selectedRole === 'admin' && <Icons.check className="size-2.5 stroke-3" />}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">Admin Agensi</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        Akses penuh ke seluruh sistem Frhm, analitik, ERP, dan semua brand klien.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* If Client selected, choose Brand Workspace */}
              {selectedRole === 'client' && (
                <div className="space-y-2 p-3.5 rounded-xl border border-border/40 bg-muted/10">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Icons.building className="size-3.5 text-primary" />
                    Pilih Brand Klien (Workspace):
                  </label>
                  <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                    <SelectTrigger className="w-full h-9 text-xs bg-background">
                      <SelectValue placeholder="Pilih Brand Klien..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="text-xs">
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    Pengguna ini akan langsung dapat melihat kalender, draft konten, dan persetujuan brand yang dipilih saat login.
                  </p>
                </div>
              )}

              {/* Footer Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-border/40">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  disabled={approveMutation.isPending}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleApprove}
                  disabled={approveMutation.isPending || !activeUser}
                  className="text-xs font-semibold gap-1.5"
                >
                  {approveMutation.isPending ? (
                    <>
                      <Icons.spinner className="size-3.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Icons.check className="size-3.5" />
                      Setujui & Aktifkan Role
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
