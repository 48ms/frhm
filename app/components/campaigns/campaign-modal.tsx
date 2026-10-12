"use client"

import React, { useEffect, useState } from "react"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import {
  CAMPAIGN_TYPE_META,
  type CampaignType,
} from "./campaign-data"
import type { Campaign } from "@/features/campaigns/api/types"
import { useActiveDashboard } from "@/components/dashboard-stitch/dashboard-data"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/animate-ui/components/radix/dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/animate-ui/components/radix/dropdown-menu"

type Step = "basics" | "schedule" | "review"

/**
 * Campaign color swatches from the logo palette (DESIGN.md §2), plus one
 * neutral slot for overflow. No more random hex values.
 */
const COLOR_SWATCHES = ["#0060E0", "#209060", "#F0B010", "#F03020", "#1D1D1F"]

export function CampaignModal({
  open,
  onClose,
  editing,
  onSave,
}: {
  open: boolean
  onClose: () => void
  editing?: Campaign | null
  onSave: (c: Campaign) => void
}) {
  const { clients, clientId: activeDashboardClient } = useActiveDashboard()
  
  const [step, setStep] = useState<Step>("basics")
  const [name, setName] = useState("")
  const [clientId, setClientId] = useState(activeDashboardClient)
  const [type, setType] = useState<CampaignType>("campaign")
  const [color, setColor] = useState(COLOR_SWATCHES[0])
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

  // Hydrate the form each time the modal opens (create vs edit).
  useEffect(() => {
    if (!open) return
    setStep("basics")
    setSaving(false)
    setName(editing?.name ?? "")
    setClientId(editing?.client_id ?? activeDashboardClient)
    setType((editing?.type as CampaignType) ?? "campaign")
    setColor(editing?.color ?? COLOR_SWATCHES[0])
    setStartDate(editing?.start_date ?? "")
    setEndDate(editing?.end_date ?? "")
    setNotes(editing?.notes ?? "")
  }, [open, editing, activeDashboardClient])

  if (!open) return null

  const canContinue = name.trim().length > 0

  function save() {
    setSaving(true)
    // Tidak pakai setTimeout, karena handleSave luar asinkron & men-dismiss toast.
    onSave({
      id: editing?.id ?? "", // akan digenerate DB
      client_id: clientId,
      name: name.trim(),
      type,
      start_date: startDate || null,
      end_date: endDate || null,
      color,
      notes: notes.trim() || null,
      created_at: editing?.created_at ?? "",
    })
    setSaving(false)
    onClose()
  }

  const steps: { id: Step; label: string }[] = [
    { id: "basics", label: "Basics" },
    { id: "schedule", label: "Schedule" },
    { id: "review", label: "Review" },
  ]

  return (
    <Dialog open={open} onOpenChange={(val) => !val && !saving && onClose()}>
      <DialogContent 
        className="max-w-lg bg-card/95 backdrop-blur-2xl rounded-3xl border border-border/40 p-6 shadow-2xl space-y-6"
        style={{ viewTransitionName: editing ? `campaign-${editing.id}` : 'campaign-new' } as React.CSSProperties}
      >
        <DialogHeader className="flex flex-row items-center gap-2 border-b border-border/40 pb-3 space-y-0 text-left">
          <div className="w-8 h-8 rounded-full bg-brand-accent text-brand-accent-foreground flex items-center justify-center shrink-0">
            <Icons.campaign className="size-[18px]" />
          </div>
          <div>
            <DialogTitle className="font-sans font-bold text-foreground text-sm">
              {editing ? "Edit Campaign" : "Create Campaign"}
            </DialogTitle>
            <DialogDescription className="text-2xs text-muted-foreground">
              {editing ? "Update campaign details" : "Launch a new client campaign"}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Step rail */}
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <React.Fragment key={s.id}>
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-2xs font-bold transition-colors",
                    step === s.id
                      ? "bg-brand-accent text-brand-accent-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {i + 1}
                </span>
                <span
                  className={cn(
                    "text-2xs font-bold",
                    step === s.id
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 h-px bg-border/40" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* STEP 1 , basics */}
        {step === "basics" && (
          <div className="space-y-4">
            <div>
              <label htmlFor="campaign-name" className="block text-xs font-semibold text-foreground mb-1">
                Campaign Name
              </label>
              <input
                id="campaign-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-border/40 bg-muted px-3 py-2 text-xs focus:border-brand-accent outline-none text-foreground"
                placeholder="e.g. Summer Drop 2026"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="campaign-client" className="block text-xs font-semibold text-foreground mb-1">
                Client
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    id="campaign-client"
                    className="w-full flex items-center justify-between rounded-xl border border-border/40 bg-muted px-3 py-2 text-xs hover:border-brand-accent focus:border-brand-accent outline-none text-foreground transition-colors cursor-pointer h-auto"
                  >
                    <span>{clients.find((c) => c.id === clientId)?.name ?? "Pilih Client"}</span>
                    <Icons.chevronDown className="size-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[calc(100vw-4rem)] sm:w-80 max-h-60 overflow-y-auto">
                  {clients.map((c) => (
                    <DropdownMenuItem key={c.id} onClick={() => setClientId(c.id)}>
                      {c.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Campaign Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(CAMPAIGN_TYPE_META) as CampaignType[]).map((t) => (
                  <Button
                    key={t}
                    type="button"
                    variant={type === t ? "default" : "outline"}
                    size="sm"
                    onClick={() => setType(t)}
                    className={cn(
                      "py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer h-auto",
                      type === t
                        ? "bg-brand-accent text-brand-accent-foreground border-transparent hover:bg-brand-accent/90"
                        : "border-border/40 text-foreground hover:bg-muted"
                    )}
                  >
                    {CAMPAIGN_TYPE_META[t].label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Accent Color
              </label>
              <div className="flex gap-2">
                {COLOR_SWATCHES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={cn(
                      "w-7 h-7 rounded-full transition-all cursor-pointer flex items-center justify-center",
                      color === c ? "ring-2 ring-offset-2 ring-brand-accent" : ""
                    )}
                    style={{ backgroundColor: c }}
                    aria-label={`Color ${c}`}
                  >
                    {color === c && <Icons.check className="size-3.5 text-white" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 , schedule */}
        {step === "schedule" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="campaign-start" className="block text-xs font-semibold text-foreground mb-1">
                  Start Date
                </label>
                <input
                  id="campaign-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-border/40 bg-muted px-3 py-2 text-xs focus:border-brand-accent outline-none text-foreground"
                />
              </div>
              <div>
                <label htmlFor="campaign-end" className="block text-xs font-semibold text-foreground mb-1">
                  End Date
                </label>
                <input
                  id="campaign-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-border/40 bg-muted px-3 py-2 text-xs focus:border-brand-accent outline-none text-foreground"
                />
              </div>
            </div>

            <div>
              <label htmlFor="campaign-notes" className="block text-xs font-semibold text-foreground mb-1">
                Notes / Objectives
              </label>
              <textarea
                id="campaign-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-border/40 bg-muted px-3 py-2 text-xs focus:border-brand-accent outline-none text-foreground resize-none"
                placeholder="Campaign objectives, target audience, key messages..."
              />
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border border-border/40">
              <Icons.info className="size-4 text-brand-accent shrink-0" />
              <span className="text-2xs text-muted-foreground">
                Leave dates empty for an evergreen campaign with no fixed end.
              </span>
            </div>
          </div>
        )}

        {/* STEP 3 , review */}
        {step === "review" && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/60 border border-border/40">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                style={{ backgroundColor: color }}
              >
                <Icons.campaign className="size-5 text-white" />
              </div>
              <div className="min-w-0">
                <span className="block text-sm font-bold text-foreground truncate">
                  {name || "Untitled Campaign"}
                </span>
                <span className="block text-2xs text-muted-foreground">
                  {clients.find((c) => c.id === clientId)?.name ?? "Unknown"}
                </span>
              </div>
              <span className={cn("admin-badge shrink-0 ml-auto", CAMPAIGN_TYPE_META[type].badge)}>
                {CAMPAIGN_TYPE_META[type].label}
              </span>
            </div>

            <div className="space-y-2">
              {[
                { label: "Client", value: clients.find((c) => c.id === clientId)?.name ?? "Unknown" },
                { label: "Type", value: CAMPAIGN_TYPE_META[type].label },
                { label: "Start", value: startDate || "-" },
                { label: "End", value: endDate || "Evergreen" },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between text-1xs py-1.5 border-b border-border/20 last:border-0"
                >
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-semibold text-foreground">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {notes.trim() && (
              <div className="p-3 rounded-xl bg-muted/50 border border-border/40">
                <span className="block text-2xs font-bold text-muted-foreground mb-1">
                  Notes
                </span>
                <p className="text-1xs text-foreground">{notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-2">
          {step === "basics" && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-full text-xs font-semibold"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!canContinue}
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-accent text-brand-accent-foreground text-xs font-bold shadow-sm"
                onClick={() => setStep("schedule")}
              >
                Continue
                <Icons.arrowRight className="size-4" />
              </Button>
            </>
          )}

          {step === "schedule" && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="inline-flex items-center gap-1.5 rounded-full text-xs font-semibold"
                onClick={() => setStep("basics")}
              >
                <Icons.arrowLeft className="size-4" />
                Back
              </Button>
              <Button
                type="button"
                size="sm"
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-accent text-brand-accent-foreground text-xs font-bold shadow-sm"
                onClick={() => setStep("review")}
              >
                Review
                <Icons.arrowRight className="size-4" />
              </Button>
            </>
          )}

          {step === "review" && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="inline-flex items-center gap-1.5 rounded-full text-xs font-semibold"
                onClick={() => setStep("schedule")}
              >
                <Icons.arrowLeft className="size-4" />
                Back
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={saving}
                isLoading={saving}
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-accent text-brand-accent-foreground text-xs font-bold shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                onClick={save}
              >
                <Icons.check className="size-4" />
                {editing ? "Save Changes" : "Create Campaign"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
