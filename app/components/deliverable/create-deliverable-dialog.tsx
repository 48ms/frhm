"use client"

import { useAppForm } from "@/lib/form"
import { z } from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/animate-ui/components/radix/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { createDeliverable } from "@/features/deliverables/api/service"
import { deliverableQueries } from "@/features/deliverables/api/queries"
import { useActiveDashboard } from "@/components/dashboard-stitch/dashboard-data"

// Skema khusus form (tanpa clientId — diambil dari useActiveDashboard saat submit).
const deliverableFormSchema = z.object({
  type: z.enum(["brief", "content", "report"]),
  title: z.string().min(3, "Judul minimal 3 karakter").max(120, "Judul terlalu panjang"),
  content_md: z.string(),
  external_link: z.string().url("URL eksternal tidak valid").or(z.literal("")),
})

type DeliverableFormValues = z.infer<typeof deliverableFormSchema>

const DELIVERABLE_STARTER_PRESETS = [
  {
    type: "brief" as const,
    label: "📋 Creative Brief",
    title: "Creative Content Brief",
    content: "## 🎯 Tujuan Kampanye\nMeningkatkan awareness dan interaksi audiens target.\n\n## 👥 Target Audiens\nSegmen demografi utama dan permasalahan yang ingin diselesaikan.\n\n## 💡 Pesan Kunci\nPesan sentral yang wajib disampaikan secara konsisten.\n\n## 📦 Rincian Output\nDaftar materi, format, dan kanal distribusi.",
  },
  {
    type: "report" as const,
    label: "📊 Monthly Performance Report",
    title: "Laporan Performa Konten Bulanan",
    content: "## 📈 Ringkasan Metrik Utama\n- Total Reach / Tayangan:\n- Engagement Rate:\n- Top Performing Content:\n\n## 🔍 Evaluasi & Insight\nApa yang berhasil dan hal yang perlu ditingkatkan.\n\n## 🚀 Rekomendasi Langkah Bulan Depan\nStrategi dan penyesuaian pilar konten berikutnya.",
  },
  {
    type: "content" as const,
    label: "🎬 Video Production Sheet",
    title: "Lembar Produksi Video Pendek",
    content: "## 🎬 Hook 3-Detik Pertama\nVisual dan kalimat pembuka scroll-stopping.\n\n## 📜 Naskah Narasi / Audio\nTranskrip pembicaraan atau alur voiceover.\n\n## 🎥 Panduan Visual & B-Roll\nAdegan, transisi, dan demonstrasi produk.\n\n## 🎯 Call-to-Action (CTA)\nPenutup dan ajakan interaksi penonton.",
  },
]

export function CreateDeliverableDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { clientId } = useActiveDashboard()
  const queryClient = useQueryClient()

  const form = useAppForm({
    defaultValues: {
      type: "content",
      title: "",
      content_md: "",
      external_link: "",
    } as DeliverableFormValues,
    validators: {
      onSubmit: deliverableFormSchema,
    },
    onSubmit: async ({ value }) => {
      if (!clientId) {
        toast.error("Pilih klien aktif terlebih dahulu.")
        return
      }
      try {
        const created = await createDeliverable({
          clientId,
          type: value.type,
          title: value.title,
          content_md: value.content_md,
          external_link: value.external_link,
        })

        toast.success("Deliverable berhasil dibuat.", {
          description: `${created.title} ditambahkan sebagai draft untuk klien aktif.`,
        })

        // Invalidate agar list deliverables (ERP dashboard) langsung memuat ulang.
        queryClient.invalidateQueries({ queryKey: deliverableQueries.listByClient(clientId).queryKey })
        onOpenChange(false)
        form.reset()
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Gagal membuat deliverable.")
      }
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-card/95 backdrop-blur-2xl rounded-3xl border border-border/40 p-6 shadow-2xl space-y-6">
        <DialogHeader>
          <DialogTitle>Deliverable Baru</DialogTitle>
          <DialogDescription>
            Buat deliverable baru untuk klien aktif. Status awal selalu &quot;draft&quot;.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            void form.handleSubmit()
          }}
          className="space-y-5 px-1"
        >
          {/* Preset Template Chips */}
          <div className="space-y-1.5 p-3 rounded-xl bg-muted/40 border border-border/40">
            <span className="text-2xs font-bold text-muted-foreground uppercase tracking-wider block">
              Gunakan Starter Template Agensi:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {DELIVERABLE_STARTER_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    form.setFieldValue("type", p.type)
                    form.setFieldValue("title", p.title)
                    form.setFieldValue("content_md", p.content)
                    toast.info(`Template ${p.label} diterapkan.`)
                  }}
                  className="inline-flex items-center gap-1 text-2xs px-2.5 py-1 rounded-lg bg-card hover:bg-primary/10 hover:text-primary border border-border/40 text-foreground transition-all cursor-pointer font-semibold shadow-2xs"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <form.AppField
            name="type"
            children={(field) => (
              <field.SelectField
                label="Tipe Deliverable"
                description="Brief = panduan strategi, Content = materi konten, Report = laporan performa."
                options={[
                  { label: "Brief", value: "brief" },
                  { label: "Content", value: "content" },
                  { label: "Report", value: "report" },
                ]}
              />
            )}
          />

          <form.AppField
            name="title"
            children={(field) => (
              <field.TextField
                label="Judul"
                placeholder="Contoh: Konten Reels Ramadan Minggu 1"
                description="Minimal 3 karakter."
              />
            )}
          />

          <form.AppField
            name="content_md"
            children={(field) => (
              <field.TextareaField
                label="Konten Markdown"
                description="Opsional. Bisa diisi nanti lewat editor deliverable."
                placeholder="Tulis draf isi deliverable..."
              />
            )}
          />

          <form.AppField
            name="external_link"
            children={(field) => (
              <field.TextField
                label="Link Eksternal"
                description="Opsional. URL referensi (Google Docs, Figma, dsb)."
                placeholder="https://..."
              />
            )}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-full font-bold text-xs text-muted-foreground hover:bg-muted"
            >
              Batal
            </Button>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  disabled={!canSubmit}
                  isLoading={isSubmitting}
                  className="rounded-full font-bold text-xs bg-primary text-primary-foreground hover:bg-primary/90 px-5 shadow-xs"
                >
                  Buat Deliverable
                </Button>
              )}
            />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
