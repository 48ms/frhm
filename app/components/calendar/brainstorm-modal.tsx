import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/icons"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useGenerateContentIdeas } from "@/features/copilot/api/queries"
import { useCreateScheduledPost } from "@/features/scheduled-posts/api/queries"
import { addDays, format } from "date-fns"

interface BrainstormModalProps {
  clientId: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideTrigger?: boolean
}

export function BrainstormModal({ 
  clientId,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  hideTrigger
}: BrainstormModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = externalOnOpenChange !== undefined ? externalOnOpenChange : setInternalOpen
  const [trendOrTopic, setTrendOrTopic] = useState("")
  const [count, setCount] = useState(5)
  const [ideas, setIdeas] = useState<any[]>([])

  const { mutateAsync: generateIdeas, isPending: isGenerating } = useGenerateContentIdeas()
  const { mutateAsync: createPost, isPending: isSaving } = useCreateScheduledPost()

  const handleGenerate = async () => {
    try {
      const result = await generateIdeas({ clientId, count, trendOrTopic })
      if (result.error) {
        toast.error(result.error)
        return
      }
      setIdeas(result.ideas || [])
      toast.success("Ide Konten Siap! 💡", {
        description: `${result.ideas?.length || count} ide berhasil diracik menggunakan framework SPARK.`
      })
    } catch (err: any) {
      toast.error(err.message || "Gagal generate ide")
    }
  }

  const handleAddToCalendar = async (idea: any, index: number) => {
    try {
      // Create a draft post scheduled for a few days from now just as a placeholder
      const scheduledAt = addDays(new Date(), index + 1).toISOString()
      
      const contentStr = `[HOOK]\n${idea.hook}\n\n[CONTENT]\n${idea.content}`

      await createPost({
        client_id: clientId,
        title: idea.title,
        content: contentStr,
        platform: idea.platform.toLowerCase(), // e.g. "instagram"
        scheduled_at: scheduledAt,
        status: "draft",
        campaign_tag: idea.pillar,
        notes: `Format: ${idea.format}`
      })

      toast.success("Ide berhasil ditambahkan ke kalender!")
      
      // Remove from list
      setIdeas(prev => prev.filter((_, i) => i !== index))
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan ide")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 gap-2 cursor-pointer">
          <Icons.sparkles className="h-4 w-4 text-primary" />
          <span>AI Brainstorm</span>
        </DialogTrigger>
      )}
      
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icons.sparkles className="h-5 w-5 text-primary" />
            AI Content Ideation
          </DialogTitle>
          <DialogDescription>
            Copilot akan membaca Brand Profile dan Content Pillars Anda untuk menghasilkan ide-ide konten orisinal berbasis sistem SPARK.
          </DialogDescription>
        </DialogHeader>

        {!ideas.length ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="trend-topic">Tren atau Topik Khusus (Opsional)</Label>
              <Input 
                id="trend-topic"
                placeholder="Contoh: Kampanye Akhir Tahun, atau Tren AI..."
                value={trendOrTopic}
                onChange={(e) => setTrendOrTopic(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="idea-count">Jumlah Ide ({count})</Label>
              <input 
                id="idea-count"
                type="range" 
                min="1" 
                max="10" 
                value={count} 
                onChange={(e) => setCount(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <Button 
              className="w-full gap-2" 
              onClick={handleGenerate} 
              disabled={isGenerating}
            >
              {isGenerating ? <Icons.spinner className="h-4 w-4 animate-spin" /> : <Icons.sparkles className="h-4 w-4" />}
              {isGenerating ? "Menganalisis Brand Profile..." : "Generate Ideas"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-muted-foreground">{ideas.length} Ide Ditemukan</h3>
              <Button variant="ghost" size="sm" onClick={() => setIdeas([])} className="h-8">Reset</Button>
            </div>
            
            <div className="space-y-3">
              {ideas.map((idea, i) => (
                <div key={i} className="rounded-lg border p-4 space-y-3 bg-muted/20">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-semibold">{idea.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{idea.content}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      onClick={() => handleAddToCalendar(idea, i)}
                      disabled={isSaving}
                    >
                      <Icons.add className="h-4 w-4 mr-1" />
                      Add to Calendar
                    </Button>
                  </div>
                  
                  <div className="bg-muted p-2 rounded text-sm italic">
                    <span className="font-semibold mr-2 not-italic">Hook:</span>
                    "{idea.hook}"
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Badge variant="outline">{idea.pillar}</Badge>
                    <Badge variant="outline" className="bg-primary/5">{idea.platform}</Badge>
                    <Badge variant="outline">{idea.format}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
