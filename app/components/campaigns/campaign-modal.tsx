"use client"

import React, { useEffect, useState } from "react"
import { z } from "zod"
import { toast } from "sonner"
import { useStore } from "@tanstack/react-form"
import { useAppForm } from "@/lib/form"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import {
  CAMPAIGN_TYPE_META,
  type CampaignType,
} from "./campaign-data"
import type { Campaign } from "@/features/campaigns/api/types"
import { useActiveDashboard } from "@/components/dashboard-stitch/dashboard-data"
import { useGenerateContentIdeas } from "@/features/copilot/api/queries"
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
 * neutral slot for overflow.
 */
const COLOR_SWATCHES = ["#0060E0", "#209060", "#F0B010", "#F03020", "#1D1D1F"]

const STARTER_PRESETS: {
  label: string
  name: string
  type: CampaignType
  color: string
}[] = [
  { label: "⚡ Payday Promo", name: "Payday Promo", type: "promo", color: "#F03020" },
  { label: "🚀 Product Launch", name: "Peluncuran Produk Baru", type: "campaign", color: "#0060E0" },
  { label: "🎉 Weekend Sale", name: "Weekend Flash Sale", type: "promo", color: "#F0B010" },
  { label: "⭐ Social Proof", name: "Social Proof & Testimonial Series", type: "campaign", color: "#209060" },
]

const OBJECTIVE_CHIPS = [
  { label: "🎯 Reach & Awareness", text: "Tingkatkan reach dan brand awareness ke audiens baru." },
  { label: "🛍️ Konversi & Promo", text: "Dorong konversi dan transaksi selama periode penawaran." },
  { label: "💬 Interaksi Komunitas", text: "Tingkatkan interaksi, komentar, dan sharing dari followers aktif." },
  { label: "🌟 Edukasi & Otoritas", text: "Edukasi audiens mengenai keunggulan produk dan positioning brand." },
]

const DURATION_PRESETS = [
  { label: "⚡ 1 Minggu (7h)", days: 7 },
  { label: "🗓️ 2 Minggu (14h)", days: 14 },
  { label: "📊 1 Bulan (30h)", days: 30 },
  { label: "♾️ Evergreen", days: null },
]

const campaignFormSchema = z.object({
  name: z.string().trim().min(1, "Nama campaign wajib diisi").max(100, "Nama campaign maksimal 100 karakter"),
  clientId: z.string().min(1, "Pilih client terlebih dahulu"),
  type: z.enum(["campaign", "promo", "event"] as const),
  color: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
  notes: z.string(),
})

type CampaignFormValues = z.infer<typeof campaignFormSchema>

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
  const [saving, setSaving] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])

  const { mutateAsync: generateIdeasMutate, isPending: isGeneratingIdeas } = useGenerateContentIdeas()

  const handleApplyPreset = (preset: typeof STARTER_PRESETS[number]) => {
    if (!form.state.values.name || form.state.values.name.trim() === "") {
      form.setFieldValue("name", preset.name)
    }
    form.setFieldValue("type", preset.type)
    form.setFieldValue("color", preset.color)
    toast.success(`Template ${preset.label} diterapkan!`)
  }

  const handleApplyDuration = (days: number | null) => {
    const today = new Date().toISOString().split("T")[0]
    form.setFieldValue("startDate", today)
    if (days === null) {
      form.setFieldValue("endDate", "")
      toast.success("Durasi disetel ke Evergreen (tanpa batas akhir)")
    } else {
      const end = new Date(Date.now() + days * 86400000).toISOString().split("T")[0]
      form.setFieldValue("endDate", end)
      toast.success(`Durasi disetel ke ${days} hari`)
    }
  }

  const handleAddObjective = (text: string) => {
    const current = form.state.values.notes || ""
    const prefix = current.trim().length > 0 ? `${current.trim()}\n• ` : "• "
    form.setFieldValue("notes", `${prefix}${text}`)
  }

  const handleGenerateAiAngles = async () => {
    const currentValues = form.state.values
    if (!currentValues.clientId) {
      toast.error("Pilih client terlebih dahulu")
      return
    }
    const topic = currentValues.name.trim() || "Kampanye Digital Marketing"
    const toastId = toast.loading("Meracik rekomendasi sudut pandang kampanye...")
    try {
      const res = await generateIdeasMutate({
        clientId: currentValues.clientId,
        count: 3,
        trendOrTopic: `${topic} (${CAMPAIGN_TYPE_META[currentValues.type].label})`,
      })
      toast.dismiss(toastId)
      if (res.ideas && res.ideas.length > 0) {
        const angles = res.ideas.map((i) => `${i.title}: ${i.content}`)
        setAiSuggestions(angles)
        toast.success(`${res.ideas.length} sudut pandang kampanye siap dipilih!`)
      } else {
        toast.error("Gagal mendapatkan rekomendasi AI.")
      }
    } catch {
      toast.dismiss(toastId)
      toast.error("Terjadi kendala saat meracik sudut pandang.")
    }
  }

  const handleSelectAngle = (angle: string) => {
    const current = form.state.values.notes || ""
    const prefix = current.trim().length > 0 ? `${current.trim()}\n• ` : "• "
    form.setFieldValue("notes", `${prefix}${angle}`)
    toast.success("Sudut pandang disisipkan ke catatan!")
  }

  const form = useAppForm({
    defaultValues: {
      name: editing?.name ?? "",
      clientId: editing?.client_id ?? activeDashboardClient,
      type: (editing?.type as CampaignType) ?? "campaign",
      color: editing?.color ?? COLOR_SWATCHES[0],
      startDate: editing?.start_date ?? "",
      endDate: editing?.end_date ?? "",
      notes: editing?.notes ?? "",
    } as CampaignFormValues,
    validators: {
      onSubmit: campaignFormSchema,
    },
    onSubmit: async ({ value }) => {
      setSaving(true)
      onSave({
        id: editing?.id ?? "",
        client_id: value.clientId,
        name: value.name.trim(),
        type: value.type,
        start_date: value.startDate || null,
        end_date: value.endDate || null,
        color: value.color,
        notes: value.notes.trim() || null,
        created_at: editing?.created_at ?? "",
      })
      setSaving(false)
      onClose()
    },
  })

  // Hydrate the form each time the modal opens (create vs edit).
  useEffect(() => {
    if (!open) return
    setStep("basics")
    setSaving(false)
    setAiSuggestions([])
    form.reset({
      name: editing?.name ?? "",
      clientId: editing?.client_id ?? activeDashboardClient,
      type: (editing?.type as CampaignType) ?? "campaign",
      color: editing?.color ?? COLOR_SWATCHES[0],
      startDate: editing?.start_date ?? "",
      endDate: editing?.end_date ?? "",
      notes: editing?.notes ?? "",
    })
  }, [open, editing, activeDashboardClient])

  const formValues = useStore(form.store, (state) => state.values)
  const canContinue = formValues.name.trim().length > 0

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
            <form.AppField
              name="name"
              children={(field) => (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="campaign-name" className="block text-xs font-semibold text-foreground">
                      Campaign Name
                    </label>
                    <span className="text-2xs text-muted-foreground">Template Cepat</span>
                  </div>
                  <input
                    id="campaign-name"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full rounded-xl border border-border/40 bg-muted px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 text-foreground"
                    placeholder="e.g. Summer Drop 2026"
                    autoFocus
                  />
                  {field.state.meta.errors?.[0] && (
                    <p className="text-2xs text-destructive mt-1">
                      {typeof field.state.meta.errors[0] === "string"
                        ? field.state.meta.errors[0]
                        : (field.state.meta.errors[0] as { message?: string })?.message ?? String(field.state.meta.errors[0])}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {STARTER_PRESETS.map((p) => (
                      <Button
                        key={p.label}
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleApplyPreset(p)}
                        className="text-2xs px-2.5 py-1 rounded-full bg-muted/80 hover:bg-muted border border-border/40 hover:border-brand-accent/50 text-foreground transition-all cursor-pointer h-auto font-medium"
                      >
                        {p.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            />

            <form.AppField
              name="clientId"
              children={(field) => (
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
                        className="w-full flex items-center justify-between rounded-xl border border-border/40 bg-muted px-3 py-2 text-xs hover:border-brand-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 text-foreground transition-colors cursor-pointer h-auto"
                      >
                        <span>{clients.find((c) => c.id === field.state.value)?.name ?? "Pilih Client"}</span>
                        <Icons.chevronDown className="size-3 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[calc(100vw-4rem)] sm:w-80 max-h-60 overflow-y-auto">
                      {clients.map((c) => (
                        <DropdownMenuItem key={c.id} onClick={() => field.handleChange(c.id)}>
                          {c.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            />

            <form.AppField
              name="type"
              children={(field) => (
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Campaign Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(CAMPAIGN_TYPE_META) as CampaignType[]).map((t) => (
                      <Button
                        key={t}
                        type="button"
                        variant={field.state.value === t ? "default" : "outline"}
                        size="sm"
                        onClick={() => field.handleChange(t)}
                        className={cn(
                          "py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer h-auto",
                          field.state.value === t
                            ? "bg-brand-accent text-brand-accent-foreground border-transparent hover:bg-brand-accent/90"
                            : "border-border/40 text-foreground hover:bg-muted"
                        )}
                      >
                        {CAMPAIGN_TYPE_META[t].label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            />

            <form.AppField
              name="color"
              children={(field) => (
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Accent Color
                  </label>
                  <div className="flex gap-2">
                    {COLOR_SWATCHES.map((c) => (
                      <Button
                        key={c}
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => field.handleChange(c)}
                        className={cn(
                          "w-7 h-7 rounded-full p-0 transition-all cursor-pointer flex items-center justify-center hover:opacity-90",
                          field.state.value === c ? "ring-2 ring-offset-2 ring-brand-accent" : ""
                        )}
                        style={{ backgroundColor: c }}
                        aria-label={`Color ${c}`}
                      >
                        {field.state.value === c && <Icons.check className="size-3.5 text-white" />}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            />
          </div>
        )}

        {/* STEP 2 , schedule */}
        {step === "schedule" && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-foreground">Jadwal Cepat</span>
                <span className="text-2xs text-muted-foreground">Pilih durasi siap pakai</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {DURATION_PRESETS.map((dp) => (
                  <Button
                    key={dp.label}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleApplyDuration(dp.days)}
                    className="text-2xs px-2.5 py-1 rounded-full bg-muted/80 hover:bg-muted border border-border/40 hover:border-brand-accent/50 text-foreground transition-all cursor-pointer h-auto font-medium"
                  >
                    {dp.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <form.AppField
                name="startDate"
                children={(field) => (
                  <div>
                    <label htmlFor="campaign-start" className="block text-xs font-semibold text-foreground mb-1">
                      Start Date
                    </label>
                    <input
                      id="campaign-start"
                      type="date"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full rounded-xl border border-border/40 bg-muted px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 text-foreground"
                    />
                  </div>
                )}
              />
              <form.AppField
                name="endDate"
                children={(field) => (
                  <div>
                    <label htmlFor="campaign-end" className="block text-xs font-semibold text-foreground mb-1">
                      End Date
                    </label>
                    <input
                      id="campaign-end"
                      type="date"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full rounded-xl border border-border/40 bg-muted px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 text-foreground"
                    />
                  </div>
                )}
              />
            </div>

            <form.AppField
              name="notes"
              children={(field) => (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="campaign-notes" className="block text-xs font-semibold text-foreground">
                      Notes / Objectives
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      isLoading={isGeneratingIdeas}
                      onClick={handleGenerateAiAngles}
                      className="h-auto p-0 text-2xs font-bold text-secondary hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Icons.sparkles className="size-3 text-secondary" />
                      ✨ AI Campaign Angles
                    </Button>
                  </div>
                  <textarea
                    id="campaign-notes"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-border/40 bg-muted px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 text-foreground resize-none"
                    placeholder="Campaign objectives, target audience, key messages..."
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {OBJECTIVE_CHIPS.map((chip) => (
                      <Button
                        key={chip.label}
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddObjective(chip.text)}
                        className="text-2xs px-2.5 py-1 rounded-full bg-muted/80 hover:bg-muted border border-border/40 hover:border-brand-accent/50 text-foreground transition-all cursor-pointer h-auto font-medium"
                      >
                        {chip.label}
                      </Button>
                    ))}
                  </div>

                  {aiSuggestions.length > 0 && (
                    <div className="mt-3 p-2.5 rounded-xl bg-brand-accent/5 border border-brand-accent/20 space-y-2">
                      <span className="block text-2xs font-bold text-foreground">
                        💡 Rekomendasi Sudut Pandang AI (klik untuk menyisipkan):
                      </span>
                      <div className="space-y-1.5">
                        {aiSuggestions.map((angle, idx) => (
                          <Button
                            key={idx}
                            type="button"
                            variant="ghost"
                            onClick={() => handleSelectAngle(angle)}
                            className="w-full text-left justify-start p-2 rounded-lg bg-card/80 hover:bg-card border border-border/40 hover:border-brand-accent text-2xs text-foreground transition-all cursor-pointer flex items-start gap-1.5 h-auto whitespace-normal"
                          >
                            <Icons.check className="size-3 text-brand-accent shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{angle}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            />

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
          <div className="space-y-4">
            <div 
              className="p-4 rounded-2xl border border-border/40 relative overflow-hidden bg-gradient-to-br from-card via-card to-muted/40 shadow-sm"
              style={{
                borderLeftWidth: "4px",
                borderLeftColor: formValues.color,
              }}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm text-white"
                    style={{ backgroundColor: formValues.color }}
                  >
                    <Icons.campaign className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground leading-tight">
                      {formValues.name || "Untitled Campaign"}
                    </h4>
                    <p className="text-2xs text-muted-foreground mt-0.5">
                      {clients.find((c) => c.id === formValues.clientId)?.name ?? "Pilih Client"}
                    </p>
                  </div>
                </div>
                <span className={cn("admin-badge text-2xs font-bold shrink-0", CAMPAIGN_TYPE_META[formValues.type].badge)}>
                  {CAMPAIGN_TYPE_META[formValues.type].label}
                </span>
              </div>

              {/* Timeline pill */}
              <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/50 border border-border/20 text-2xs text-muted-foreground mb-3">
                <Icons.calendar className="size-3.5 text-brand-accent shrink-0" />
                <span className="font-semibold text-foreground">
                  {formValues.startDate || "Langsung"}
                </span>
                <span>➔</span>
                <span className="font-semibold text-foreground">
                  {formValues.endDate || "Evergreen (Tanpa Batas)"}
                </span>
              </div>

              {formValues.notes.trim() ? (
                <div className="p-2.5 rounded-xl bg-background/60 border border-border/30">
                  <span className="block text-2xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Catatan & Sudut Pandang
                  </span>
                  <p className="text-2xs text-foreground whitespace-pre-line leading-relaxed">
                    {formValues.notes}
                  </p>
                </div>
              ) : (
                <p className="text-2xs text-muted-foreground italic">
                  Tanpa catatan khusus. Anda bisa menambahkan konten langsung ke kampanye ini.
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/40 border border-border/40 text-2xs text-muted-foreground">
              <Icons.sparkles className="size-4 text-brand-accent shrink-0" />
              <span>
                Kampanye siap diaktifkan! Setelah disimpan, Anda dapat mengelompokkan konten kalender dan mengukur performanya.
              </span>
            </div>
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
                onClick={() => void form.handleSubmit()}
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
