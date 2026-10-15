"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/animate-ui/components/radix/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/animate-ui/components/radix/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Icons } from "@/components/icons"
import { MetricTicker } from "@/components/animate-ui/components/texts/metric-ticker"
import { StatusBadge } from "@/components/deliverable/status-badge"
import {
  useClientSkills,
  useSkillPacks,
  useAssignPackToClient,
  useClientSkillOutputs,
} from "@/features/skills/api/queries"
import {
  usePromoteSkillOutputToDeliverable,
  useUpdateDeliverableStatus,
} from "@/features/deliverables/api/queries"
import type { Skill, SkillOutput } from "@/features/skills/api/types"
import type { Deliverable } from "@/features/deliverables/api/types"
import { ScheduleDeliverableDialog } from "@/components/deliverable/schedule-deliverable-dialog"
import { ExportPdfDialog } from "@/components/deliverable/export-pdf-dialog"
import { SkillInterviewModal } from "@/components/skills/skill-interview-modal"
import { serializeComposerParams } from "@/lib/searchparams"
import { cn } from "@/lib/utils"

interface ClientPlaybooksDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  clientName: string
}

export function ClientPlaybooksDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
}: ClientPlaybooksDialogProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = React.useState<"assigned" | "packs" | "outputs">("assigned")

  // For Interview Modal
  const [selectedSkillForInterview, setSelectedSkillForInterview] = React.useState<Skill | null>(null)
  const [interviewOpen, setInterviewOpen] = React.useState(false)

  // For Document Preview
  const [viewingOutput, setViewingOutput] = React.useState<SkillOutput | null>(null)
  const [schedulingDeliverable, setSchedulingDeliverable] = React.useState<Deliverable | null>(null)
  const [exportingPdfDoc, setExportingPdfDoc] = React.useState<{ id: string; title: string; content_md: string; created_at: string } | null>(null)

  const { data: clientSkills = [], isLoading: loadingClientSkills } = useClientSkills(clientId)
  const { data: packs = [], isLoading: loadingPacks } = useSkillPacks()
  const { data: outputs = [], isLoading: loadingOutputs } = useClientSkillOutputs(clientId)
  const assignPackMutation = useAssignPackToClient()
  const promoteMutation = usePromoteSkillOutputToDeliverable()
  const updateStatusMutation = useUpdateDeliverableStatus()

  const completedCount = clientSkills.filter((cs) => cs.status === "selesai").length
  const inProgressCount = clientSkills.filter((cs) => cs.status === "jalan").length
  const totalAssigned = clientSkills.length

  const handleOpenInterview = (skill: Skill) => {
    setSelectedSkillForInterview(skill)
    setInterviewOpen(true)
  }

  const handleSendToComposer = (doc: SkillOutput) => {
    const url = serializeComposerParams("/admin/composer", {
      clientId,
      title: doc.title,
      content: doc.content,
    })
    onOpenChange(false)
    router.push(url)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl w-[95vw] h-[85vh] max-h-[850px] p-0 flex flex-col overflow-hidden bg-card border-border/50 shadow-2xl rounded-2xl">
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b border-border/40 flex flex-row items-center justify-between space-y-0 bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Icons.bookOpen className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold text-foreground">
                  Strategi & Playbooks — {clientName}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Kelola paket strategi, eksekusi playbook terpandu, dan pantau hasil dokumen untuk klien ini.
                </DialogDescription>
              </div>
            </div>

            {/* Metric Badges */}
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded-xl bg-muted/40 border border-border/30 text-xs flex items-center gap-1.5 font-medium">
                <span className="text-muted-foreground">Selesai:</span>
                <span className="text-emerald-500 font-bold">
                  <MetricTicker value={completedCount} />
                </span>
                <span className="text-muted-foreground/60">/ {totalAssigned}</span>
              </div>
            </div>
          </DialogHeader>

          {/* Navigation Tabs */}
          <div className="flex-1 flex flex-col min-h-0">
            <Tabs
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as any)}
              className="flex-1 flex flex-col min-h-0"
            >
              <div className="px-6 pt-3 border-b border-border/30 bg-background/50">
                <TabsList className="flex items-center gap-1 p-1 bg-muted/30 rounded-xl border border-border/40 w-fit">
                  <TabsTrigger
                    value="assigned"
                    onClick={() => setActiveTab("assigned")}
                    className="text-xs px-3.5 py-1.5 rounded-lg font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs"
                  >
                    <Icons.listChecks className="size-3.5 mr-1.5 text-primary" />
                    Playbook Aktif ({totalAssigned})
                  </TabsTrigger>
                  <TabsTrigger
                    value="packs"
                    onClick={() => setActiveTab("packs")}
                    className="text-xs px-3.5 py-1.5 rounded-lg font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs"
                  >
                    <Icons.inbox className="size-3.5 mr-1.5 text-primary" />
                    Tugaskan Paket (17)
                  </TabsTrigger>
                  <TabsTrigger
                    value="outputs"
                    onClick={() => setActiveTab("outputs")}
                    className="text-xs px-3.5 py-1.5 rounded-lg font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs"
                  >
                    <Icons.fileText className="size-3.5 mr-1.5 text-primary" />
                    Riwayat Dokumen ({outputs.length})
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* TAB 1: ASSIGNED PLAYBOOKS */}
              <TabsContent value="assigned" className="flex-1 overflow-y-auto p-6 space-y-4 m-0">
                {loadingClientSkills ? (
                  <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
                    <Icons.spinner className="size-5 animate-spin mx-auto text-primary" />
                    <p>Memuat daftar playbook aktif...</p>
                  </div>
                ) : clientSkills.length === 0 ? (
                  <div className="p-12 text-center text-xs text-muted-foreground rounded-2xl bg-card border border-border/40 space-y-3">
                    <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                      <Icons.bookOpen className="size-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">Belum Ada Playbook Ditugaskan</p>
                      <p className="text-[11px] max-w-sm mx-auto mt-1 text-muted-foreground">
                        Klien {clientName} belum memiliki paket strategi aktif. Pilih dari 17 paket solusi teruji kami untuk memulai.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setActiveTab("packs")}
                      className="text-xs rounded-xl gap-1.5 shadow-xs"
                    >
                      <Icons.sparkles className="size-3.5" /> Pilih Paket Solusi Pertama
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground pb-1">
                      <span>Daftar Playbook ({totalAssigned} item)</span>
                      <span>
                        {completedCount} Selesai • {inProgressCount} Dalam Proses
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {clientSkills.map((cs) => {
                        const skill = cs.skill
                        if (!skill) return null
                        return (
                          <div
                            key={cs.id}
                            className="p-4 rounded-xl bg-card border border-border/40 hover:border-primary/40 transition-all flex flex-col justify-between shadow-xs"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <Badge variant="outline" className="text-[10px] font-mono">
                                  {skill.category}
                                </Badge>
                                {cs.status === "selesai" ? (
                                  <span className="text-[10px] font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Icons.check className="size-2.5" /> Selesai
                                  </span>
                                ) : cs.status === "jalan" ? (
                                  <span className="text-[10px] font-medium text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Icons.edit className="size-2.5" /> Sedang Jalan
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-medium text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full">
                                    Belum Dimulai
                                  </span>
                                )}
                              </div>

                              <h4 className="text-xs font-semibold text-foreground">
                                {skill.name}
                              </h4>
                              <p className="text-[11px] text-muted-foreground line-clamp-2">
                                {skill.job || skill.description}
                              </p>
                            </div>

                            <div className="pt-3 mt-3 border-t border-border/30 flex items-center justify-between">
                              <span className="text-[10px] text-muted-foreground/60 font-mono">
                                #{skill.id}
                              </span>
                              <Button
                                size="sm"
                                onClick={() => handleOpenInterview(skill)}
                                className="h-7 text-xs px-3 rounded-lg gap-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 shadow-none transition-all"
                              >
                                <Icons.play className="size-3" />
                                {cs.status === "selesai" ? "Jalankan Ulang" : "Mulai Wawancara"}
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* TAB 2: ASSIGN NEW PACKS */}
              <TabsContent value="packs" className="flex-1 overflow-y-auto p-6 space-y-4 m-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-foreground">
                      Katalog 17 Paket Solusi Teruji
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Tugaskan paket untuk menambahkan kumpulan playbook terpadu ke workspace {clientName}.
                    </p>
                  </div>
                </div>

                {loadingPacks ? (
                  <div className="p-12 text-center text-xs text-muted-foreground">
                    <Icons.spinner className="size-5 animate-spin mx-auto text-primary mb-2" />
                    Memuat paket...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {packs.map((pack) => (
                      <div
                        key={pack.id}
                        className="p-4 rounded-xl bg-card border border-border/40 hover:border-primary/40 transition-all flex flex-col justify-between shadow-xs"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-medium text-primary px-2 py-0.5 rounded-full bg-primary/10">
                              {pack.category || "Social Media"}
                            </span>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {pack.skill_count} Playbook
                            </span>
                          </div>
                          <h4 className="text-xs font-semibold text-foreground">{pack.name}</h4>
                          <p className="text-[11px] text-muted-foreground line-clamp-2">
                            {pack.description}
                          </p>
                        </div>

                        <div className="pt-3 mt-3 border-t border-border/30 flex items-center justify-end">
                          <Button
                            size="sm"
                            onClick={() => assignPackMutation.mutate({ clientId, packId: pack.id })}
                            disabled={assignPackMutation.isPending}
                            className="text-xs h-7 px-3 rounded-lg gap-1.5 shadow-none"
                          >
                            <Icons.add className="size-3" /> Tugaskan ke Klien
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* TAB 3: OUTPUT DOCUMENTS HISTORY */}
              <TabsContent value="outputs" className="flex-1 overflow-y-auto p-6 space-y-4 m-0">
                {loadingOutputs ? (
                  <div className="p-12 text-center text-xs text-muted-foreground">
                    <Icons.spinner className="size-5 animate-spin mx-auto text-primary mb-2" />
                    Memuat riwayat dokumen...
                  </div>
                ) : outputs.length === 0 ? (
                  <div className="p-12 text-center text-xs text-muted-foreground rounded-2xl bg-card border border-border/40">
                    <Icons.fileText className="size-8 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="font-medium text-foreground">Belum Ada Dokumen Strategi</p>
                    <p className="text-[11px] mt-1">
                      Hasil dari wawancara playbook yang telah difinalisasi akan otomatis tersimpan di sini.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {outputs.map((doc) => {
                      const isPromoted = Boolean(doc.deliverable_id)
                      const deliverableStatus = (doc.status as any) || "draft"

                      return (
                        <div
                          key={doc.id}
                          className="p-4 rounded-xl bg-card border border-border/40 hover:border-primary/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs"
                        >
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-xs text-foreground">
                                {doc.title}
                              </span>
                              <Badge variant="outline" className="text-[10px] font-mono">
                                {doc.skill_id}
                              </Badge>
                              {isPromoted ? (
                                <StatusBadge status={deliverableStatus} />
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border/30">
                                  Draf Internal
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              Disimpan pada: {new Date(doc.created_at).toLocaleDateString("id-ID", { dateStyle: "medium" })}
                              {isPromoted && " • Terhubung ke Deliverable Klien"}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setViewingOutput(doc)}
                              className="h-7 text-xs rounded-lg gap-1"
                            >
                              <Icons.eye className="size-3" /> Baca Dokumen
                            </Button>

                            {!isPromoted ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => promoteMutation.mutate({ outputId: doc.id, clientId })}
                                disabled={promoteMutation.isPending}
                                className="h-7 text-xs rounded-lg gap-1 border-primary/30 text-primary hover:bg-primary/10"
                              >
                                <Icons.send className="size-3" /> Kirim ke Client
                              </Button>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const reviewUrl = `${window.location.origin}/review/${doc.deliverable_id}`
                                    navigator.clipboard.writeText(reviewUrl)
                                    toast.success("Link Review Klien Disalin!", {
                                      description: "Tautan siap dibagikan ke WhatsApp Pak Adit / Bunda.",
                                    })
                                  }}
                                  className="h-7 text-xs rounded-lg gap-1 border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10"
                                >
                                  <Icons.link className="size-3" /> Salin Link Review
                                </Button>

                                {deliverableStatus === "sent" && (
                                  <div className="flex items-center gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        updateStatusMutation.mutate({
                                          deliverableId: doc.deliverable_id!,
                                          clientId,
                                          status: "approved",
                                        })
                                      }
                                      disabled={updateStatusMutation.isPending}
                                      className="h-7 text-xs rounded-lg gap-1 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 border-emerald-500/30"
                                    >
                                      <Icons.check className="size-3" /> Setujui
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        updateStatusMutation.mutate({
                                          deliverableId: doc.deliverable_id!,
                                          clientId,
                                          status: "revision_requested",
                                        })
                                      }
                                      disabled={updateStatusMutation.isPending}
                                      className="h-7 text-xs rounded-lg gap-1 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 border-amber-500/30"
                                    >
                                      <Icons.refresh className="size-3" /> Minta Revisi
                                    </Button>
                                  </div>
                                )}
                                {deliverableStatus === "approved" && (
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      setSchedulingDeliverable({
                                        id: doc.deliverable_id!,
                                        client_id: clientId,
                                        title: doc.title,
                                        content_md: doc.content,
                                        type: "content",
                                        status: "approved",
                                        external_link: null,
                                        created_by: null,
                                        updated_by: null,
                                        created_at: doc.created_at,
                                        updated_at: doc.created_at,
                                        sent_at: null,
                                        approved_at: null,
                                      })
                                    }
                                    className="h-7 text-xs rounded-lg gap-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                                  >
                                    <Icons.calendar className="size-3" /> Jadwalkan
                                  </Button>
                                )}
                              </>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setExportingPdfDoc({
                                id: doc.id,
                                title: doc.title,
                                content_md: doc.content,
                                created_at: doc.created_at,
                              })}
                              className="h-7 text-xs rounded-lg gap-1 border-border/50 text-muted-foreground hover:text-foreground"
                              title="Ekspor Dokumen ke Format PDF Eksekutif"
                            >
                              <Icons.fileTypePdf className="size-3 text-red-500" /> PDF
                            </Button>

                            <Button
                              size="sm"
                              onClick={() => handleSendToComposer(doc)}
                              className="h-7 text-xs rounded-lg gap-1 bg-primary text-primary-foreground"
                            >
                              <Icons.edit className="size-3" /> Buat Postingan
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Reader Dialog */}
      {viewingOutput && (
        <Dialog open={Boolean(viewingOutput)} onOpenChange={(o) => !o && setViewingOutput(null)}>
          <DialogContent className="max-w-3xl w-[90vw] max-h-[85vh] flex flex-col p-6 rounded-2xl bg-card border-border/50">
            <DialogHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <DialogTitle className="text-base font-semibold">{viewingOutput.title}</DialogTitle>
                  <DialogDescription className="text-xs mt-0.5">
                    Dokumen strategi playbook #{viewingOutput.skill_id}
                  </DialogDescription>
                </div>
                {viewingOutput.deliverable_id ? (
                  <StatusBadge status={(viewingOutput.status as any) || "sent"} />
                ) : (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border/30">
                    Draf Internal
                  </span>
                )}
              </div>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto mt-4 p-4 rounded-xl bg-muted/20 border border-border/30 text-xs leading-relaxed whitespace-pre-wrap font-sans">
              {viewingOutput.content}
            </div>
            <div className="mt-4 flex items-center justify-between gap-2 flex-wrap">
              <div>
                {!viewingOutput.deliverable_id && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      promoteMutation.mutate({ outputId: viewingOutput.id, clientId })
                      setViewingOutput(null)
                    }}
                    disabled={promoteMutation.isPending}
                    className="h-8 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                  >
                    <Icons.send className="size-3.5" /> Kirim ke Client Sekarang
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setExportingPdfDoc({
                    id: viewingOutput.id,
                    title: viewingOutput.title,
                    content_md: viewingOutput.content,
                    created_at: viewingOutput.created_at,
                  })}
                  className="h-8 text-xs gap-1.5"
                >
                  <Icons.fileTypePdf className="size-3.5 text-red-500" /> Ekspor PDF
                </Button>
                <Button size="sm" variant="outline" onClick={() => setViewingOutput(null)} className="h-8 text-xs">
                  Tutup
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    handleSendToComposer(viewingOutput)
                    setViewingOutput(null)
                  }}
                  className="h-8 text-xs gap-1.5"
                >
                  <Icons.edit className="size-3" /> Buat Postingan dari Dokumen Ini
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Skill Interview Modal */}
      <SkillInterviewModal
        open={interviewOpen}
        onOpenChange={setInterviewOpen}
        skill={selectedSkillForInterview}
        clientId={clientId}
        clientName={clientName}
      />

      {/* Schedule Deliverable Dialog */}
      <ScheduleDeliverableDialog
        open={Boolean(schedulingDeliverable)}
        onOpenChange={(open) => !open && setSchedulingDeliverable(null)}
        deliverable={schedulingDeliverable}
        clientId={clientId}
      />

      {/* Export PDF Modal */}
      <ExportPdfDialog
        open={Boolean(exportingPdfDoc)}
        onOpenChange={(open) => !open && setExportingPdfDoc(null)}
        deliverable={exportingPdfDoc}
        clientName={clientName}
      />
    </>
  )
}
