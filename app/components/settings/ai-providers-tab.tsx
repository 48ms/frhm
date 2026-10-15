"use client"

import * as React from "react"
import { toast } from "sonner"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/animate-ui/components/radix/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/animate-ui/components/radix/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/animate-ui/components/radix/alert-dialog"
import {
  useAiProviders,
  useCreateAiProvider,
  useUpdateAiProvider,
  useDeleteAiProvider,
  useSetDefaultAiProvider,
  useTestAiProvider,
} from "@/features/ai-providers/api/queries"
import type { AiProviderMasked, ProviderKind } from "@/features/ai-providers/api/types"
import { cn } from "@/lib/utils"

const KIND_PRESETS: Record<ProviderKind, { label: string; defaultModel: string; placeholderUrl?: string }> = {
  gemini: {
    label: "Google Gemini",
    defaultModel: "gemini-2.0-flash",
  },
  anthropic: {
    label: "Anthropic Claude",
    defaultModel: "claude-3-5-sonnet-20241022",
  },
  openai: {
    label: "OpenAI GPT",
    defaultModel: "gpt-4o-mini",
  },
  custom: {
    label: "Custom / OpenRouter / 9Router",
    defaultModel: "deepseek/deepseek-chat",
    placeholderUrl: "https://openrouter.ai/api/v1",
  },
}

export function AiProvidersTab() {
  const { data: providers = [], isLoading, isError } = useAiProviders()
  const { mutateAsync: createProvider, isPending: isCreating } = useCreateAiProvider()
  const { mutateAsync: updateProvider, isPending: isUpdating } = useUpdateAiProvider()
  const { mutateAsync: deleteProvider, isPending: isDeleting } = useDeleteAiProvider()
  const { mutateAsync: setDefaultProvider, isPending: isSettingDefault } = useSetDefaultAiProvider()
  const { mutateAsync: testConnection, isPending: isTesting } = useTestAiProvider()

  const [testingId, setTestingId] = React.useState<string | null>(null)
  const [modalOpen, setModalOpen] = React.useState(false)
  const [editingProvider, setEditingProvider] = React.useState<AiProviderMasked | null>(null)

  const [deleteTarget, setDeleteTarget] = React.useState<AiProviderMasked | null>(null)

  // Form state
  const [label, setLabel] = React.useState("")
  const [kind, setKind] = React.useState<ProviderKind>("gemini")
  const [model, setModel] = React.useState("gemini-2.0-flash")
  const [baseUrl, setBaseUrl] = React.useState("")
  const [apiKey, setApiKey] = React.useState("")
  const [showKey, setShowKey] = React.useState(false)
  const [isDefault, setIsDefault] = React.useState(false)

  const handleOpenCreate = () => {
    setEditingProvider(null)
    setLabel("Google Gemini 2.0 Flash")
    setKind("gemini")
    setModel("gemini-2.0-flash")
    setBaseUrl("")
    setApiKey("")
    setShowKey(false)
    setIsDefault(providers.length === 0)
    setModalOpen(true)
  }

  const handleOpenEdit = (p: AiProviderMasked) => {
    setEditingProvider(p)
    setLabel(p.label)
    setKind(p.kind)
    setModel(p.model)
    setBaseUrl(p.base_url || "")
    setApiKey("") // keep blank unless changing
    setShowKey(false)
    setIsDefault(p.is_default)
    setModalOpen(true)
  }

  const handleKindChange = (newKind: ProviderKind) => {
    setKind(newKind)
    const preset = KIND_PRESETS[newKind]
    if (!editingProvider) {
      setModel(preset.defaultModel)
      setLabel(`${preset.label} (${preset.defaultModel})`)
      setBaseUrl(preset.placeholderUrl || "")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim()) {
      toast.error("Label provider wajib diisi.")
      return
    }
    if (!model.trim()) {
      toast.error("Model identifier wajib diisi.")
      return
    }

    try {
      if (editingProvider) {
        await updateProvider({
          id: editingProvider.id,
          input: {
            label: label.trim(),
            kind,
            model: model.trim(),
            base_url: baseUrl.trim() || null,
            api_key: apiKey.trim() ? apiKey.trim() : undefined,
            is_default: isDefault,
          },
        })
        toast.success("AI Provider berhasil diperbarui.")
      } else {
        await createProvider({
          label: label.trim(),
          kind,
          model: model.trim(),
          base_url: baseUrl.trim() || undefined,
          api_key: apiKey.trim() || undefined,
          is_default: isDefault,
        })
        toast.success("AI Provider baru berhasil ditambahkan.")
      }
      setModalOpen(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan AI Provider.")
    }
  }

  const handleSetDefault = async (p: AiProviderMasked) => {
    try {
      await setDefaultProvider(p.id)
      toast.success(`${p.label} sekarang menjadi default provider Frhm.`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal mengganti default provider.")
    }
  }

  const handleTestConnection = async (p: AiProviderMasked) => {
    setTestingId(p.id)
    try {
      const res = await testConnection(p.id)
      if (res.success) {
        toast.success(res.message)
      } else {
        toast.error(res.message)
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Tes koneksi gagal.")
    } finally {
      setTestingId(null)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      await deleteProvider(deleteTarget.id)
      toast.success(`Provider ${deleteTarget.label} berhasil dihapus.`)
      setDeleteTarget(null)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus provider.")
    }
  }

  return (
    <div className="space-y-6">
      <div className="admin-card border border-border/40 bg-card p-6 md:p-8 rounded-2xl shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Icons.sparkles className="size-5 text-primary" />
              AI Model & Provider Endpoints
            </h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
              Konfigurasi API key dan model LLM (Gemini, Claude, OpenAI, DeepSeek). Provider yang diset sebagai
              <strong className="text-foreground"> Default</strong> akan otomatis melayani AI Studio, Composer Copilot, dan Media Library.
            </p>
          </div>
          <Button
            type="button"
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer shadow-xs self-start sm:self-auto"
          >
            <Icons.add className="size-4" />
            <span>Tambah Provider</span>
          </Button>
        </div>

        {/* Loading / Error States */}
        {isLoading && (
          <div className="p-10 text-center text-xs text-muted-foreground animate-pulse">
            Memuat daftar AI provider...
          </div>
        )}

        {isError && (
          <div className="p-6 rounded-xl bg-destructive/5 border border-destructive/20 text-destructive text-xs">
            Gagal mengambil data AI provider. Pastikan Anda memiliki hak akses Administrator.
          </div>
        )}

        {/* Providers Table / Cards */}
        {!isLoading && !isError && providers.length === 0 && (
          <div className="p-8 text-center rounded-2xl border-2 border-dashed border-border/40 space-y-3">
            <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Icons.sparkles className="size-6" />
            </div>
            <h3 className="text-sm font-bold text-foreground">Belum ada AI Provider tersimpan</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Saat ini Copilot menggunakan konfigurasi fallback dari environment server (.env). Tambahkan provider di sini untuk mengelola model dan endpoint kustom secara visual.
            </p>
            <Button
              type="button"
              onClick={handleOpenCreate}
              variant="outline"
              size="sm"
              className="rounded-full text-xs font-bold cursor-pointer"
            >
              <Icons.add className="size-3.5 mr-1" />
              Buat Provider Pertama
            </Button>
          </div>
        )}

        {!isLoading && !isError && providers.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-border/40">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/40 bg-secondary/30">
                  <th className="p-3.5 font-bold text-foreground">Provider & Label</th>
                  <th className="p-3.5 font-bold text-foreground">Model Identifier</th>
                  <th className="p-3.5 font-bold text-foreground">Status Kunci API</th>
                  <th className="p-3.5 font-bold text-foreground">Status Default</th>
                  <th className="p-3.5 font-bold text-foreground text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {providers.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Icons.sparkles className="size-4" />
                        </div>
                        <div>
                          <span className="font-bold text-foreground block text-xs">{p.label}</span>
                          <span className="text-2xs text-muted-foreground uppercase tracking-wider font-semibold">
                            {p.kind} {p.base_url ? `• Custom Endpoint` : ""}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-xs text-foreground font-semibold">
                      {p.model}
                    </td>
                    <td className="p-3.5">
                      {p.has_key ? (
                        <span className="font-mono text-2xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded border border-border/30">
                          {p.masked_key}
                        </span>
                      ) : (
                        <span className="text-2xs text-warning font-medium">
                          Fallback Server Env
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      {p.is_default ? (
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-2xs font-bold gap-1">
                          <Icons.check className="size-3" />
                          Default Active
                        </Badge>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(p)}
                          isLoading={isSettingDefault}
                          className="h-7 text-2xs font-semibold text-muted-foreground hover:text-primary cursor-pointer px-2"
                        >
                          Jadikan Default
                        </Button>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestConnection(p)}
                          isLoading={testingId === p.id}
                          className="h-7 px-2.5 text-2xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
                          title="Ping endpoint LLM"
                        >
                          <Icons.refresh className="size-3" />
                          <span>Test</span>
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(p)}
                          className="h-7 px-2 text-2xs font-semibold rounded-lg hover:bg-secondary cursor-pointer"
                        >
                          <Icons.pencil className="size-3.5" />
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(p)}
                          className="h-7 px-2 text-2xs font-semibold rounded-lg hover:text-destructive hover:bg-destructive/10 cursor-pointer text-muted-foreground"
                        >
                          <Icons.trash className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Add / Edit Provider */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[540px] bg-card border border-border/40 p-6 rounded-2xl shadow-2xl backdrop-blur-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground">
                {editingProvider ? "Edit AI Provider" : "Tambah AI Provider Baru"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Konfigurasikan model LLM dan kunci otentikasi. Kunci disimpan dengan enkripsi server dan dilindungi RLS.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Penyedia AI (Kind)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {(["gemini", "anthropic", "openai", "custom"] as ProviderKind[]).map((k) => (
                    <Button
                      key={k}
                      type="button"
                      variant={kind === k ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleKindChange(k)}
                      className="text-xs font-bold rounded-xl h-9 capitalize cursor-pointer"
                    >
                      {k}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Label Tampilan
                </label>
                <Input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Contoh: Gemini 2.0 Flash Production"
                  className="bg-background border-border/40 text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Model Identifier
                </label>
                <Input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Contoh: gemini-2.0-flash, claude-3-5-sonnet-20241022, gpt-4o-mini"
                  className="bg-background border-border/40 text-sm font-mono"
                  required
                />
              </div>

              {kind === "custom" && (
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    Base URL (Opsional untuk 9Router / OpenRouter)
                  </label>
                  <Input
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://openrouter.ai/api/v1"
                    className="bg-background border-border/40 text-sm font-mono"
                  />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-foreground block">
                    Kunci API (API Key)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="text-2xs text-primary font-semibold hover:underline cursor-pointer"
                  >
                    {showKey ? "Sembunyikan" : "Tampilkan"}
                  </button>
                </div>
                <Input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={
                    editingProvider?.has_key
                      ? "Biarkan kosong untuk mempertahankan kunci saat ini"
                      : "Paste API key di sini..."
                  }
                  className="bg-background border-border/40 text-sm font-mono"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/30">
                <div>
                  <span className="text-xs font-bold text-foreground block">Jadikan Default Provider</span>
                  <span className="text-2xs text-muted-foreground block">
                    Otomatis digunakan untuk seluruh aksi Copilot & AI Studio.
                  </span>
                </div>
                <Switch
                  checked={isDefault}
                  onCheckedChange={setIsDefault}
                  className="cursor-pointer"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(false)}
                className="rounded-full text-xs font-bold cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                isLoading={isCreating || isUpdating}
                className="rounded-full bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer"
              >
                {editingProvider ? "Simpan Perubahan" : "Tambahkan Provider"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog Delete Provider */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border border-border/40 rounded-2xl shadow-2xl backdrop-blur-2xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-foreground">
              Hapus AI Provider?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Apakah Anda yakin ingin menghapus provider <strong>{deleteTarget?.label}</strong> ({deleteTarget?.model})? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full text-xs font-bold cursor-pointer">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-bold cursor-pointer"
            >
              {isDeleting ? "Menghapus..." : "Hapus Provider"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
