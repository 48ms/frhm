import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Clock } from 'lucide-react'
import { motion } from "motion/react"

export interface ClientTaskProps {
  id: string
  title: string
  description: string
  status: 'Menunggu Review' | 'Revisi' | 'Disetujui'
  dueDate?: string
  platform?: string
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
  onClick?: (id: string) => void
}

export function ClientTaskCard({ 
  id, 
  title, 
  description, 
  status, 
  dueDate, 
  platform,
  onApprove,
  onReject,
  onClick
}: ClientTaskProps) {
  
  const isPending = status === 'Menunggu Review'

  return (
    <motion.div 
      whileTap={{ scale: 0.98 }}
      className="w-full"
    >
      <Card className="rounded-2xl overflow-hidden border-border/30 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-brand-accent/30 transition-all cursor-pointer" onClick={() => onClick?.(id)}>
        <CardContent className="p-0">
          <div className="p-5">
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-2">
                <Badge variant={isPending ? 'default' : 'secondary'} className={`rounded-sm text-xs font-bold tracking-wider uppercase ${isPending ? 'bg-brand-accent text-brand-accent-foreground' : ''}`}>
                  {status}
                </Badge>
                {platform && (
                  <Badge variant="outline" className="rounded-sm text-muted-foreground border-border/50 text-[10px] font-bold uppercase tracking-wider bg-background">
                    {platform}
                  </Badge>
                )}
              </div>
              {dueDate && (
                <div className="flex items-center text-xs font-semibold text-muted-foreground bg-muted/50 px-2 py-1 rounded-sm border border-border/50 tabular-nums">
                  <Clock className="h-3 w-3 mr-1.5 opacity-70" />
                  {dueDate}
                </div>
              )}
            </div>
            
            <h3 className="text-xl font-bold mb-2 leading-tight group-hover:text-brand-accent transition-colors">{title}</h3>
            <p className="text-muted-foreground text-sm font-medium line-clamp-2">{description}</p>
          </div>
          
          {/* Action Area - Touch Friendly at Bottom Right */}
          {isPending && (
            <div className="bg-background border-t border-border/30 p-4 flex justify-between items-center gap-4">
              <span className="text-xs font-semibold text-muted-foreground/70">Butuh Persetujuan Anda</span>
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-xl border-border/50 text-muted-foreground hover:bg-muted font-semibold transition-colors"
                  onClick={() => onReject?.(id)}
                >
                  <XCircle className="h-4 w-4 mr-1.5 opacity-70" />
                  Revisi
                </Button>
                <Button 
                  size="sm" 
                  className="rounded-xl bg-brand-accent hover:bg-brand-accent/90 text-brand-accent-foreground font-semibold shadow-sm transition-colors"
                  onClick={() => onApprove?.(id)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Setujui
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
