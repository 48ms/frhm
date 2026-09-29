'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Icons } from '@/components/icons'
import { ContentDraftForm } from '@/components/admin/content-draft-form'
import { SlideOverSheet } from '@/components/ui/slide-over-sheet'
import { motion, AnimatePresence } from "motion/react"

interface HeroAssetProps {
  asset: {
    id: string
    title: string
    description: string
    content_pillar: string
    funnel_stage: string
    status: string
    raw_assets_url?: string
  }
}

export function HeroAssetCard({ asset }: HeroAssetProps) {
  const [isRepurposing, setIsRepurposing] = useState(false)
  const [childPosts, setChildPosts] = useState<any[]>([])
  const [showDraftSheet, setShowDraftSheet] = useState(false)

  const handleRepurpose = () => {
    setIsRepurposing(true)
    
    // Auto-generate some templates based on pillar
    setTimeout(() => {
      const generatedPosts = [
        {
          id: 'temp-1',
          platform: 'LinkedIn',
          format: 'Carousel',
          status: 'Draft',
          title: `[LinkedIn] ${asset.title} - Carousel`
        },
        {
          id: 'temp-2',
          platform: 'Instagram',
          format: 'Reel',
          status: 'Draft',
          title: `[IG Reel] ${asset.title}`
        },
        {
          id: 'temp-3',
          platform: 'Twitter',
          format: 'Thread',
          status: 'Idea',
          title: `[Thread] ${asset.title} summary`
        }
      ]
      setChildPosts(generatedPosts)
      setIsRepurposing(false)
    }, 800)
  }

  return (
    <>
      <Card className="w-full max-w-4xl mx-auto overflow-hidden">
        <div className="bg-primary/5 border-b p-4 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="bg-white dark:bg-black">{asset.content_pillar}</Badge>
              <Badge variant="secondary">{asset.funnel_stage}</Badge>
              <Badge>{asset.status}</Badge>
            </div>
            <h2 className="text-2xl font-bold mt-2">{asset.title}</h2>
            <p className="text-muted-foreground mt-1">{asset.description}</p>
          </div>
          {asset.raw_assets_url && (
            <Button variant="outline" size="sm" className="gap-2">
                            <Icons.externalLink className="h-4 w-4" />
              Drive Folder
            </Button>
          )}
        </div>
        
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Icons.kanban className="h-5 w-5 text-primary" />
              Child Posts (Distribusi)
            </h3>
            <Button 
              onClick={handleRepurpose} 
              disabled={isRepurposing || childPosts.length > 0}
              className="gap-2"
            >
              <Icons.dashboard className="h-4 w-4" />
              {isRepurposing ? 'Memecah Aset...' : 'Repurpose Asset'}
            </Button>
          </div>

          <AnimatePresence>
            {childPosts.length > 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid gap-3"
              >
                {childPosts.map((post) => (
                  <div key={post.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-md">
                        {post.platform === 'Instagram' ? <Icons.video className="h-4 w-4 text-primary" /> : <Icons.kanban className="h-4 w-4 text-primary" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{post.title}</p>
                        <p className="text-xs text-muted-foreground">{post.platform} • {post.format}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{post.status}</Badge>
                      <Button variant="ghost" size="sm" onClick={() => setShowDraftSheet(true)}>Edit Brief</Button>
                    </div>
                  </div>
                ))}
                
                <Button variant="ghost" className="w-full mt-2 border border-dashed gap-2" onClick={() => setShowDraftSheet(true)}>
                  <Icons.add className="h-4 w-4" />
                  Tambah Child Post Manual
                </Button>
              </motion.div>
            ) : (
              <div className="text-center py-10 border border-dashed rounded-lg bg-muted/20">
                <p className="text-muted-foreground text-sm">Belum ada *child post*.</p>
                <p className="text-xs text-muted-foreground mt-1">Klik "Repurpose Asset" untuk otomatis memecah *Hero Asset* ini ke berbagai platform.</p>
              </div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      <SlideOverSheet 
        isOpen={showDraftSheet} 
        onClose={() => setShowDraftSheet(false)}
        title="Edit Content Brief"
      >
        <div className="mb-6 p-4 bg-muted/30 border rounded-lg">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Referencing Hero Asset:</p>
          <p className="font-medium">{asset.title}</p>
          <div className="flex gap-2 mt-2">
             {asset.raw_assets_url && (
              <a href={asset.raw_assets_url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                <Icons.externalLink className="h-3 w-3" /> Buka Raw Asset
              </a>
             )}
          </div>
        </div>
        <ContentDraftForm />
      </SlideOverSheet>
    </>
  )
}
