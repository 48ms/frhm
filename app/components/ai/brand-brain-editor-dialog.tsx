"use client"

import * as React from "react"
import ReactMarkdown from "react-markdown"
import { format } from "date-fns"
import { toast } from "sonner"
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
import { MetricTicker } from "@/components/animate-ui/components/texts/metric-ticker"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import {
  useClientFiles,
  useUpsertClientFile,
  useVerifyClientFile,
  useDeleteClientFile,
} from "@/features/brand-files/api/queries"
import { useClientSkillOutputs } from "@/features/skills/api/queries"
import {
  STANDARD_BRAND_FILES,
  type BrandFileKey,
} from "@/features/brand-files/api/types"
import { compileBrandContext } from "@/lib/brand-context"
import { VoiceBuilderDialog } from "@/components/ai/voice-builder-dialog"

interface BrandBrainEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  clientName: string
  initialPath?: BrandFileKey
}

type ViewMode = "edit" | "preview" | "split" | "compiled"

export function BrandBrainEditorDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
  initialPath = "brand-profile.md",
}: BrandBrainEditorDialogProps) {
  const { data: serverFiles = [], isLoading } = useClientFiles(clientId)
  const { data: skillOutputs = [] } = useClientSkillOutputs(clientId)
  const { mutateAsync: upsertFile, isPending: isSaving } = useUpsertClientFile()
  const { mutateAsync: verifyFile, isPending: isVerifying } = useVerifyClientFile()
  const { mutateAsync: deleteFile, isPending: isDeleting } = useDeleteClientFile()

  const [activePath, setActivePath] = React.useState<BrandFileKey>(initialPath)
  const [viewMode, setViewMode] = React.useState<ViewMode>("split")
  const [contentBuffer, setContentBuffer] = React.useState<Record<string, string>>({})
  const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false)

  // Ketika dialog baru dibuka (open transition false -> true), refresh buffer dengan serverFiles terkini
  const prevOpenRef = React.useRef(open)
  React.useEffect(() => {
    if (open && !prevOpenRef.current) {
      const freshBuffer: Record<string, string> = {}
      for (const file of serverFiles) {
        freshBuffer[file.path] = file.content
      }
      setContentBuffer(freshBuffer)
    }
    prevOpenRef.current = open
  }, [open, serverFiles])

  // Sinkronisasi data server ke buffer lokal saat dialog dibuka atau file dimuat
  React.useEffect(() => {
    if (serverFiles && serverFiles.length > 0) {
      setContentBuffer((prev) => {
        let hasChanges = false
        const next = { ...prev }
        for (const file of serverFiles) {
          if (next[file.path] === undefined) {
            next[file.path] = file.content
            hasChanges = true
          }
        }
        return hasChanges ? next : prev
      })
    }
  }, [serverFiles])

  // Sinkronisasi initialPath jika diberikan dari luar
  React.useEffect(() => {
    if (initialPath) {
      setActivePath(initialPath)
    }
  }, [initialPath])

  const allTabs = React.useMemo(() => {
    const list = [...STANDARD_BRAND_FILES]
    for (const sf of serverFiles) {
      if (!list.some((item) => item.path === sf.path)) {
        list.push({
          path: sf.path as any,
          title: sf.path.replace(/\.md$/, "").replace(/[-_]/g, " ").toUpperCase(),
          shortLabel: sf.path.replace(/\.md$/, "").replace(/[-_]/g, " "),
          description: "Dokumen strategi & playbook klien",
          defaultTemplate: "",
        })
      }
    }
    return list
  }, [serverFiles])

  const activeMeta =
    allTabs.find((f) => f.path === activePath) ||
    STANDARD_BRAND_FILES[0]
  const serverFile = serverFiles.find((f) => f.path === activePath)

  // Konten saat ini: ambil dari buffer jika ada, atau server, atau default kosong
  const currentContent =
    contentBuffer[activePath] !== undefined
      ? contentBuffer[activePath]
      : serverFile?.content ?? ""

  const isModified =
    serverFile !== undefined
      ? currentContent !== serverFile.content
      : currentContent.trim().length > 0

  // Draf output AI yang relevan dengan tab aktif (jika ada interview / AI playbook yang baru dijalankan)
  const relevantSkillOutput = React.useMemo(() => {
    if (!skillOutputs || skillOutputs.length === 0) return null
    if (activePath === "brand-profile.md") {
      return skillOutputs.find((o) => o.skill_id === "brand-profile") || null
    }
    if (activePath === "voice.md") {
      return (
        skillOutputs.find(
          (o) => o.skill_id === "voice-builder" || o.skill_id === "writing-style-and-tone"
        ) || null
      )
    }
    if (activePath === "content-pillars.md") {
      return skillOutputs.find((o) => o.skill_id === "content-pillars") || null
    }
    if (activePath === "guardrails.md") {
      return skillOutputs.find((o) => o.skill_id === "guardrails") || null
    }
    if (activePath === "audience.md") {
      return skillOutputs.find((o) => o.skill_id === "audience-research") || null
    }
    if (activePath === "social-strategy.md") {
      return skillOutputs.find((o) => o.skill_id === "social-strategy") || null
    }
    if (activePath === "goals-and-kpis.md") {
      return skillOutputs.find((o) => o.skill_id === "goals-and-kpis") || null
    }
    if (activePath === "content-calendar.md") {
      return (
        skillOutputs.find(
          (o) => o.skill_id === "content-calendar" || o.skill_id === "batch-content-plan"
        ) || null
      )
    }
    if (activePath === "offers.md") {
      return (
        skillOutputs.find(
          (o) => o.skill_id === "lead-magnets-and-funnels" || o.skill_id === "creator-monetization"
        ) || null
      )
    }
    return null
  }, [skillOutputs, activePath])

  const hasDifferentSkillOutput = Boolean(
    relevantSkillOutput &&
      relevantSkillOutput.content.trim().length > 0 &&
      relevantSkillOutput.content.trim() !== currentContent.trim()
  )

  // Perhitungan statistik teks
  const charCount = currentContent.length
  const wordCount = currentContent.trim() ? currentContent.trim().split(/\s+/).length : 0
  const estTokens = Math.ceil(charCount / 4)
  const hasQuarterlyTag = currentContent.includes("(verify-quarterly)")

  // Kompilasi live context untuk tab 'compiled'
  const allCurrentFiles: Record<string, string> = {}
  for (const meta of STANDARD_BRAND_FILES) {
    const content =
      contentBuffer[meta.path] !== undefined
        ? contentBuffer[meta.path]
        : serverFiles.find((f) => f.path === meta.path)?.content ?? ""
    if (content.trim()) {
      allCurrentFiles[meta.path] = content
    }
  }
  const compiledPromptContext = compileBrandContext(clientName, allCurrentFiles)

  const [confirmExitOpen, setConfirmExitOpen] = React.useState(false)
  const [auditOpen, setAuditOpen] = React.useState(false)
  const [voiceBuilderOpen, setVoiceBuilderOpen] = React.useState(false)

  const handleSafeClose = () => {
    if (isModified) {
      setConfirmExitOpen(true)
    } else {
      onOpenChange(false)
    }
  }

  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // Quick AI Brand DNA Audit Logic — Upstream Ground Truth
  const auditDna = React.useMemo(() => {
    const text = currentContent.toLowerCase()
    const issues: string[] = []
    let score = 100

    if (charCount < 80) {
      issues.push("Konten masih terlalu ringkas (< 80 karakter). AI membutuhkan konteks lebih kaya.")
      score -= 30
    }
    if (!text.includes("#")) {
      issues.push("Gunakan heading markdown (#, ##) untuk memisahkan bab informasi.")
      score -= 15
    }
    if (activePath === "brand-profile.md") {
      if (!text.includes("who") && !text.includes("siapa") && !text.includes("brand") && !text.includes("identity")) {
        issues.push("Definisi identitas brand (Identity / Who We Are) belum terdeteksi.")
        score -= 20
      }
      if (!text.includes("audiens") && !text.includes("audience") && !text.includes("target")) {
        issues.push("Target audiens belum dijelaskan secara spesifik.")
        score -= 20
      }
      if (!text.includes("positioning") && !text.includes("diferensiasi") && !text.includes("point of view")) {
        issues.push("Positioning & Point of View disarankan untuk dilengkapi.")
        score -= 10
      }
      if (!text.includes("proof") && !text.includes("bukti") && !text.includes("kredibilitas")) {
        issues.push("Bukti nyata & kredibilitas (Proof) disarankan untuk ditambahkan.")
        score -= 10
      }
      if (!text.includes("operational") && !text.includes("ai") && !text.includes("defaults")) {
        issues.push("Operational Defaults (AI & synthetic media policy) disarankan untuk disetel.")
        score -= 5
      }
    } else if (activePath === "guardrails.md") {
      if (!text.includes("jangan") && !text.includes("dilarang") && !text.includes("never")) {
        issues.push("Batasan larangan (Never-List) belum mencantumkan kata kunci proteksi.")
        score -= 25
      }
    } else if (activePath === "voice.md") {
      if (!text.includes("tone") && !text.includes("nada") && !text.includes("gaya") && !text.includes("fingerprint")) {
        issues.push("Panduan nada bicara (Tone of Voice / Fingerprint) belum didefinisikan.")
        score -= 20
      }
      if (!text.includes("negative") && !text.includes("never") && !text.includes("tidak pernah")) {
        issues.push("Negative Space (Hard Nevers) disarankan untuk didefinisikan secara tegas.")
        score -= 10
      }
    } else if (activePath === "audience.md") {
      if (!text.includes("audiens") && !text.includes("audience") && !text.includes("icp") && !text.includes("persona")) {
        issues.push("Definisi ICP / Persona audiens utama belum terdeteksi.")
        score -= 20
      }
      if (!text.includes("jtbd") && !text.includes("pain") && !text.includes("masalah") && !text.includes("kebutuhan")) {
        issues.push("Pain points & Jobs-To-Be-Done (JTBD) audiens disarankan untuk dilengkapi.")
        score -= 15
      }
    } else if (activePath === "social-strategy.md") {
      if (!text.includes("channel") && !text.includes("platform") && !text.includes("reels") && !text.includes("instagram")) {
        issues.push("Fokus channel media sosial utama belum tercantum.")
        score -= 20
      }
      if (!text.includes("target") && !text.includes("goal") && !text.includes("fase") && !text.includes("roadmap")) {
        issues.push("Roadmap bertahap atau objektif strategi disarankan untuk ditambahkan.")
        score -= 10
      }
    } else if (activePath === "content-pillars.md") {
      if (!text.includes("-") && !text.includes("*") && !text.includes("pillar") && !text.includes("pilar")) {
        issues.push("Daftar pilar konten (bullet list) belum terdeteksi.")
        score -= 25
      }
      if (!text.includes("%") && !text.includes("alokasi") && !text.includes("frekuensi")) {
        issues.push("Persentase alokasi pilar konten disarankan untuk dicantumkan.")
        score -= 10
      }
    } else if (activePath === "goals-and-kpis.md") {
      if (!text.includes("kpi") && !text.includes("metric") && !text.includes("target") && !text.includes("north star")) {
        issues.push("North Star Metric atau target KPI kuantitatif belum terdeteksi.")
        score -= 25
      }
    } else if (activePath === "content-calendar.md") {
      if (!text.includes("jadwal") && !text.includes("hari") && !text.includes("jam") && !text.includes("slot") && !text.includes("|")) {
        issues.push("Jadwal tayang rutin atau tabel slot konten belum terdeteksi.")
        score -= 20
      }
    } else if (activePath === "offers.md") {
      if (!text.includes("cta") && !text.includes("penawaran") && !text.includes("offer") && !text.includes("promo")) {
        issues.push("Hierarki tawaran (Offers) atau call-to-action belum dicantumkan.")
        score -= 20
      }
    }

    score = Math.max(20, score)
    return { score, issues }
  }, [currentContent, charCount, activePath])

  const handleContentChange = (val: string) => {
    setContentBuffer((prev) => ({
      ...prev,
      [activePath]: val,
    }))
  }

  const handleUseTemplate = () => {
    handleContentChange(activeMeta.defaultTemplate)
    toast.info(`Template standar untuk ${activeMeta.shortLabel} diterapkan.`)
  }

  const handleInsertSyntax = (prefix: string, suffix: string = "") => {
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart ?? 0
      const end = textarea.selectionEnd ?? 0
      const selectedText = currentContent.slice(start, end)
      const insertion = selectedText
        ? `${prefix}${selectedText}${suffix}`
        : `${prefix}teks panduan${suffix}`
      const updated = currentContent.slice(0, start) + insertion + currentContent.slice(end)
      handleContentChange(updated)
      setTimeout(() => {
        textarea.focus()
        const newCursor = start + insertion.length
        textarea.setSelectionRange(newCursor, newCursor)
      }, 0)
    } else {
      const addition = `${prefix}teks panduan${suffix}`
      const updated = currentContent ? `${currentContent}\n${addition}` : addition
      handleContentChange(updated)
    }
  }

  const handleSave = async () => {
    if (!clientId) {
      toast.error("Client ID tidak valid.")
      return
    }
    try {
      await upsertFile({
        clientId,
        path: activePath,
        content: currentContent,
      })
      toast.success(`File ${activePath} berhasil disimpan dan disinkronkan ke AI Brain.`)
    } catch (err: unknown) {
      console.error(err)
      toast.error("Gagal menyimpan file brand.")
    }
  }

  const handleVerifyQuarter = async () => {
    if (!clientId) return
    try {
      await verifyFile({
        clientId,
        path: activePath,
      })
      toast.success(`File ${activePath} telah ditandai terverifikasi untuk kuartal ini.`)
    } catch (err: unknown) {
      console.error(err)
      toast.error("Gagal memperbarui status verifikasi.")
    }
  }

  const handleDeleteFile = async () => {
    if (!clientId) return
    try {
      await deleteFile({ clientId, path: activePath })
      setContentBuffer((prev) => {
        const next = { ...prev }
        delete next[activePath]
        return next
      })
      setConfirmDeleteOpen(false)
      toast.success(`Dokumen ${activePath} berhasil dihapus dari Brand Brain.`)
    } catch (err: unknown) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : "Gagal menghapus dokumen.")
    }
  }

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(
        viewMode === "compiled" ? compiledPromptContext : currentContent
      )
      toast.success("Markdown berhasil disalin ke clipboard.")
    } catch {
      toast.error("Gagal menyalin markdown.")
    }
  }

  const markdownComponents = React.useMemo(() => ({
    h1: ({ children }: { children?: React.ReactNode }) => (
      <h1 className="text-xl font-black text-foreground mb-4 border-b border-border/40 pb-2">
        {children}
      </h1>
    ),
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2 className="text-base font-bold text-primary mb-2 mt-5 flex items-center gap-1.5">
        {children}
      </h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h3 className="text-sm font-semibold text-foreground mb-1.5 mt-3">
        {children}
      </h3>
    ),
    p: ({ children }: { children?: React.ReactNode }) => (
      <p className="text-xs text-muted-foreground leading-relaxed mb-3">
        {children}
      </p>
    ),
    ul: ({ children }: { children?: React.ReactNode }) => (
      <ul className="list-disc list-inside space-y-1.5 mb-3 text-xs text-muted-foreground pl-1">
        {children}
      </ul>
    ),
    ol: ({ children }: { children?: React.ReactNode }) => (
      <ol className="list-decimal list-inside space-y-1.5 mb-3 text-xs text-muted-foreground pl-1">
        {children}
      </ol>
    ),
    li: ({ children }: { children?: React.ReactNode }) => <li className="leading-relaxed">{children}</li>,
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote className="border-l-3 border-primary/50 pl-3 italic text-xs text-muted-foreground my-3">
        {children}
      </blockquote>
    ),
    code: ({ children }: { children?: React.ReactNode }) => (
      <code className="bg-muted px-1.5 py-0.5 rounded text-2xs font-mono text-foreground font-semibold">
        {children}
      </code>
    ),
    strong: ({ children }: { children?: React.ReactNode }) => (
      <strong className="font-bold text-foreground">{children}</strong>
    ),
    table: ({ children }: { children?: React.ReactNode }) => (
      <div className="overflow-x-auto my-3 rounded-xl border border-border/40 bg-card/50">
        <table className="w-full text-xs border-collapse text-left">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: { children?: React.ReactNode }) => (
      <thead className="bg-muted/50 text-foreground font-semibold border-b border-border/40">
        {children}
      </thead>
    ),
    tbody: ({ children }: { children?: React.ReactNode }) => (
      <tbody className="divide-y divide-border/20 text-foreground">
        {children}
      </tbody>
    ),
    tr: ({ children }: { children?: React.ReactNode }) => (
      <tr className="hover:bg-muted/20 transition-colors">
        {children}
      </tr>
    ),
    th: ({ children }: { children?: React.ReactNode }) => (
      <th className="px-3.5 py-2 text-2xs font-bold uppercase tracking-wider text-primary">
        {children}
      </th>
    ),
    td: ({ children }: { children?: React.ReactNode }) => (
      <td className="px-3.5 py-2 text-xs text-foreground font-medium">
        {children}
      </td>
    ),
    hr: () => <hr className="my-4 border-border/30" />,
  }), [])

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleSafeClose()}>
      <DialogContent
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "s") {
            e.preventDefault()
            void handleSave()
          }
        }}
        className="w-[95vw] max-w-6xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden bg-card border border-border/40 rounded-2xl shadow-2xl backdrop-blur-2xl"
        aria-describedby="brand-brain-editor-desc"
      >
        {/* Header Dialog */}
        <DialogHeader className="px-6 py-4 border-b border-border/40 bg-secondary/10 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Icons.bot className="size-4" />
                </div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  Brand Brain Markdown Studio — {clientName}
                </DialogTitle>
                <Badge variant="outline" className="text-2xs font-bold border-primary/30 text-primary">
                  AI Context Engine
                </Badge>
              </div>
              <DialogDescription id="brand-brain-editor-desc" className="text-xs text-muted-foreground">
                Kelola 8 dokumen acuan Copilot & AI Playbook (<code className="text-foreground">.md</code>) yang menjadi dasar setiap ide, caption, hook, dan evaluasi tren.
              </DialogDescription>
            </div>

            {/* Mode Switcher */}
            <div className="flex items-center gap-1 p-1 bg-secondary/40 rounded-xl border border-border/30 self-start sm:self-auto">
              <Button
                type="button"
                size="sm"
                variant={viewMode === "edit" ? "default" : "ghost"}
                onClick={() => setViewMode("edit")}
                className="h-7 px-2.5 text-xs font-bold rounded-lg cursor-pointer"
              >
                <Icons.edit className="size-3.5 mr-1" />
                Editor
              </Button>
              <Button
                type="button"
                size="sm"
                variant={viewMode === "preview" ? "default" : "ghost"}
                onClick={() => setViewMode("preview")}
                className="h-7 px-2.5 text-xs font-bold rounded-lg cursor-pointer"
              >
                <Icons.eye className="size-3.5 mr-1" />
                Preview
              </Button>
              <Button
                type="button"
                size="sm"
                variant={viewMode === "split" ? "default" : "ghost"}
                onClick={() => setViewMode("split")}
                className="h-7 px-2.5 text-xs font-bold rounded-lg hidden md:flex cursor-pointer"
              >
                <Icons.workflow className="size-3.5 mr-1" />
                Split
              </Button>
              <Button
                type="button"
                size="sm"
                variant={viewMode === "compiled" ? "default" : "ghost"}
                onClick={() => setViewMode("compiled")}
                className="h-7 px-2.5 text-xs font-bold rounded-lg cursor-pointer"
              >
                <Icons.sparkles className="size-3.5 mr-1 text-primary" />
                Live Prompt Context
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* File Tabs Strip */}
        <div className="flex items-center gap-2 px-6 py-2.5 border-b border-border/30 bg-muted/20 overflow-x-auto shrink-0">
          {allTabs.map((f) => {
            const isSelected = activePath === f.path
            const existing = serverFiles.find((sf) => sf.path === f.path)
            const hasData = existing && existing.content.trim().length > 0
            const needsVerif = existing?.needs_verification

            return (
              <Button
                key={f.path}
                type="button"
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => setActivePath(f.path)}
                className={cn(
                  "rounded-full text-xs font-bold h-8 px-3.5 flex items-center gap-2 cursor-pointer transition-all",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card text-foreground hover:bg-secondary/40 border-border/40"
                )}
              >
                <span
                  className={cn(
                    "size-2 rounded-full",
                    needsVerif
                      ? "bg-warning"
                      : hasData
                      ? "bg-success"
                      : "bg-muted-foreground/40"
                  )}
                  aria-hidden
                />
                {f.shortLabel}
                <code className="text-2xs opacity-70">.{f.path.split(".").pop()}</code>
              </Button>
            )
          })}
        </div>

        {/* Active File Metadata & Live FinOps Bar */}
        <div className="px-6 py-2.5 bg-card border-b border-border/20 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <Icons.fileText className="size-4 text-primary" />
              {activeMeta.title}
            </span>
            <span className="text-muted-foreground hidden sm:inline">•</span>
            <span className="text-muted-foreground text-xs hidden sm:inline">
              {activeMeta.description}
            </span>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Live Stats */}
            <div className="flex items-center gap-3 px-3 py-1 rounded-lg bg-secondary/30 border border-border/30 text-2xs font-semibold text-muted-foreground">
              <span>
                Karakter:{" "}
                <strong className="text-foreground">
                  <MetricTicker value={charCount} />
                </strong>
              </span>
              <span>•</span>
              <span>
                Kata:{" "}
                <strong className="text-foreground">
                  <MetricTicker value={wordCount} />
                </strong>
              </span>
              <span>•</span>
              <span>
                Est. Tokens:{" "}
                <strong className="text-primary font-bold">
                  <MetricTicker value={estTokens} />
                </strong>
              </span>
            </div>

            {/* Quarterly Status */}
            {serverFile?.needs_verification && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleVerifyQuarter}
                isLoading={isVerifying}
                className="h-7 text-2xs font-bold text-warning border-warning/40 bg-warning/10 hover:bg-warning/20 rounded-full cursor-pointer"
              >
                <Icons.warning className="size-3 mr-1" />
                Tandai Terverifikasi
              </Button>
            )}

            {/* AI Brand DNA Audit Button */}
            <Button
              type="button"
              size="sm"
              variant={auditOpen ? "secondary" : "outline"}
              onClick={() => setAuditOpen(!auditOpen)}
              className="h-7 text-2xs font-bold text-primary border-primary/30 hover:bg-primary/10 rounded-full cursor-pointer gap-1"
            >
              <Icons.sparkles className="size-3" />
              <span>Audit DNA ({auditDna.score}%)</span>
            </Button>

            {isModified && (
              <Badge variant="outline" className="text-2xs font-bold text-warning border-warning/40 bg-warning/5">
                Ada Perubahan Belum Disimpan
              </Badge>
            )}
          </div>
        </div>

        {/* Banner Draf Wawancara AI Tersedia */}
        {hasDifferentSkillOutput && relevantSkillOutput && (
          <div className="mx-6 mt-3 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-2.5 text-foreground">
              <Icons.sparkles className="size-4 text-primary shrink-0" />
              <div>
                <span className="font-semibold text-primary">Draf Wawancara AI Tersedia:</span>{" "}
                <span className="text-muted-foreground">
                  Ditemukan draf dari sesi wawancara AI ({relevantSkillOutput.title}) yang berbeda dari editor ini.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                size="sm"
                variant="default"
                onClick={() => {
                  handleContentChange(relevantSkillOutput.content)
                  toast.success(
                    `Draf wawancara "${relevantSkillOutput.title}" berhasil dimuat ke editor. Jangan lupa klik Simpan Dokumen.`
                  )
                }}
                className="h-7 text-xs font-bold rounded-lg cursor-pointer bg-primary text-primary-foreground shadow-sm"
              >
                <Icons.check className="size-3.5 mr-1" />
                Terapkan ke Editor
              </Button>
            </div>
          </div>
        )}

        {/* Expandable Brand DNA Audit Report */}
        {auditOpen && (
          <div className="mx-6 my-2.5 p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">
                  Kesiapan Brand DNA untuk AI Copilot:
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-2xs font-bold",
                    auditDna.score >= 80 ? "border-success text-success bg-success/10" : "border-warning text-warning bg-warning/10"
                  )}
                >
                  {auditDna.score}% {auditDna.score >= 80 ? "Sangat Baik" : "Perlu Disempurnakan"}
                </Badge>
              </div>
              <button
                type="button"
                onClick={() => setAuditOpen(false)}
                className="text-2xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                ✕ Tutup
              </button>
            </div>
            {auditDna.issues.length > 0 ? (
              <ul className="text-2xs text-muted-foreground space-y-1 list-disc list-inside">
                {auditDna.issues.map((iss, idx) => (
                  <li key={idx} className="text-warning">
                    {iss}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-2xs text-success font-medium">
                ✓ Struktur dokumen sangat baik! AI Copilot akan menghasilkan respon yang presisi dan selaras dengan dokumen ini.
              </p>
            )}
          </div>
        )}

        {/* Main Workspace Area */}
        <div className="flex-1 overflow-y-auto p-6 min-h-[380px]">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Icons.spinner className="size-6 animate-spin text-primary" />
              <p className="text-xs">Memuat dokumen Brand Brain...</p>
            </div>
          ) : viewMode === "compiled" ? (
            /* COMPILED CONTEXT PREVIEW */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <Icons.bot className="size-4" />
                    Konteks Final yang Diterima AI Copilot
                  </h4>
                  <Badge variant="outline" className="text-2xs font-mono">
                    ~{Math.ceil(compiledPromptContext.length / 4)} total tokens
                  </Badge>
                </div>
                <p className="text-2xs text-muted-foreground">
                  Inilah naskah utuh yang disuntikkan secara otomatis ke setiap pemanggilan AI (Ide, Caption, Video Script, Hook, Batch Plan, Evaluasi Tren) untuk brand {clientName}.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-secondary/20 border border-border/30 font-mono text-xs whitespace-pre-wrap leading-relaxed text-foreground select-text max-h-[480px] overflow-y-auto">
                {compiledPromptContext}
              </div>
            </div>
          ) : viewMode === "split" ? (
            /* SPLIT VIEW (EDITOR & PREVIEW SIDE-BY-SIDE) */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full min-h-[420px]">
              {/* Left Pane: Raw Editor */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1 p-0.5 bg-secondary/40 rounded-lg border border-border/30">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleInsertSyntax("## ")}
                      className="h-6 px-1.5 text-2xs font-bold rounded cursor-pointer hover:bg-secondary"
                      title="Heading 2"
                    >
                      H2
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleInsertSyntax("**", "**")}
                      className="h-6 px-1.5 text-2xs font-bold rounded cursor-pointer hover:bg-secondary"
                      title="Bold"
                    >
                      B
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleInsertSyntax("- ")}
                      className="h-6 px-1.5 text-2xs font-bold rounded cursor-pointer hover:bg-secondary"
                      title="Bullet List"
                    >
                      • List
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleInsertSyntax("> ")}
                      className="h-6 px-1.5 text-2xs font-bold rounded cursor-pointer hover:bg-secondary"
                      title="Quote"
                    >
                      Quote
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleInsertSyntax("", " (verify-quarterly)")}
                      className="h-6 px-2 text-2xs font-bold rounded text-warning cursor-pointer hover:bg-warning/10"
                      title="Sisipkan Tag Verifikasi Kuartal"
                    >
                      + (verify-quarterly)
                    </Button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {activePath === "voice.md" && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setVoiceBuilderOpen(true)}
                        className="h-6 px-2 text-2xs font-bold text-primary bg-primary/10 border-primary/25 hover:bg-primary/20 cursor-pointer"
                      >
                        <Icons.sparkles className="size-3 mr-1" />
                        Ekstrak Suara (Voice Builder)
                      </Button>
                    )}

                    {!currentContent.trim() && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={handleUseTemplate}
                        className="h-6 text-2xs text-primary font-bold cursor-pointer"
                      >
                        <Icons.sparkles className="size-3 mr-1" />
                        Gunakan Template Baku
                      </Button>
                    )}
                  </div>
                </div>
                <Textarea
                  ref={textareaRef}
                  value={currentContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder={`Mulai tulis dokumen ${activePath} di sini dalam format Markdown...`}
                  className="flex-1 min-h-[380px] font-mono text-xs p-4 bg-background border-border/40 rounded-xl leading-relaxed resize-none focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>

              {/* Right Pane: Live Rendered Markdown */}
              <div className="flex flex-col gap-2">
                <span className="text-2xs font-extrabold uppercase text-muted-foreground tracking-wider">
                  Live Formatted Preview
                </span>
                <div className="flex-1 min-h-[380px] p-5 rounded-xl bg-secondary/15 border border-border/30 overflow-y-auto">
                  {currentContent.trim() ? (
                    <ReactMarkdown components={markdownComponents}>
                      {currentContent}
                    </ReactMarkdown>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground space-y-2">
                      <Icons.fileText className="size-8 stroke-1 text-muted-foreground/40" />
                      <p className="text-xs">Dokumen ini masih kosong.</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleUseTemplate}
                        className="rounded-full text-xs font-bold cursor-pointer"
                      >
                        Terapkan Template Standar Frhm
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : viewMode === "edit" ? (
            /* FULL RAW EDITOR */
            <div className="space-y-2 h-full">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1 p-0.5 bg-secondary/40 rounded-lg border border-border/30">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleInsertSyntax("## ")}
                    className="h-6 px-1.5 text-2xs font-bold rounded cursor-pointer hover:bg-secondary"
                    title="Heading 2"
                  >
                    H2
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleInsertSyntax("**", "**")}
                    className="h-6 px-1.5 text-2xs font-bold rounded cursor-pointer hover:bg-secondary"
                    title="Bold"
                  >
                    B
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleInsertSyntax("- ")}
                    className="h-6 px-1.5 text-2xs font-bold rounded cursor-pointer hover:bg-secondary"
                    title="Bullet List"
                  >
                    • List
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleInsertSyntax("> ")}
                    className="h-6 px-1.5 text-2xs font-bold rounded cursor-pointer hover:bg-secondary"
                    title="Quote"
                  >
                    Quote
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleInsertSyntax("", " (verify-quarterly)")}
                    className="h-6 px-2 text-2xs font-bold rounded text-warning cursor-pointer hover:bg-warning/10"
                    title="Sisipkan Tag Verifikasi Kuartal"
                  >
                    + (verify-quarterly)
                  </Button>
                </div>

                {!currentContent.trim() && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={handleUseTemplate}
                    className="h-6 text-2xs text-primary font-bold cursor-pointer"
                  >
                    <Icons.sparkles className="size-3 mr-1" />
                    Gunakan Template Baku
                  </Button>
                )}
              </div>
              <Textarea
                ref={textareaRef}
                value={currentContent}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder={`Tulis panduan ${activePath} di sini...`}
                className="w-full min-h-[420px] font-mono text-xs p-5 bg-background border-border/40 rounded-xl leading-relaxed resize-y focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>
          ) : (
            /* FULL PREVIEW */
            <div className="p-6 rounded-2xl bg-secondary/15 border border-border/30 min-h-[420px] overflow-y-auto">
              {currentContent.trim() ? (
                <ReactMarkdown components={markdownComponents}>
                  {currentContent}
                </ReactMarkdown>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-muted-foreground space-y-2">
                  <Icons.fileText className="size-8 stroke-1 text-muted-foreground/40" />
                  <p className="text-xs">Dokumen ini belum memiliki konten.</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleUseTemplate}
                    className="rounded-full text-xs font-bold cursor-pointer"
                  >
                    Terapkan Template Standar Frhm
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <DialogFooter className="px-6 py-4 border-t border-border/40 bg-secondary/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyMarkdown}
              className="text-xs font-semibold rounded-full cursor-pointer h-9 px-3"
            >
              <Icons.copy className="size-3.5 mr-1.5" />
              Salin Markdown
            </Button>

            {!currentContent.trim() && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleUseTemplate}
                className="text-xs font-semibold text-primary rounded-full cursor-pointer h-9 px-3"
              >
                <Icons.sparkles className="size-3.5 mr-1.5" />
                Template Standar
              </Button>
            )}

            {activePath !== "brand-profile.md" && Boolean(serverFile) && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirmDeleteOpen(true)}
                className="text-xs font-semibold text-destructive hover:bg-destructive/10 border-destructive/30 rounded-full cursor-pointer h-9 px-3 gap-1.5"
              >
                <Icons.delete className="size-3.5" />
                Hapus Dokumen
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-3xs text-muted-foreground/60 mr-2 hidden sm:inline-block">
              ⌘+S untuk simpan
            </span>
            <Button
              type="button"
              variant="outline"
              onClick={handleSafeClose}
              className="text-xs font-semibold rounded-full cursor-pointer h-9 px-4"
            >
              Tutup
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              isLoading={isSaving}
              className="text-xs font-bold rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer h-9 px-5 shadow-sm min-h-11"
            >
              <Icons.check className="size-3.5 mr-1.5" />
              Simpan {activeMeta.shortLabel}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      {/* Unsaved changes confirmation dialog */}
      <AlertDialog open={confirmExitOpen} onOpenChange={setConfirmExitOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tutup Brand Brain Studio?</AlertDialogTitle>
            <AlertDialogDescription>
              Perubahan pada dokumen <strong>{activeMeta.shortLabel}</strong> belum disimpan. Perubahan Anda akan hilang jika Anda menutup jendela sekarang.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmExitOpen(false)}>
              Lanjut Mengedit
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setConfirmExitOpen(false)
                onOpenChange(false)
              }}
            >
              Tinggalkan Perubahan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete file confirmation dialog */}
      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Dokumen {activeMeta.shortLabel}?</AlertDialogTitle>
            <AlertDialogDescription>
              Dokumen <strong>{activePath}</strong> akan dihapus dari basis data AI Brand Brain klien. AI Copilot akan menggunakan aturan baku sistem tanpa kustomisasi dokumen ini. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmDeleteOpen(false)}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteFile}
              disabled={isDeleting}
            >
              Hapus Dokumen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Voice Builder Wizard Dialog */}
      <VoiceBuilderDialog
        open={voiceBuilderOpen}
        onOpenChange={setVoiceBuilderOpen}
        clientId={clientId}
        clientName={clientName}
        onSaved={(content) => {
          handleContentChange(content)
          toast.success("Voice Guide berhasil dimuat ke editor.")
        }}
      />
    </Dialog>
  )
}
