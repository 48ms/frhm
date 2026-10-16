"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
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
import { Icons } from "@/components/icons"
import { ShimmeringText } from "@/components/animate-ui/components/texts/shimmering-text"
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

  const hasMcpTools = Boolean(
    skill?.allowed_tools?.toLowerCase().includes("woopsocial") ||
    skill?.id === "scheduling-and-queue"
  )

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
  }, [messages, chatMutation.isPending])

  // Reset & Auto-start when modal opens for a skill
  React.useEffect(() => {
    if (open && skill && clientId) {
      setMessages([])
      setInputVal("")
      setLivePreview(null)
      setFinalOutput(null)
      setIsDone(false)
      setIsSaved(false)

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
              if (res.output) setFinalOutput(res.output)
            }
          },
        }
      )
    }
  }, [open, skill?.id, clientId])

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
            if (res.output) setFinalOutput(res.output)
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
            setLivePreview({ title: res.title, content: res.content })
            setFinalOutput({ title: res.title, content: res.content })
            setIsDone(true)
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

    saveMutation.mutate(
      {
        clientId,
        skillId: skill.id,
        title: docToSave.title || skill.name,
        content: docToSave.content,
        stage: skill.category,
        status: "draft",
      },
      {
        onSuccess: () => {
          setIsSaved(true)
        },
      }
    )
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

  if (!skill) return null

  const activeDoc = finalOutput || livePreview

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[95vw] h-[88vh] max-h-[900px] p-0 flex flex-col overflow-hidden bg-card/95 backdrop-blur-2xl border-border/50 shadow-2xl rounded-3xl">
        {/* Header Strip */}
        <DialogHeader className="px-6 py-4 border-b border-border/40 flex flex-row items-center justify-between space-y-0 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Icons.sparkles className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-base font-semibold text-foreground">
                  {skill.name}
                </DialogTitle>
                <Badge variant="outline" className="text-xs font-mono bg-muted/40">
                  {skill.category}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground line-clamp-1">
                Klien: <span className="font-medium text-foreground">{clientName}</span> • {skill.job || skill.description}
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasMcpTools && (
              <Badge variant="outline" className="text-xs bg-sky-500/10 text-sky-500 border-sky-500/20 gap-1.5 px-2.5 py-1">
                <Icons.share className="size-3" /> WoopSocial MCP
              </Badge>
            )}
            {isSaved ? (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 gap-1.5 px-3 py-1">
                <Icons.check className="size-3.5" /> Tersimpan ke Klien
              </Badge>
            ) : isDone ? (
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 gap-1.5 px-3 py-1">
                <Icons.sparkles className="size-3.5" /> Selesai Siap Disimpan
              </Badge>
            ) : livePreview ? (
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1.5 px-3 py-1 animate-pulse">
                <Icons.edit className="size-3.5" /> Draf Langsung
              </Badge>
            ) : null}
          </div>
        </DialogHeader>

        {/* Split-Pane Content */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-border/40">
          {/* Left Column: Interactive Chat (5 cols) */}
          <div className="md:col-span-5 flex flex-col h-full bg-background/50">
            <div className="px-4 py-2.5 border-b border-border/30 bg-muted/10 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Icons.message className="size-3.5 text-primary" /> Wawancara Terpandu
              </span>
              <span className="text-1xs text-muted-foreground/70">
                Langkah {messages.filter((m) => m.role === "user").length + 1}
              </span>
            </div>

            {/* Chat Messages Log */}
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex flex-col max-w-[88%] text-xs leading-relaxed",
                    m.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div
                    className={cn(
                      "px-3.5 py-2.5 rounded-2xl",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-xs shadow-xs"
                        : "bg-muted/70 text-foreground border border-border/40 rounded-bl-xs"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                  <span className="text-2xs text-muted-foreground/60 mt-1 px-1">
                    {m.role === "user" ? "Anda" : "AI Consultant"}
                  </span>
                </div>
              ))}

              {chatMutation.isPending && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 rounded-xl bg-muted/30 border border-border/30 w-fit">
                  <Icons.spinner className="size-3.5 animate-spin text-primary" />
                  <ShimmeringText text="Menyusun pertanyaan & memperbarui draf..." />
                </div>
              )}

              {genericMutation.isPending && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground p-3 rounded-xl bg-primary/5 border border-primary/20 w-fit">
                  <Icons.spinner className="size-3.5 animate-spin text-primary" />
                  <ShimmeringText text="Mengeksekusi playbook secara lengkap dengan AI..." />
                </div>
              )}
            </div>

            {/* Chat Input Box */}
            <div className="p-3 border-t border-border/40 bg-card">
              <div className="relative rounded-xl border border-border/60 focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/30 transition-all bg-background">
                <Textarea
                  ref={inputRef}
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ketik jawaban atau brief... (Enter untuk kirim)"
                  rows={2}
                  disabled={chatMutation.isPending || genericMutation.isPending}
                  className="w-full resize-none border-0 shadow-none focus-visible:ring-0 text-xs p-3 min-h-[56px] max-h-[120px]"
                />
                <div className="flex items-center justify-between px-3 py-1.5 border-t border-border/20 bg-muted/10 gap-2">
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
                      className="h-7 px-2.5 text-xs gap-1.5 rounded-lg border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
                      title="Jalankan playbook sekaligus tanpa melalui wawancara bertahap"
                    >
                      <Icons.sparkles className="size-3" /> Eksekusi Seketika
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSend}
                      disabled={!inputVal.trim() || chatMutation.isPending || genericMutation.isPending}
                      className="h-7 px-3 text-xs gap-1.5 rounded-lg cursor-pointer"
                    >
                      Kirim <Icons.send className="size-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Draft Document Preview (7 cols) */}
          <div className="md:col-span-7 flex flex-col h-full bg-card">
            {/* Header of document preview */}
            <div className="px-5 py-2.5 border-b border-border/30 bg-muted/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icons.fileText className="size-3.5 text-primary" />
                <span className="text-xs font-semibold text-foreground">
                  {activeDoc?.title || "Pratinjau Dokumen Hasil"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {hasMcpTools && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleTestMcp}
                    disabled={mcpMutation.isPending}
                    className="h-7 text-xs gap-1.5 border-sky-500/30 text-sky-500 hover:bg-sky-500/10"
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
                    className="h-7 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/5"
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
                    className="h-7 text-xs gap-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-xs"
                  >
                    <Icons.check className="size-3" /> Finalisasi & Simpan
                  </Button>
                )}
              </div>
            </div>

            {/* MCP Feedback Bar */}
            {mcpFeedback && (
              <div className="px-5 py-2 bg-sky-500/10 border-b border-sky-500/20 text-xs text-sky-600 dark:text-sky-400 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Icons.info className="size-3.5" />
                  <span>{mcpFeedback}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMcpFeedback(null)}
                  className="text-muted-foreground hover:text-foreground text-2xs"
                >
                  <Icons.close className="size-3" />
                </button>
              </div>
            )}

            {/* Document Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeDoc?.content ? (
                <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed space-y-4">
                  <div className="p-4 rounded-xl bg-muted/20 border border-border/40 mb-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground text-sm">
                        {activeDoc.title || skill.name}
                      </p>
                      <p className="text-1xs text-muted-foreground mt-0.5">
                        Disusun otomatis untuk {clientName} berdasarkan aturan {skill.name}
                      </p>
                    </div>
                    {isDone ? (
                      <Badge className="bg-primary/15 border border-primary/30 text-primary text-2xs">Lengkap</Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-500 border-amber-500/30 text-2xs">
                        Draft In Progress
                      </Badge>
                    )}
                  </div>

                  <div className="whitespace-pre-wrap font-sans text-foreground/90 selection:bg-primary/20 bg-background/50 p-4 rounded-xl border border-border/30">
                    {activeDoc.content}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground space-y-3">
                  <div className="size-12 rounded-2xl bg-muted/40 border border-border/40 flex items-center justify-center text-muted-foreground/60">
                    <Icons.fileText className="size-6" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">Menunggu Dokumen</p>
                    <p className="text-1xs max-w-xs mt-1 text-muted-foreground">
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
