"use client"

import { useAppForm } from "@/lib/form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { createDeliverable, createDeliverableSchema } from "@/features/deliverables/api/service"
import { deliverableQueries } from "@/features/deliverables/api/queries"
import { useActiveDashboard } from "@/components/dashboard-stitch/dashboard-data"

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
      type: "content" as const,
      title: "",
      content_md: "",
      external_link: "",
    },
    validators: {
      onSubmit: createDeliverableSchema,
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
        toast.error("Gagal membuat deliverable.")
        console.error(err)
      }
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
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
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-5 py-2.5 rounded-full font-bold text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              Batal
            </button>
            <form.SubmitButton disabled={false}>
              Buat Deliverable
            </form.SubmitButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
