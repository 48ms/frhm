"use client"

import * as React from "react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/animate-ui/components/radix/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/icons"
import { useDeleteClient } from "@/features/clients/api/queries"
import type { ClientWithChannels } from "@/features/social-accounts/api/types"

interface DeleteClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: ClientWithChannels | null
  onDeleted?: (deletedId: string) => void
}

export function DeleteClientDialog({
  open,
  onOpenChange,
  client,
  onDeleted,
}: DeleteClientDialogProps) {
  const deleteMutation = useDeleteClient()
  const [confirmText, setConfirmText] = React.useState("")
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  React.useEffect(() => {
    setConfirmText("")
    setErrorMsg(null)
  }, [open, client])

  if (!client) return null

  const isConfirmed = confirmText.trim().toLowerCase() === client.name.trim().toLowerCase()

  const handleDelete = async () => {
    if (!isConfirmed) return
    setErrorMsg(null)
    try {
      await deleteMutation.mutateAsync(client.id)
      onOpenChange(false)
      onDeleted?.(client.id)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Gagal menghapus client.")
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md border-border/40 bg-card p-6 rounded-2xl shadow-xl">
        <AlertDialogHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive shrink-0">
              <Icons.trash className="size-5" />
            </div>
            <div>
              <AlertDialogTitle className="text-base font-bold text-foreground">
                Hapus Client Workspace?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground">
                Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="space-y-3 py-2 text-xs">
          <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/20 text-destructive/90 space-y-1.5 leading-relaxed">
            <p className="font-semibold flex items-center gap-1.5 text-destructive">
              <Icons.alertTriangle className="size-4 shrink-0" />
              Perhatian: Dampak Penghapusan
            </p>
            <p className="text-muted-foreground text-2xs">
              Menghapus workspace <strong className="text-foreground">{client.name}</strong> akan menghapus seluruh data deliverable, channel media sosial, dan histori aktivitas yang terkait secara permanen.
            </p>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-destructive/10 text-destructive text-xs flex items-center gap-2">
              <Icons.alertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1.5 pt-1">
            <Label htmlFor="confirm-client-name" className="text-xs font-semibold text-muted-foreground">
              Ketik <span className="text-foreground font-bold select-all font-mono bg-muted/60 px-1 py-0.5 rounded">{client.name}</span> untuk konfirmasi:
            </Label>
            <Input
              id="confirm-client-name"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={client.name}
              className="h-9 text-xs rounded-xl font-medium"
              autoComplete="off"
            />
          </div>
        </div>

        <AlertDialogFooter className="gap-2 pt-2">
          <AlertDialogCancel
            type="button"
            className="h-9 text-xs rounded-xl"
            disabled={deleteMutation.isPending}
          >
            Batal
          </AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmed || deleteMutation.isPending}
            isLoading={deleteMutation.isPending}
            className="h-9 text-xs font-semibold rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Hapus Permanen
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
