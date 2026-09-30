"use client"

import React, { useEffect, useState } from "react"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import {
  CAMPAIGN_CLIENTS,
  CAMPAIGN_TYPE_META,
  type Campaign,
  type CampaignType,
} from "./campaign-data"

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
  const [step, setStep] = useState<Step>("basics")
  const [name, setName] = useState("")
  const [clientId, setClientId] = useState(CAMPAIGN_CLIENTS[0].id)
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
    setClientId(editing?.clientId ?? CAMPAIGN_CLIENTS[0].id)
    setType(editing?.type ?? "campaign")
    setColor(editing?.color ?? COLOR_SWATCHES[0])
    setStartDate(editing?.startDate ?? "")
    setEndDate(editing?.endDate ?? "")
    setNotes(editing?.notes ?? "")
  }, [open, editing])

  if (!open) return null

  const client = CAMPAIGN_CLIENTS.find((c) => c.id === clientId) ?? CAMPAIGN_CLIENTS[0]
  const canContinue = name.trim().length > 0

  function save() {
    setSaving(true)
    setTimeout(() => {
      onSave({
        id: editing?.id ?? `cmp-${clientId}-${Date.now()}`,
        clientId,
        name: name.trim(),
        type,
        startDate: startDate || "2026-01-01",
        endDate: endDate || "2026-12-31",
        color,
        notes: notes.trim() || "-"
,
        reach: editing?.reach ?? "0",
        posts: editing?.posts ?? 0,
        progress: editing?.progress ?? 0,
      })
      setSaving(false)
      onClose()
    }, 900)
  }

  const steps: { id: Step; label: string }[] = [
    { id: "basics", label: "Basics" },
    { id: "schedule", label: "Schedule" },
    { id: "review", label: "Review" },
  ]

  return (
    <div className="fixed inset-0 z-50 p-4 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-[hsl(var(--admin-on-surface))]/40 backdrop-blur-md"
        onClick={saving ? undefined : onClose}
      />
      <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-2xl rounded-2xl border border-white/80 p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[hsl(var(--admin-outline-variant))]/30 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[hsl(var(--brand-accent))] text-[hsl(var(--brand-accent-foreground))] flex items-center justify-center">
              <Icons.campaign className="size-[18px]" />
            </div>
            <div>
              <h3 className="font-syne font-bold text-[hsl(var(--admin-on-surface))] text-sm">
                {editing ? "Edit Campaign" : "Create Campaign"}
              </h3>
              <p className="text-[10px] text-[hsl(var(--admin-outline))]">
                {editing ? "Update campaign details" : "Launch a new client campaign"}
              </p>
            </div>
          </div>
          <button
            className="p-1 rounded-full hover:bg-[hsl(var(--admin-surface-high))] text-[hsl(var(--admin-outline))] hover:text-[hsl(var(--admin-on-surface))] transition-all cursor-pointer"
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
                      ? "bg-[hsl(var(--admin-cobalt))] text-white"
                      : "bg-[hsl(var(--admin-surface-high))] text-[hsl(var(--admin-outline))]"
                  )}
                >
                  {i + 1}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wide",
                    step === s.id
                      ? "text-[hsl(var(--admin-on-surface))]"
                      : "text-[hsl(var(--admin-outline))]"
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className="flex-1 h-px bg-[hsl(var(--admin-outline-variant))]/40" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* STEP 1 , basics */}
        {step === "basics" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[hsl(var(--admin-on-surface))] mb-1">
                Campaign Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-[hsl(var(--admin-outline-variant))]/40 bg-[hsl(var(--admin-surface-low))] px-3 py-2 text-xs focus:border-[hsl(var(--admin-cobalt))] outline-none text-[hsl(var(--admin-on-surface))]"
                placeholder="e.g. Summer Drop 2026"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[hsl(var(--admin-on-surface))] mb-1">
                Client
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full rounded-xl border border-[hsl(var(--admin-outline-variant))]/40 bg-[hsl(var(--admin-surface-low))] px-3 py-2 text-xs focus:border-[hsl(var(--admin-cobalt))] outline-none text-[hsl(var(--admin-on-surface))]"
              >
                {CAMPAIGN_CLIENTS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[hsl(var(--admin-on-surface))] mb-1.5">
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
                        ? "bg-[hsl(var(--brand-accent))] text-[hsl(var(--brand-accent-foreground))] border-transparent"
                        : "border-[hsl(var(--admin-outline-variant))]/40 text-[hsl(var(--admin-on-surface))] hover:bg-[hsl(var(--admin-surface-low))]"
                    )}
                  >
                    {CAMPAIGN_TYPE_META[t].label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[hsl(var(--admin-on-surface))] mb-1.5">
                Accent Color
              </label>
              <div className="flex gap-2">
                {COLOR_SWATCHES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={cn(
                      "w-7 h-7 rounded-full transition-all cursor-pointer flex items-center justify-center",
                      color === c ? "ring-2 ring-offset-2 ring-[hsl(var(--admin-cobalt))]" : ""
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
                <label className="block text-xs font-semibold text-[hsl(var(--admin-on-surface))] mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-[hsl(var(--admin-outline-variant))]/40 bg-[hsl(var(--admin-surface-low))] px-3 py-2 text-xs focus:border-[hsl(var(--admin-cobalt))] outline-none text-[hsl(var(--admin-on-surface))]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[hsl(var(--admin-on-surface))] mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-[hsl(var(--admin-outline-variant))]/40 bg-[hsl(var(--admin-surface-low))] px-3 py-2 text-xs focus:border-[hsl(var(--admin-cobalt))] outline-none text-[hsl(var(--admin-on-surface))]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[hsl(var(--admin-on-surface))] mb-1">
                Notes / Objectives
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-[hsl(var(--admin-outline-variant))]/40 bg-[hsl(var(--admin-surface-low))] px-3 py-2 text-xs focus:border-[hsl(var(--admin-cobalt))] outline-none text-[hsl(var(--admin-on-surface))] resize-none"
                placeholder="Campaign objectives, target audience, key messages..."
              />
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-[hsl(var(--admin-surface-low))]/50 border border-[hsl(var(--admin-outline-variant))]/30">
              <Icons.info className="size-4 text-[hsl(var(--admin-cobalt))] shrink-0" />
              <span className="text-[10px] text-[hsl(var(--admin-outline))]">
                Leave dates empty for an evergreen campaign with no fixed end.
              </span>
            </div>
          </div>
        )}

        {/* STEP 3 , review */}
        {step === "review" && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[hsl(var(--admin-surface-low))]/60 border border-[hsl(var(--admin-outline-variant))]/30">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                style={{ backgroundColor: color }}
              >
                <Icons.campaign className="size-5 text-white" />
              </div>
              <div className="min-w-0">
                <span className="block text-sm font-bold text-[hsl(var(--admin-on-surface))] truncate">
                  {name || "Untitled Campaign"}
                </span>
                <span className="block text-[10px] text-[hsl(var(--admin-outline))]">
                  {client.name}
                </span>
              </div>
              <span className={cn("admin-badge shrink-0 ml-auto", CAMPAIGN_TYPE_META[type].badge)}>
                {CAMPAIGN_TYPE_META[type].label}
              </span>
            </div>

            <div className="space-y-2">
              {[
                { label: "Client", value: client.name },
                { label: "Type", value: CAMPAIGN_TYPE_META[type].label },
                { label: "Start", value: startDate || "-"
 },
                { label: "End", value: endDate || "Evergreen" },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between text-[11px] py-1.5 border-b border-[hsl(var(--admin-outline-variant))]/20 last:border-0"
                >
                  <span className="text-[hsl(var(--admin-outline))]">{row.label}</span>
                  <span className="font-semibold text-[hsl(var(--admin-on-surface))]">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {notes.trim() && (
              <div className="p-3 rounded-xl bg-[hsl(var(--admin-surface-low))]/50 border border-[hsl(var(--admin-outline-variant))]/30">
                <span className="block text-[10px] font-bold text-[hsl(var(--admin-outline))] uppercase tracking-wide mb-1">
                  Notes
                </span>
                <p className="text-[11px] text-[hsl(var(--admin-on-surface))]">{notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-2">
          {step === "basics" && (
            <>
              <button
                className="px-4 py-2 rounded-full text-xs font-semibold text-[hsl(var(--admin-on-surface))] hover:bg-[hsl(var(--admin-surface-high))] transition-all cursor-pointer"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                disabled={!canContinue}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[hsl(var(--admin-cobalt))] text-white text-xs font-bold shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:hover:scale-100"
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
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-[hsl(var(--admin-on-surface))] hover:bg-[hsl(var(--admin-surface-high))] transition-all cursor-pointer"
                onClick={() => setStep("basics")}
              >
                <Icons.arrowLeft className="size-4" />
                Back
              </button>
              <button
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[hsl(var(--admin-cobalt))] text-white text-xs font-bold shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
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
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-[hsl(var(--admin-on-surface))] hover:bg-[hsl(var(--admin-surface-high))] transition-all cursor-pointer"
                onClick={() => setStep("schedule")}
              >
                <Icons.arrowLeft className="size-4" />
                Back
              </button>
              <button
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[hsl(var(--brand-accent))] text-[hsl(var(--brand-accent-foreground))] text-xs font-bold shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-60 disabled:hover:scale-100"
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
