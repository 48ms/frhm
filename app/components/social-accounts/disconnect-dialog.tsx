"use client"

import { Icons } from "@/components/icons"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"

export interface DisconnectDialogProps {
  open: boolean
  handle: string
  onConfirm: () => void
  onClose: () => void
}

/**
 * Destructive confirmation for disconnecting a channel.
 *
 * Uses the shadcn Dialog (Base UI) so focus trap, scroll lock, Escape,
 * and focus restore come from the primitive instead of hand-rolled code.
 */
export function DisconnectDialog({ open, handle, onConfirm, onClose }: DisconnectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-sm gap-0 overflow-hidden p-0">
        <div className="p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/15 text-rose-600 flex items-center justify-center shrink-0">
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
            The synced history, scheduled posts, and cached analytics for this account will be removed.
            You will need to connect it again from scratch.
          </DialogDescription>
        </div>

        <div className="p-4 bg-muted/50 border-t flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full border border-border bg-background text-foreground text-xs font-semibold hover:bg-accent transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Keep account
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
          >
            Disconnect {handle}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
