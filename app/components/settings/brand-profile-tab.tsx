"use client"

import * as React from "react"
import { useAppForm } from "@/lib/form"
import { BrandProfileSchema } from "@/features/social-accounts/api/types"
import { useUpdateBrandProfile, useGenerateBrandProfile } from "@/features/social-accounts/api/queries"
import { useActiveDashboard } from "@/components/dashboard-stitch/dashboard-data"
import { toast } from "sonner"
import { Icons } from "@/components/icons"
import { Textarea } from "@/components/ui/textarea"
import type { BrandProfile } from "@/features/social-accounts/api/types"

export function BrandProfileTab() {
  const { clientId, client } = useActiveDashboard()
  const { mutateAsync: updateProfile } = useUpdateBrandProfile()
  const { mutateAsync: generateProfile, isPending: isGenerating } = useGenerateBrandProfile()

  const [aiPanelOpen, setAiPanelOpen] = React.useState(false)
  const [rawMaterial, setRawMaterial] = React.useState("")
  const [industry, setIndustry] = React.useState("")
  
  // Ambil profil yang ada (jika ada) atau default kosong
  const bp = client?.brand_profile as Partial<BrandProfile> | undefined
  const defaultValues: BrandProfile = {
    who: bp?.who || "",
    audience: bp?.audience || "",
    voice: bp?.voice || "",
    pov: bp?.pov || "",
    proof: bp?.proof || "",
    guardrails: bp?.guardrails || "",
    pillars: bp?.pillars || [],
  }

  const form = useAppForm({
    defaultValues,
    validators: {
      onSubmit: BrandProfileSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await updateProfile({ clientId, profile: value })
        toast.success("Brand Profile berhasil diperbarui.")
      } catch (err: unknown) {
        toast.error("Gagal menyimpan Brand Profile.")
        console.error(err)
      }
    },
  })

  const handleGenerateAI = async () => {
    if (!rawMaterial) {
      toast.error("Mohon masukkan materi mentah (teks About Us, dsb).")
      return
    }
    try {
      const res = await generateProfile({ rawMaterial, industry })
      if (res.error) {
        toast.error(res.error)
      } else if (res.profile) {
        // Set form values
        form.setFieldValue("who", res.profile.who)
        form.setFieldValue("audience", res.profile.audience)
        form.setFieldValue("voice", res.profile.voice)
        form.setFieldValue("pov", res.profile.pov)
        form.setFieldValue("proof", res.profile.proof)
        form.setFieldValue("guardrails", res.profile.guardrails)
        form.setFieldValue("pillars", res.profile.pillars)
        toast.success("Brand DNA terbentuk", {
          description: "Copilot telah mengisi Identity, Tone, dan Guardrails. Silakan tinjau dan simpan."
        })
        setAiPanelOpen(false)
      }
    } catch (err) {
      toast.error("Gagal melakukan ekstraksi AI.")
    }
  }

  return (
    <div className="space-y-8">
      <div className="admin-card border-none bg-card p-8 shadow-sm">
        <div className="flex items-start justify-between border-b border-border/60 pb-5 mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Identitas & Brand Profile</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Atur pedoman merek, gaya bahasa (Tone of Voice), dan panduan untuk AI / Tim Kreatif saat membuat konten untuk klien ini.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            {client?.name || "Client"}
          </span>
        </div>

        <div className="mb-8">
          {!aiPanelOpen ? (
            <button 
              onClick={() => setAiPanelOpen(true)}
              className="w-full py-4 border-2 border-dashed border-brand-accent/20 rounded-xl bg-brand-accent/5 text-brand-accent hover:bg-brand-accent/10 transition-colors flex items-center justify-center gap-2 font-bold"
            >
              <Icons.sparkles className="size-5" />
              Gunakan AI untuk Ekstrak Brand DNA
            </button>
          ) : (
            <div className="p-6 rounded-2xl bg-brand-accent/5 border border-brand-accent/20">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-brand-accent flex items-center gap-2">
                  <Icons.sparkles className="size-4 text-brand-accent" />
                  AI Brand DNA Extractor
                </h4>
                <button onClick={() => setAiPanelOpen(false)} className="text-muted-foreground hover:text-brand-accent">
                  Tutup
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Paste teks dari website, profil perusahaan, atau kumpulan post lama. AI akan merumuskan Voice, POV, dan Guardrails secara otomatis sesuai standar Social Media.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-brand-accent block mb-1">Industri / Kategori (Opsional)</label>
                  <input 
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border/40 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    placeholder="Contoh: B2B SaaS, F&B Artisan, dsb."
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-brand-accent block mb-1">Materi Mentah (Raw Material)</label>
                  <Textarea 
                    className="w-full min-h-[120px] bg-background border border-border/40"
                    placeholder="Paste about us, visi misi, atau contoh konten..."
                    value={rawMaterial}
                    onChange={(e) => setRawMaterial(e.target.value)}
                  />
                </div>
                <div className="flex justify-end">
                  <button 
                    onClick={handleGenerateAI}
                    disabled={isGenerating || !rawMaterial}
                    className="px-4 py-2 bg-brand-accent hover:bg-brand-accent/90 text-brand-accent-foreground text-sm font-bold rounded-lg flex items-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {isGenerating ? <Icons.spinner className="size-4 animate-spin" /> : <Icons.sparkles className="size-4" />}
                    Mulai Ekstraksi
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            void form.handleSubmit()
          }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <form.AppField
                name="who"
                children={(field) => (
                  <field.TextareaField
                    label="Siapa Kami? (Who)"
                    description="Penjelasan singkat tentang entitas, nilai-nilai, dan apa yang ditawarkan oleh klien ini."
                    placeholder="Contoh: Kami adalah kafe artisan yang mengutamakan bahan lokal..."
                  />
                )}
              />

              <form.AppField
                name="audience"
                children={(field) => (
                  <field.TextareaField
                    label="Target Audiens (Audience)"
                    description="Siapa yang menjadi sasaran konten ini? (Demografi, psikografi, pain points)"
                    placeholder="Contoh: Anak muda usia 18-25 tahun yang suka nongkrong..."
                  />
                )}
              />

              <form.AppField
                name="voice"
                children={(field) => (
                  <field.TextareaField
                    label="Gaya Bahasa (Voice)"
                    description="Tone of voice. Formal, santai, lucu, edukatif?"
                    placeholder="Contoh: Santai, menggunakan kata sapaan 'Sobat'..."
                  />
                )}
              />
            </div>

            <div className="space-y-4">
              <form.AppField
                name="pov"
                children={(field) => (
                  <field.TextareaField
                    label="Sudut Pandang (POV)"
                    description="Dari sudut pandang mana brand berbicara? (Orang pertama, ketiga, ahli)"
                    placeholder="Contoh: Sebagai teman diskusi yang ahli kopi..."
                  />
                )}
              />

              <form.AppField
                name="proof"
                children={(field) => (
                  <field.TextareaField
                    label="Bukti Kredibilitas (Proof)"
                    description="Alasan mengapa audiens harus percaya pada brand ini."
                    placeholder="Contoh: Telah melayani 10,000+ pelanggan sejak 2018..."
                  />
                )}
              />

              <form.AppField
                name="guardrails"
                children={(field) => (
                  <field.TextareaField
                    label="Pantangan (Guardrails)"
                    description="Hal-hal, kata, atau topik yang SANGAT DILARANG untuk diucapkan oleh brand ini."
                    placeholder="Contoh: Dilarang menggunakan bahasa gaul yang kasar, hindari isu SARA."
                  />
                )}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border/40">
            <form.AppField
              name="pillars"
              children={(field) => (
                <field.TagsField
                  label="Pilar Konten (Pillars)"
                  description="Topik-topik utama yang sering dibahas (Tekan Enter untuk menambah)."
                  placeholder="Contoh: Edukasi, Hiburan, Promo..."
                />
              )}
            />
          </div>

          <div className="flex justify-end pt-4">
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className="px-6 py-2.5 rounded-full bg-brand-accent text-brand-accent-foreground font-semibold text-sm hover:bg-brand-accent/90 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting && (
                    <span className="w-4 h-4 border-2 border-brand-accent-foreground/30 border-t-brand-accent-foreground rounded-full animate-spin" />
                  )}
                  Simpan Profil
                </button>
              )}
            />
          </div>
        </form>
      </div>
    </div>
  )
}
