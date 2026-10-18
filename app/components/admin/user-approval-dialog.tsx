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
      // Default to bebekbek9191 if present, otherwise first user
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

      // If this was the last pending user, close
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
      <DialogContent className="w-full sm:max-w-xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl border border-border/40 bg-card shadow-2xl">
        {/* Header - Fixed */}
        <DialogHeader className="p-5 pb-4 border-b border-border/40 bg-muted/20 text-left shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Icons.userCheck className="size-5" />
            </div>
            <div className="min-w-0 pr-6">
              <DialogTitle className="text-base font-semibold text-foreground truncate">
                Persetujuan Akses & Role Pengguna
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Pilih peran (Admin Agensi vs Klien Partner) untuk akun yang mendaftar.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
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
            </div>
          ) : (
            <>
              {/* Account Dropdown Selector if multiple pending */}
              {pendingUsers.length > 1 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Pilih Akun yang Akan Disetujui ({pendingUsers.length} antrean):
                  </label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger className="w-full h-9 text-xs bg-background">
                      <SelectValue placeholder="Pilih akun..." />
                    </SelectTrigger>
                    <SelectContent>
                      {pendingUsers.map((u) => (
                        <SelectItem key={u.id} value={u.id} className="text-xs font-mono">
                          {u.email} ({u.fullName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Active User Card */}
              {activeUser && (
                <div className="p-3.5 rounded-xl border border-border/40 bg-muted/20">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar size="lg" className="size-10 shrink-0">
                        {activeUser.avatarUrl && (
                          <AvatarImage src={activeUser.avatarUrl} alt={activeUser.fullName} />
                        )}
                        <AvatarFallback className="text-xs font-semibold">
                          {activeUser.fullName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-foreground leading-tight truncate">
                          {activeUser.fullName}
                        </h4>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
                          {activeUser.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
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
                        {new Date(activeUser.createdAt).toLocaleDateString('id-ID', {
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
              <div className="space-y-2.5">
                <label className="text-xs font-semibold text-foreground block">
                  Pilih Peran (Role) untuk Akun Ini:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Option: Klien Partner */}
                  <div
                    onClick={() => setSelectedRole('client')}
                    className={cn(
                      'p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between text-left space-y-2',
                      selectedRole === 'client'
                        ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-xs'
                        : 'border-border/40 bg-card hover:bg-muted/30'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="size-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                        <Icons.building className="size-3.5" />
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
                        Akses khusus portal review & workspace brand yang ditugaskan.
                      </p>
                    </div>
                  </div>

                  {/* Option: Admin Agensi */}
                  <div
                    onClick={() => setSelectedRole('admin')}
                    className={cn(
                      'p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between text-left space-y-2',
                      selectedRole === 'admin'
                        ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-xs'
                        : 'border-border/40 bg-card hover:bg-muted/30'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="size-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <Icons.shieldCheck className="size-3.5" />
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
                        Akses penuh seluruh agensi, analitik, ERP, dan semua klien.
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
                    Pengguna ini akan langsung melihat kalender, draft konten, dan persetujuan brand saat login.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer - Always Fixed & Visible */}
        <div className="p-4 border-t border-border/40 bg-muted/20 flex items-center justify-end gap-2.5 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={approveMutation.isPending}
            className="text-xs cursor-pointer"
          >
            Batal
          </Button>
          {pendingUsers.length > 0 && activeUser && (
            <Button
              type="button"
              size="sm"
              onClick={handleApprove}
              disabled={approveMutation.isPending || !activeUser}
              className="text-xs font-semibold gap-1.5 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
