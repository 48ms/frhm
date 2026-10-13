"use client"

import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/animate-ui/components/radix/dialog"

export interface DisconnectDialogProps {
  open: boolean
  handle: string
  onConfirm: () => void
  onClose: () => void
}

/**
 * Destructive confirmation for disconnecting a channel.
 *
 * Uses Radix UI Dialog & Button primitives for accessibility and smooth interactions.
 */
export function DisconnectDialog({ open, handle, onConfirm, onClose }: DisconnectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-sm bg-card/95 backdrop-blur-2xl rounded-3xl border border-border/40 p-6 shadow-2xl space-y-6">
        <div className="p-6 space-y-3 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center shrink-0">
              <Icons.warning className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                Disconnect {handle}?
              </DialogTitle>
              <p className="text-xs text-muted-foreground">This cannot be undone.</p>
            </div>
          </div>
          <DialogDescription className="text-xs leading-relaxed">
            All synced history, scheduled posts, and cached analytics for this account will be permanently removed. You will need to reconnect from scratch to restore access.
          </DialogDescription>
        </div>

        <div className="p-4 bg-muted/50 border-t flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-full text-xs font-semibold"
          >
            Keep account
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            className="rounded-full text-xs font-bold"
          >
            Disconnect {handle}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
