"use client"

import * as React from "react"
import { useQueryState, parseAsString } from "nuqs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Icons } from "@/components/icons"
import { MetricTicker } from "@/components/animate-ui/components/texts/metric-ticker"
import { ShimmeringText } from "@/components/animate-ui/components/texts/shimmering-text"
import {
  useSkills,
  useSkillPacks,
  useClientSkills,
  useAssignPackToClient,
} from "@/features/skills/api/queries"
import type { Skill, SkillPack } from "@/features/skills/api/types"
import { SkillInterviewModal } from "./skill-interview-modal"
import { cn } from "@/lib/utils"

const CATEGORIES = [
  { id: "all", label: "Semua Kategori" },
  { id: "Foundation & strategy", label: "Fondasi & Strategi" },
  { id: "Planning", label: "Perencanaan Konten" },
  { id: "Ideas & content angles", label: "Ide & Sudut Pandang" },
  { id: "Copy & captions", label: "Penulisan Copy & Hook" },
  { id: "Video scripts", label: "Naskah Video" },
  { id: "Visual & design", label: "Desain Visual & Prompt" },
  { id: "AI video", label: "Produksi Video AI" },
  { id: "Voice & music", label: "Audio & Voiceover" },
  { id: "Distribution & monetization", label: "Distribusi & Monetisasi" },
  { id: "Platform growth", label: "Pertumbuhan Saluran" },
  { id: "Publishing & measurement", label: "Publikasi & Metrik" },
  { id: "Editing & clipping", label: "Editing & Klip" },
  { id: "Community & operations", label: "Komunitas & Operasional" },
]

interface SkillCatalogViewProps {
  clientId: string
  clientName: string
}

export function SkillCatalogView({ clientId, clientName }: SkillCatalogViewProps) {
  // URL State via nuqs
  const [activeCategory, setActiveCategory] = useQueryState(
    "category",
    parseAsString.withDefault("all")
  )
  const [searchQuery, setSearchQuery] = useQueryState(
    "search",
    parseAsString.withDefault("")
  )
  const [selectedPackId, setSelectedPackId] = useQueryState(
    "pack",
    parseAsString.withDefault("all")
  )
  const [viewMode, setViewMode] = React.useState<"packs" | "all">("packs")

  // Selected skill for Interview Modal
  const [activeSkill, setActiveSkill] = React.useState<Skill | null>(null)
  const [modalOpen, setModalOpen] = React.useState(false)

  // TanStack Queries
  const { data: skills = [], isLoading: loadingSkills } = useSkills({
    category: activeCategory !== "all" ? activeCategory : undefined,
    search: searchQuery || undefined,
    packId: selectedPackId !== "all" ? selectedPackId : undefined,
  })

  const { data: packs = [], isLoading: loadingPacks } = useSkillPacks()
  const { data: clientSkills = [] } = useClientSkills(clientId)
  const assignPackMutation = useAssignPackToClient()

  // Status mapping for quick lookup
  const clientSkillMap = React.useMemo(() => {
    const map = new Map<string, string>()
    for (const cs of clientSkills) {
      map.set(cs.skill_id, cs.status)
    }
    return map
  }, [clientSkills])

  const handleOpenInterview = (skill: Skill) => {
    setActiveSkill(skill)
    setModalOpen(true)
  }

  const handleAssignPack = (packId: string) => {
    if (!clientId) return
    assignPackMutation.mutate({ clientId, packId })
  }

  return (
    <div className="space-y-6">
      {/* Top Controls Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border/40 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Icons.search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value || null)}
            placeholder="Cari dari 106 playbooks (nama, topik, atau fungsi)..."
            className="pl-10 text-xs h-9 bg-background/60 rounded-xl border-border/60"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery(null)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-muted/30 border border-border/40 rounded-xl">
          <Button
            size="sm"
            variant={viewMode === "packs" ? "default" : "ghost"}
            onClick={() => {
              setViewMode("packs")
              setSelectedPackId("all")
            }}
            className="h-7 text-xs px-3 rounded-lg gap-1.5 shadow-none"
          >
            <Icons.inbox className="size-3.5" /> 17 Paket Solusi
          </Button>
          <Button
            size="sm"
            variant={viewMode === "all" ? "default" : "ghost"}
            onClick={() => setViewMode("all")}
            className="h-7 text-xs px-3 rounded-lg gap-1.5 shadow-none"
          >
            <Icons.sparkles className="size-3.5" /> Semua 106 Playbook
          </Button>
        </div>
      </div>

      {/* VIEW MODE 1: 17 TOPIC PACKS */}
      {viewMode === "packs" && selectedPackId === "all" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Paket Solusi Strategis (Topic Packs)
              </h3>
              <p className="text-xs text-muted-foreground">
                Kumpulan playbook yang dirancang untuk mencapai satu target bisnis spesifik bagi {clientName}.
              </p>
            </div>
            <Badge variant="outline" className="text-xs font-mono">
              17 Paket Tersedia
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packs.map((pack) => {
              const isAssigned = (pack.skills ?? []).some((s) => clientSkillMap.has(s.id))
              return (
                <div
                  key={pack.id}
                  className="p-5 rounded-2xl bg-card border border-border/40 hover:border-primary/40 transition-all flex flex-col justify-between group shadow-xs hover:shadow-md"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-primary px-2.5 py-0.5 rounded-full bg-primary/10">
                        {pack.category || "Social Media"}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {pack.skill_count} Playbook
                      </span>
                    </div>

                    <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {pack.name}
                    </h4>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {pack.description || "Koleksi playbook spesifik untuk akselerasi saluran ini."}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-border/30 flex items-center justify-between gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedPackId(pack.id)
                        setViewMode("all")
                      }}
                      className="text-xs h-8 flex-1 rounded-xl"
                    >
                      Buka Isi Paket <Icons.arrowRight className="size-3 ml-1" />
                    </Button>
                    <Button
                      size="sm"
                      variant={isAssigned ? "secondary" : "default"}
                      onClick={() => handleAssignPack(pack.id)}
                      disabled={assignPackMutation.isPending}
                      className="text-xs h-8 px-3 rounded-xl gap-1 shrink-0"
                    >
                      {isAssigned ? (
                        <>
                          <Icons.check className="size-3 text-emerald-500" /> Aktif
                        </>
                      ) : (
                        "+ Tugaskan"
                      )}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: ALL SKILLS & CATEGORY FILTER */}
      {(viewMode === "all" || selectedPackId !== "all") && (
        <div className="space-y-4">
          {/* Active Pack Filter Banner (if filtering by pack) */}
          {selectedPackId !== "all" && (
            <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Icons.inbox className="size-4 text-primary" />
                <span className="text-xs font-medium text-foreground">
                  Menampilkan Playbook dalam Paket:{" "}
                  <strong className="text-primary font-semibold">{selectedPackId}</strong>
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedPackId("all")}
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
              >
                Lihat Semua Paket ✕
              </Button>
            </div>
          )}

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-all",
                  activeCategory === cat.id
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/30"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Playbooks Grid */}
          {loadingSkills ? (
            <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
              <Icons.spinner className="size-5 animate-spin mx-auto text-primary" />
              <p>Memuat katalog 106 playbooks...</p>
            </div>
          ) : skills.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground rounded-2xl bg-card border border-border/40">
              <Icons.search className="size-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="font-medium text-foreground">Tidak ada playbook yang cocok</p>
              <p className="text-[11px] mt-1">Coba sesuaikan kata kunci pencarian atau filter kategori Anda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {skills.map((skill) => {
                const clientStatus = clientSkillMap.get(skill.id)
                return (
                  <div
                    key={skill.id}
                    className="p-4 rounded-2xl bg-card border border-border/40 hover:border-primary/40 transition-all flex flex-col justify-between group shadow-xs hover:shadow-md"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline" className="text-[10px] font-mono bg-muted/30">
                          {skill.category}
                        </Badge>
                        {clientStatus === "selesai" ? (
                          <span className="text-[10px] font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Icons.check className="size-2.5" /> Selesai
                          </span>
                        ) : clientStatus === "jalan" ? (
                          <span className="text-[10px] font-medium text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Icons.edit className="size-2.5" /> Dikerjakan
                          </span>
                        ) : null}
                      </div>

                      <h4 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                        {skill.name}
                      </h4>

                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {skill.job || skill.description || "Playbook spesialis pemasaran media sosial."}
                      </p>

                      {skill.allowed_tools && (
                        <div className="pt-1">
                          <span className="text-[10px] text-primary/80 font-mono bg-primary/5 px-2 py-0.5 rounded-md border border-primary/20 inline-block">
                            🔧 {skill.allowed_tools}
                          </span>
                        </div>
                      )}
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
                        <Icons.sparkles className="size-3" /> Jalankan Playbook
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Interactive Guided Interview Modal */}
      <SkillInterviewModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        skill={activeSkill}
        clientId={clientId}
        clientName={clientName}
      />
    </div>
  )
}
