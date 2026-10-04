"use client"

import * as React from "react"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import { type SocialAccount } from "./social-data"
import { PLATFORM_SCOPES } from "./social-scopes"
import { useAppStore } from "@/lib/store/app-store"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

export interface ManageAccessDialogProps {
  open: boolean
  account: SocialAccount | null
  onClose: () => void
}

/** Granted set when the account has never had scopes edited. */
function allGranted(platform: string): string[] {
  return (PLATFORM_SCOPES[platform] ?? []).map((s) => s.id)
}

export function ManageAccessDialog({ open, account, onClose }: ManageAccessDialogProps) {
  const updateAccount = useAppStore((s) => s.updateAccount)
  const [granted, setGranted] = React.useState<string[]>([])

  // Sync local draft from the account whenever the target changes.
  React.useEffect(() => {
    if (!account) return
    setGranted(account.scopes ?? allGranted(account.platform))
  }, [account, open])

  const scopes = account ? (PLATFORM_SCOPES[account.platform] ?? []) : []
  const optionalScopes = scopes.filter((s) => !s.required)
  const requiredScopes = scopes.filter((s) => s.required)

  const grantedIds = account?.scopes ?? allGranted(account?.platform ?? "")
  const dirty = granted.join(",") !== grantedIds.join(",")
  const publishingOff = optionalScopes.some(
    (s) => s.impactOff?.includes("will not go out") && !granted.includes(s.id)
  )

  const handleToggle = (scopeId: string, next: boolean) => {
    setGranted((prev) => (next ? [...prev, scopeId] : prev.filter((id) => id !== scopeId)))
  }

  const handleSave = async () => {
    if (!account) return
    const oldScopes = account.scopes ?? allGranted(account.platform)
    updateAccount(account.id, { scopes: granted })

    try {
      await fetch('/api/social/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: account.id,
          handle: account.handle,
          platform: account.platform,
          oldScopes,
          newScopes: granted,
        }),
      })
    } catch (err) {
      console.error('[audit] failed to record scope change:', err)
    }

    toast.success(`Access updated for ${account.handle}`)
    onClose()
  }

  const handleReconnect = () => {
    if (!account) return
    const restored = allGranted(account.platform)
    updateAccount(account.id, { scopes: restored, status: "SYNCED" })
    setGranted(restored)
    toast.success(`${account.handle} reconnected with full access`)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent
        showCloseButton
        className="max-w-lg gap-0 overflow-hidden p-0"
        aria-describedby="manage-access-desc"
      >
        <DialogHeader className="p-6 border-b">
          <DialogTitle className="text-xl font-bold">Manage access</DialogTitle>
          <DialogDescription id="manage-access-desc" className="text-xs">
            What Frahma is allowed to do with this account. Changes take effect immediately.
          </DialogDescription>
        </DialogHeader>

        {account && (
          <div className="p-6 space-y-5">
            {/* Account identity */}
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/40 p-3">
              <div className={cn("flex size-10 items-center justify-center rounded-xl shrink-0", account.bg, account.fg)}>
                {(() => {
                  const key = account.icon as keyof typeof Icons
                  const IconComp = typeof Icons[key] === "function" ? Icons[key] : null
                  return IconComp ? <IconComp className="size-5" /> : <Icons.hub className="size-5" />
                })()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{account.handle}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {account.platform} · {account.name}
                </p>
              </div>
            </div>

            {scopes.length === 0 ? (
              <div className="p-6 rounded-2xl border border-dashed border-border/50 text-center text-sm font-medium text-muted-foreground">
                No permissions catalog for this platform yet.
              </div>
            ) : (
              <>
                {/* Required permissions (locked) */}
                {requiredScopes.length > 0 && (
                  <div className="space-y-2">
                    <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                      <Icons.shield className="size-3.5" />
                      Required to stay connected
                    </p>
                    <div className="space-y-2">
                      {requiredScopes.map((scope) => (
                        <div
                          key={scope.id}
                          className="flex items-start gap-3 rounded-xl border border-border bg-card p-3"
                        >
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                              {scope.id}
                            </code>
                            <p className="text-[11px] leading-snug text-muted-foreground">
                              {scope.description}
                            </p>
                          </div>
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                            <Icons.lock className="size-3" />
                            Locked
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Optional permissions (toggleable) */}
                {optionalScopes.length > 0 && (
                  <div className="space-y-2">
                    <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                      <Icons.settings className="size-3.5" />
                      Optional
                    </p>
                    <div className="space-y-2">
                      {optionalScopes.map((scope) => {
                        const on = granted.includes(scope.id)
                        return (
                          <div
                            key={scope.id}
                            className="flex items-start gap-3 rounded-xl border border-border bg-card p-3"
                          >
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                                {scope.id}
                              </code>
                              <p className="text-[11px] leading-snug text-muted-foreground">
                                {scope.description}
                              </p>
                              {!on && scope.impactOff && (
                                <p className="flex items-start gap-1 pt-1 text-[10px] font-medium text-amber-600">
                                  <Icons.warning className="size-3 shrink-0 translate-y-px" />
                                  {scope.impactOff}
                                </p>
                              )}
                            </div>
                            <Switch
                              checked={on}
                              onCheckedChange={(next) => handleToggle(scope.id, next)}
                              aria-label={scope.id}
                              className="mt-0.5"
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Publishing paused warning */}
                {publishingOff && (
                  <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-700 dark:text-amber-400">
                    <Icons.warning className="size-4 shrink-0 translate-y-px" />
                    <p className="text-[11px] leading-snug">
                      Publishing is paused for this account until publishing permission is turned back on.
                      Scheduled posts already queued stay queued.
                    </p>
                  </div>
                )}

                {/* Reconnect to restore */}
                <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border/60 p-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold">Need full access back?</p>
                    <p className="text-[11px] leading-snug text-muted-foreground">
                      Reconnect through the platform sign-in to grant every permission again.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleReconnect}>
                    <Icons.refresh className="size-3.5" />
                    Reconnect
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        <DialogFooter className="flex-row justify-end gap-2 px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!dirty} onClick={handleSave} className="disabled:opacity-50">
            <Icons.check className="size-4" />
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
