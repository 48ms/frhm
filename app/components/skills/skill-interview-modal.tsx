"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import ReactMarkdown from "react-markdown"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/animate-ui/components/radix/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/animate-ui/components/radix/progress"
import { Icons } from "@/components/icons"
import { ShimmeringText } from "@/components/animate-ui/components/texts/shimmering-text"
import { MetricTicker } from "@/components/animate-ui/components/texts/metric-ticker"
import {
  useSkillChatTurn,
  useSaveSkillOutput,
  useExecuteSkillTool,
  useExecuteGenericSkill,
} from "@/features/skills/api/queries"
import type { Skill, SkillChatTurn } from "@/features/skills/api/types"
import { serializeComposerParams } from "@/lib/searchparams"
import { cn } from "@/lib/utils"

interface SkillInterviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  skill: Skill | null
  clientId: string
  clientName: string
}

/**
 * Filter comments (e.g. <!-- version: 1.0 ... -->) from visual preview
 */
function sanitizeMarkdown(content: string): string {
  return content.replace(/<!--[\s\S]*?-->/g, "").trim()
}

/**
 * Helper to compute live DNA / Document completeness score
 */
function computeDnaScore(content?: string, isDone?: boolean): number {
  if (isDone) return 100
  if (!content) return 0
  const lines = content.split("\n")
  let totalFields = 0
  let filledFields = 0
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith("- **") || trimmed.startsWith("* **")) {
      totalFields++
      const val = trimmed.split(/:\s*/)[1]?.trim() ?? ""
      if (val && val !== "*" && val !== "-" && val !== "—") {
        filledFields++
      }
    }
  }
  if (totalFields > 0) {
    return Math.min(95, Math.max(20, Math.round((filledFields / totalFields) * 100)))
  }
  return content.length > 300 ? 70 : 35
}

export function SkillInterviewModal({
  open,
  onOpenChange,
  skill,
  clientId,
  clientName,
}: SkillInterviewModalProps) {
  const router = useRouter()
  const chatMutation = useSkillChatTurn()
  const saveMutation = useSaveSkillOutput()
  const mcpMutation = useExecuteSkillTool()
  const genericMutation = useExecuteGenericSkill()

  const [messages, setMessages] = React.useState<SkillChatTurn[]>([])
  const [inputVal, setInputVal] = React.useState("")
  const [livePreview, setLivePreview] = React.useState<{ title: string; content: string } | null>(null)
  const [finalOutput, setFinalOutput] = React.useState<{ title: string; content: string } | null>(null)
  const [isDone, setIsDone] = React.useState(false)
  const [isSaved, setIsSaved] = React.useState(false)
  const [mcpFeedback, setMcpFeedback] = React.useState<string | null>(null)
  const [viewMode, setViewMode] = React.useState<"preview" | "markdown">("preview")
  const [copied, setCopied] = React.useState(false)

  const hasMcpTools = Boolean(
    skill?.allowed_tools?.toLowerCase().includes("woopsocial") ||
    skill?.id === "scheduling-and-queue"
  )

  const activeDoc = finalOutput || livePreview
  const dnaScore = computeDnaScore(activeDoc?.content, isDone)

  const handleTestMcp = () => {
    if (!skill || !clientId) return
    setMcpFeedback(null)
    mcpMutation.mutate(
      {
        clientId,
        skillId: skill.id,
        toolName: "woopsocial_list_social_accounts",
      },
      {
        onSuccess: (res) => {
          if (res.success) {
            const data = res.data as { profiles?: unknown[]; connected?: boolean } | undefined
            const count = data?.profiles?.length ?? (data?.connected ? 1 : 0)
            setMcpFeedback(`Koneksi aktif! ${count} akun media sosial terhubung.`)
          } else {
            setMcpFeedback(res.error || "Gagal memanggil MCP tool")
          }
        },
        onError: (err: unknown) => {
          setMcpFeedback(err instanceof Error ? err.message : "Error saat eksekusi MCP")
        },
      }
    )
  }

  const chatScrollRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLTextAreaElement>(null)

  // Auto-scroll chat to bottom
  React.useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [messages, chatMutation.isPending, genericMutation.isPending])

  // Reset & Auto-start when modal opens for a skill
  React.useEffect(() => {
    if (open && skill && clientId) {
      setMessages([])
      setInputVal("")
      setLivePreview(null)
      setFinalOutput(null)
      setIsDone(false)
      setIsSaved(false)
      setViewMode("preview")

      // Trigger automatic opening greeting
      chatMutation.mutate(
        { clientId, skillId: skill.id, messages: [] },
        {
          onSuccess: (res) => {
            if (res.reply) {
              setMessages([{ role: "assistant", content: res.reply }])
            }
            if (res.preview) setLivePreview(res.preview)
            if (res.done) {
              setIsDone(true)
              if (res.output) {
                setFinalOutput(res.output)
                autoSaveDocument(res.output, true)
              }
            }
          },
        }
      )
    }
  }, [open, skill?.id, clientId])

  const autoSaveDocument = React.useCallback(
    (doc: { title?: string; content: string }, isFinal: boolean = false) => {
      if (!skill || !clientId || !doc.content) return
      saveMutation.mutate(
        {
          clientId,
          skillId: skill.id,
          title: doc.title || skill.name,
          content: doc.content,
          stage: skill.category,
          status: isFinal ? "selesai" : "draft",
        },
        {
          onSuccess: () => {
            setIsSaved(true)
          },
        }
      )
    },
    [clientId, skill, saveMutation]
  )

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isSaved && activeDoc?.content && skill && clientId) {
      autoSaveDocument(activeDoc, isDone)
    }
    onOpenChange(newOpen)
  }

  const handleSend = () => {
    if (!inputVal.trim() || !skill || chatMutation.isPending) return

    const newMsg: SkillChatTurn = { role: "user", content: inputVal.trim() }
    const updatedMessages = [...messages, newMsg]
    setMessages(updatedMessages)
    setInputVal("")

    chatMutation.mutate(
      { clientId, skillId: skill.id, messages: updatedMessages },
      {
        onSuccess: (res) => {
          if (res.reply) {
            setMessages((prev) => [...prev, { role: "assistant", content: res.reply }])
          }
          if (res.preview) {
            setLivePreview(res.preview)
          }
          if (res.done) {
            setIsDone(true)
            if (res.output) {
              setFinalOutput(res.output)
              autoSaveDocument(res.output, true)
            }
          }
        },
      }
    )
  }

  const handleGenericRun = () => {
    if (!skill || !clientId || genericMutation.isPending || chatMutation.isPending) return
    const promptToRun = inputVal.trim()
    if (promptToRun) {
      setMessages((prev) => [...prev, { role: "user", content: promptToRun }])
      setInputVal("")
    }

    genericMutation.mutate(
      {
        clientId,
        skillId: skill.id,
        prompt: promptToRun,
        autoSave: false,
      },
      {
        onSuccess: (res) => {
          if (res.success && res.content) {
            const finalDoc = { title: res.title, content: res.content }
            setLivePreview(finalDoc)
            setFinalOutput(finalDoc)
            setIsDone(true)
            autoSaveDocument(finalDoc, true)
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: res.summary
                  ? `Playbook berhasil dieksekusi seketika!\n\n${res.summary}`
                  : "Playbook berhasil dieksekusi seketika. Silakan tinjau draf lengkap di panel kanan lalu simpan atau kirim ke Post Composer.",
              },
            ])
          }
        },
      }
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFinalizeAndSave = () => {
    if (!skill || !clientId) return
    const docToSave = finalOutput || livePreview
    if (!docToSave?.content) return
    autoSaveDocument(docToSave, true)
  }

  const handleSendToComposer = () => {
    const doc = finalOutput || livePreview
    if (!doc) return
    const url = `/admin/composer?${serializeComposerParams({
      clientId,
      title: doc.title,
      content: doc.content,
    })}`
    onOpenChange(false)
    router.push(url)
  }

  const handleCopyContent = () => {
    if (!activeDoc?.content) return
    void navigator.clipboard.writeText(activeDoc.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSuggestionClick = (text: string) => {
    setInputVal(text)
    inputRef.current?.focus()
  }

  if (!skill) return null

  // Suggestions for starter onboarding
  const suggestions =
    skill.id === "brand-profile" && messages.length <= 2
      ? [
          "Klinik perawatan & estetika modern terpercaya",
          "Brand kecantikan ramah & edukatif",
          "Solusi perawatan profesional hasil nyata",
        ]
      : []

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-6xl xl:max-w-7xl w-[96vw] h-[90vh] max-h-[920px] p-0 flex flex-col overflow-hidden bg-card/95 backdrop-blur-2xl border-border/50 shadow-2xl rounded-3xl">
        {/* Header Strip */}
        <DialogHeader className="px-6 py-3.5 border-b border-border/40 flex flex-row items-center justify-between space-y-0 bg-muted/20 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="size-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs shrink-0">
              <Icons.sparkles className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
                  <span>{skill.name}</span>
                </DialogTitle>
                <Badge variant="outline" className="text-2xs font-mono bg-muted/40 border-border/60">
                  {skill.category}
                </Badge>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold text-2xs border border-primary/20">
                  <Icons.building className="size-3" />
                  {clientName}
                </span>
              </div>
              <DialogDescription className="text-xs text-muted-foreground truncate mt-0.5">
                Klien: <span className="font-medium text-foreground">{clientName}</span> • {skill.job || skill.description}
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Live DNA Score Badge */}
            {activeDoc && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/80 border border-border/50 text-2xs shadow-xs">
                <span className="text-muted-foreground flex items-center gap-1 font-medium">
                  <Icons.activity className="size-3 text-primary" /> Skor DNA:
                </span>
                <span className="font-bold text-foreground">
                  <MetricTicker value={dnaScore} />%
                </span>
                <Progress value={dnaScore} className="h-1.5 w-14 bg-muted/60" />
              </div>
            )}

            {hasMcpTools && (
              <Badge variant="outline" className="text-xs bg-sky-500/10 text-sky-500 border-sky-500/20 gap-1.5 px-2.5 py-1">
                <Icons.share className="size-3" /> WoopSocial MCP
              </Badge>
            )}
            {isSaved ? (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 gap-1.5 px-3 py-1 font-medium shadow-xs">
                <Icons.check className="size-3.5" /> Tersimpan ke Klien
              </Badge>
            ) : isDone ? (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 gap-1.5 px-3 py-1 font-medium shadow-xs">
                <Icons.sparkles className="size-3.5" /> Selesai Siap Disimpan
              </Badge>
            ) : livePreview ? (
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1.5 px-3 py-1 animate-pulse font-medium">
                <Icons.edit className="size-3.5" /> Draf Langsung
              </Badge>
            ) : null}
          </div>
        </DialogHeader>

        {/* Split-Pane Content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-border/40">
          {/* Left Column: Interactive Chat (5 cols on lg) */}
          <div className="lg:col-span-5 flex flex-col h-full bg-background/50 min-h-0">
            {/* Chat Assistant Header Bar */}
            <div className="px-4 py-2.5 border-b border-border/30 bg-muted/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="size-6 rounded-lg bg-primary/15 text-primary flex items-center justify-center font-bold text-2xs">
                    <Icons.bot className="size-3.5" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-emerald-500 ring-2 ring-background" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    Wawancara Terpandu
                  </span>
                  <span className="text-2xs text-muted-foreground block -mt-0.5">
                    Agres · AI Brand Consultant
                  </span>
                </div>
              </div>
              <Badge variant="secondary" className="text-2xs font-medium px-2 py-0.5 bg-muted/40 text-muted-foreground">
                Langkah {messages.filter((m) => m.role === "user").length + 1}
              </Badge>
            </div>

            {/* Chat Messages Stream */}
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex flex-col text-xs leading-relaxed",
                    m.role === "user" ? "ml-auto items-end max-w-[85%]" : "mr-auto items-start max-w-[92%]"
                  )}
                >
                  {m.role === "assistant" ? (
                    <div className="flex items-start gap-2.5">
                      <div className="size-6 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                        <Icons.sparkles className="size-3.5" />
                      </div>
                      <div className="flex flex-col">
                        <div className="px-4 py-3 rounded-2xl rounded-tl-xs bg-card border border-border/50 text-foreground shadow-xs">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-xs">{children}</p>,
                              ul: ({ children }) => <ul className="my-2 space-y-1 pl-1 list-none text-xs">{children}</ul>,
                              ol: ({ children }) => <ol className="my-2 space-y-1 pl-4 list-decimal text-xs">{children}</ol>,
                              li: ({ children }) => (
                                <li className="flex items-start gap-1.5 leading-relaxed text-xs text-foreground/90">
                                  <span className="text-primary font-bold select-none">•</span>
                                  <div className="flex-1">{children}</div>
                                </li>
                              ),
                              strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                              blockquote: ({ children }) => (
                                <blockquote className="border-l-2 border-primary bg-primary/5 pl-3 py-1.5 rounded-r-xl my-2 text-foreground font-medium text-xs">
                                  {children}
                                </blockquote>
                              ),
                            }}
                          >
                            {m.content}
                          </ReactMarkdown>
                        </div>
                        <span className="text-2xs text-muted-foreground/70 mt-1 px-1">
                          AI Consultant
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-end">
                      <div className="px-4 py-2.5 rounded-2xl rounded-br-xs bg-primary text-primary-foreground shadow-xs font-medium">
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      </div>
                      <span className="text-2xs text-muted-foreground/70 mt-1 px-1">
                        Anda
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {chatMutation.isPending && (
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground p-3 rounded-2xl bg-card border border-border/40 shadow-xs w-fit animate-in fade-in">
                  <Icons.spinner className="size-3.5 animate-spin text-primary" />
                  <ShimmeringText text="Menyusun pertanyaan & memperbarui draf..." />
                </div>
              )}

              {genericMutation.isPending && (
                <div className="flex items-center gap-2.5 text-xs text-primary p-3 rounded-2xl bg-primary/5 border border-primary/20 shadow-xs w-fit animate-in fade-in">
                  <Icons.spinner className="size-3.5 animate-spin text-primary" />
                  <ShimmeringText text="Mengeksekusi playbook secara lengkap dengan AI..." />
                </div>
              )}
            </div>

            {/* Quick Inspiration Chips */}
            {suggestions.length > 0 && (
              <div className="px-4 py-2 border-t border-border/20 bg-muted/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                <span className="text-2xs text-muted-foreground shrink-0 font-medium flex items-center gap-1">
                  <Icons.sparkles className="size-2.5 text-primary" /> Saran:
                </span>
                {suggestions.map((sug, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSuggestionClick(sug)}
                    className="text-2xs px-2.5 py-1 rounded-full bg-card border border-border/50 text-foreground/80 hover:border-primary/40 hover:text-primary transition-all shrink-0 cursor-pointer shadow-2xs"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}

            {/* Chat Input Box */}
            <div className="p-3 border-t border-border/40 bg-card shrink-0">
              <div className="relative rounded-2xl border border-border/60 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20 transition-all bg-background shadow-xs">
                <Textarea
                  ref={inputRef}
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ketik jawaban atau arahan strategi... (Enter untuk kirim)"
                  rows={2}
                  disabled={chatMutation.isPending || genericMutation.isPending}
                  className="w-full resize-none border-0 shadow-none focus-visible:ring-0 text-xs p-3 min-h-[56px] max-h-[120px] placeholder:text-muted-foreground/60"
                />
                <div className="flex items-center justify-between px-3 py-1.5 border-t border-border/20 bg-muted/10 gap-2 rounded-b-2xl">
                  <span className="text-2xs text-muted-foreground/70 hidden sm:inline">
                    Shift+Enter untuk baris baru
                  </span>
                  <div className="flex items-center gap-2 ml-auto">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleGenericRun}
                      disabled={chatMutation.isPending || genericMutation.isPending}
                      isLoading={genericMutation.isPending}
                      className="h-7 px-2.5 text-xs gap-1.5 rounded-lg border-primary/30 text-primary hover:bg-primary/10 cursor-pointer shadow-2xs"
                      title="Jalankan playbook sekaligus tanpa melalui wawancara bertahap"
                    >
                      <Icons.sparkles className="size-3" /> Eksekusi Seketika
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSend}
                      disabled={!inputVal.trim() || chatMutation.isPending || genericMutation.isPending}
                      className="h-7 px-3 text-xs gap-1.5 rounded-lg cursor-pointer shadow-xs font-semibold"
                    >
                      Kirim <Icons.send className="size-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Draft Document Preview (7 cols on lg) */}
          <div className="lg:col-span-7 flex flex-col h-full bg-card min-h-0">
            {/* Header of document preview */}
            <div className="px-5 py-2.5 border-b border-border/30 bg-muted/10 flex items-center justify-between shrink-0 gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Icons.fileText className="size-3.5" />
                </div>
                <span className="text-xs font-bold text-foreground truncate">
                  {activeDoc?.title || "Pratinjau Dokumen Hasil"}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* View Mode Switcher */}
                {activeDoc && (
                  <div className="flex items-center rounded-lg bg-muted/40 p-0.5 border border-border/40 text-2xs">
                    <button
                      type="button"
                      onClick={() => setViewMode("preview")}
                      className={cn(
                        "px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer",
                        viewMode === "preview"
                          ? "bg-card text-foreground shadow-2xs font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Pratinjau Desain
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("markdown")}
                      className={cn(
                        "px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer",
                        viewMode === "markdown"
                          ? "bg-card text-foreground shadow-2xs font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Naskah (.md)
                    </button>
                  </div>
                )}

                {/* Copy Markdown Button */}
                {activeDoc && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyContent}
                    className="h-7 px-2 text-2xs text-muted-foreground hover:text-foreground gap-1 rounded-lg cursor-pointer"
                    title="Salin Naskah Markdown"
                  >
                    {copied ? (
                      <>
                        <Icons.check className="size-3 text-primary" />
                        <span className="text-primary font-medium">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Icons.copy className="size-3" />
                        <span>Salin</span>
                      </>
                    )}
                  </Button>
                )}

                {hasMcpTools && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleTestMcp}
                    disabled={mcpMutation.isPending}
                    className="h-7 text-xs gap-1.5 border-sky-500/30 text-sky-500 hover:bg-sky-500/10 rounded-lg cursor-pointer"
                  >
                    {mcpMutation.isPending ? (
                      <Icons.spinner className="size-3 animate-spin" />
                    ) : (
                      <Icons.share className="size-3" />
                    )}
                    Cek Akun MCP
                  </Button>
                )}

                {isSaved && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSendToComposer}
                    className="h-7 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/5 rounded-lg cursor-pointer font-medium"
                  >
                    <Icons.edit className="size-3" /> Buat Postingan
                  </Button>
                )}

                {isDone && !isSaved && (
                  <Button
                    size="sm"
                    onClick={handleFinalizeAndSave}
                    disabled={saveMutation.isPending}
                    isLoading={saveMutation.isPending}
                    className="h-7 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-xs rounded-lg cursor-pointer"
                  >
                    <Icons.check className="size-3.5" /> Finalisasi & Simpan
                  </Button>
                )}
              </div>
            </div>

            {/* MCP Feedback Bar */}
            {mcpFeedback && (
              <div className="px-5 py-2 bg-sky-500/10 border-b border-sky-500/20 text-xs text-sky-600 dark:text-sky-400 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-1.5">
                  <Icons.info className="size-3.5" />
                  <span>{mcpFeedback}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMcpFeedback(null)}
                  className="text-muted-foreground hover:text-foreground text-2xs cursor-pointer"
                >
                  <Icons.close className="size-3" />
                </button>
              </div>
            )}

            {/* Document Body */}
            <div className="flex-1 overflow-y-auto p-5 lg:p-6">
              {activeDoc?.content ? (
                <div className="space-y-4 max-w-3xl mx-auto">
                  {/* Executive Blueprint Banner Card */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-card to-muted/20 border border-border/50 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-foreground text-sm tracking-tight">
                          {activeDoc.title || skill.name}
                        </p>
                        <Badge variant="outline" className="text-2xs font-mono bg-background/50">
                          v1.0
                        </Badge>
                      </div>
                      <p className="text-2xs text-muted-foreground">
                        Disusun otomatis untuk <span className="text-foreground font-medium">{clientName}</span> berdasarkan aturan {skill.name}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {isDone ? (
                        <Badge className="bg-primary/15 border border-primary/30 text-primary text-2xs font-semibold px-2.5 py-0.5">
                          Lengkap
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-500 border-amber-500/30 text-2xs font-medium px-2.5 py-0.5">
                          Draft In Progress
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Document Rendered Content */}
                  {viewMode === "preview" ? (
                    <div className="p-6 rounded-2xl bg-background/80 border border-border/40 shadow-xs space-y-4">
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => (
                            <h1 className="text-base font-extrabold text-foreground border-b border-border/40 pb-2 mb-3 tracking-tight">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-xs font-bold uppercase tracking-wider text-primary border-t border-border/30 pt-4 mt-5 mb-2.5 flex items-center gap-2">
                              <span className="size-1.5 rounded-full bg-primary inline-block" />
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-xs font-semibold text-foreground mt-3 mb-1.5 flex items-center gap-1.5">
                              {children}
                            </h3>
                          ),
                          p: ({ children }) => (
                            <p className="text-xs text-muted-foreground leading-relaxed mb-2.5">
                              {children}
                            </p>
                          ),
                          ul: ({ children }) => (
                            <ul className="space-y-2 mb-3 text-xs pl-0.5 list-none">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="space-y-1.5 mb-3 text-xs pl-4 list-decimal text-muted-foreground">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => {
                            // Check if children contain bullet key-value
                            return (
                              <li className="leading-relaxed text-xs text-foreground/90 flex items-start gap-2 bg-card/40 p-2 rounded-xl border border-border/30">
                                <span className="size-1.5 rounded-full bg-primary/60 shrink-0 mt-1.5" />
                                <div className="flex-1 space-y-0.5">
                                  {children}
                                </div>
                              </li>
                            )
                          },
                          strong: ({ children }) => (
                            <strong className="font-semibold text-foreground text-xs">{children}</strong>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-2 border-primary/50 bg-primary/5 pl-3 py-2 rounded-r-xl italic text-xs text-foreground/90 my-2.5">
                              {children}
                            </blockquote>
                          ),
                          table: ({ children }) => (
                            <div className="overflow-x-auto my-3 rounded-xl border border-border/40">
                              <table className="w-full text-xs text-left border-collapse">{children}</table>
                            </div>
                          ),
                          th: ({ children }) => (
                            <th className="bg-muted/40 p-2.5 font-bold text-foreground border-b border-border/40 text-2xs uppercase">
                              {children}
                            </th>
                          ),
                          td: ({ children }) => (
                            <td className="p-2.5 border-b border-border/20 text-muted-foreground text-xs">
                              {children}
                            </td>
                          ),
                          code: ({ children }) => (
                            <code className="bg-muted px-1.5 py-0.5 rounded text-2xs font-mono text-foreground font-semibold">
                              {children}
                            </code>
                          ),
                        }}
                      >
                        {sanitizeMarkdown(activeDoc.content)}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    /* Raw Markdown Source View */
                    <div className="rounded-2xl border border-border/40 bg-muted/20 overflow-hidden shadow-xs">
                      <div className="px-4 py-2 border-b border-border/30 bg-muted/30 flex items-center justify-between text-2xs text-muted-foreground">
                        <span className="font-mono">blueprint.md</span>
                        <span>{activeDoc.content.length} karakter</span>
                      </div>
                      <pre className="p-4 text-2xs font-mono text-foreground/90 leading-relaxed overflow-x-auto whitespace-pre-wrap selection:bg-primary/20">
                        {activeDoc.content}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 text-muted-foreground space-y-3.5">
                  <div className="size-14 rounded-3xl bg-muted/40 border border-border/40 flex items-center justify-center text-muted-foreground/60 shadow-xs">
                    <Icons.fileText className="size-7" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Menunggu Dokumen</p>
                    <p className="text-xs max-w-sm mt-1 text-muted-foreground leading-relaxed">
                      Draf strategi akan mulai muncul otomatis di panel ini begitu AI mengumpulkan informasi awal dari wawancara Anda.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
