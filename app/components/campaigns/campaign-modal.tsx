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

type Step = "basics" | "schedule" | "review"

const COLOR_SWATCHES = ["#4353FF", "#7D3AC0", "#059669", "#D97706", "#1A1B22", "#DC2626"]

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
    <div className="fixed inset-0 z-50 p-4 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-md animate-in fade-in duration-300"
        onClick={saving ? undefined : onClose}
      />
      <div className="relative w-full max-w-lg bg-card/95 backdrop-blur-2xl rounded-2xl border border-border/40 p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-accent text-brand-accent-foreground flex items-center justify-center">
              <Icons.campaign className="size-[18px]" />
            </div>
            <div>
              <h3 className="font-syne font-bold text-foreground text-sm">
                {editing ? "Edit Campaign" : "Create Campaign"}
              </h3>
              <p className="text-[10px] text-muted-foreground">
                {editing ? "Update campaign details" : "Launch a new client campaign"}
              </p>
            </div>
          </div>
          <button
            className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            onClick={onClose}
          >
            <Icons.close className="size-[18px]" />
          </button>
        </div>

        {/* Step rail */}
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <React.Fragment key={s.id}>
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors",
                    step === s.id
                      ? "bg-brand-accent text-brand-accent-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {i + 1}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wide",
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
              <label className="block text-xs font-semibold text-foreground mb-1">
                Campaign Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-border/40 bg-muted px-3 py-2 text-xs focus:border-brand-accent outline-none text-foreground"
                placeholder="e.g. Summer Drop 2026"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Client
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full rounded-xl border border-border/40 bg-muted px-3 py-2 text-xs focus:border-brand-accent outline-none text-foreground"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Campaign Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(CAMPAIGN_TYPE_META) as CampaignType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={cn(
                      "py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer",
                      type === t
                        ? "bg-brand-accent text-brand-accent-foreground border-transparent"
                        : "border-border/40 text-foreground hover:bg-muted"
                    )}
                  >
                    {CAMPAIGN_TYPE_META[t].label}
                  </button>
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
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-border/40 bg-muted px-3 py-2 text-xs focus:border-brand-accent outline-none text-foreground"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-border/40 bg-muted px-3 py-2 text-xs focus:border-brand-accent outline-none text-foreground"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Notes / Objectives
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-border/40 bg-muted px-3 py-2 text-xs focus:border-brand-accent outline-none text-foreground resize-none"
                placeholder="Campaign objectives, target audience, key messages..."
              />
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border border-border/40">
              <Icons.info className="size-4 text-brand-accent shrink-0" />
              <span className="text-[10px] text-muted-foreground">
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
                <span className="block text-[10px] text-muted-foreground">
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
                  className="flex items-center justify-between text-[11px] py-1.5 border-b border-border/20 last:border-0"
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
                <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">
                  Notes
                </span>
                <p className="text-[11px] text-foreground">{notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-2">
          {step === "basics" && (
            <>
              <button
                className="px-4 py-2 rounded-full text-xs font-semibold text-foreground hover:bg-muted transition-all cursor-pointer"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                disabled={!canContinue}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-accent text-brand-accent-foreground text-xs font-bold shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:hover:scale-100"
                onClick={() => setStep("schedule")}
              >
                Continue
                <Icons.arrowRight className="size-4" />
              </button>
            </>
          )}

          {step === "schedule" && (
            <>
              <button
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-foreground hover:bg-muted transition-all cursor-pointer"
                onClick={() => setStep("basics")}
              >
                <Icons.arrowLeft className="size-4" />
                Back
              </button>
              <button
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-accent text-brand-accent-foreground text-xs font-bold shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                onClick={() => setStep("review")}
              >
                Review
                <Icons.arrowRight className="size-4" />
              </button>
            </>
          )}

          {step === "review" && (
            <>
              <button
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-foreground hover:bg-muted transition-all cursor-pointer"
                onClick={() => setStep("schedule")}
              >
                <Icons.arrowLeft className="size-4" />
                Back
              </button>
              <button
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-accent text-brand-accent-foreground text-xs font-bold shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-60 disabled:hover:scale-100"
                onClick={save}
              >
                {saving ? (
                  <>
                    <Icons.refresh className="size-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Icons.check className="size-4" />
                    {editing ? "Save Changes" : "Create Campaign"}
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
