'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useQueryState, parseAsString } from 'nuqs'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { CompetitorBenchmarkCard } from '@/components/analytics/competitor-benchmark-card'
import { ROIAnalyticalForecastCard } from '@/components/analytics/roi-forecast-card'
import { SentimentOverviewCard } from '@/components/analytics/sentiment-overview-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import ReactMarkdown from 'react-markdown'
import { Icons } from '@/components/icons'
import { toast } from 'sonner'
import {
  analyticsPostsQueryOptions,
  analyticsSummariesQueryOptions,
  generateInsightMutation,
  updateMetricMutation,
  invalidateAnalytics,
} from '@/features/analytics/api/queries'
import type {
  PostMetric,
  MetricField,
} from '@/features/analytics/api/types'

type InlineEditState = {
  postId: string
  field: MetricField
}

export function AnalyticsBoard({ clientId }: { clientId: string }) {
  const queryClient = useQueryClient()

  const [periodStart] = useQueryState('from', parseAsString.withDefault(''))
  const [periodEnd] = useQueryState('to', parseAsString.withDefault(''))
  const [selCampaign] = useQueryState('campaign', parseAsString.withDefault(''))

  const [generating, setGenerating] = useState(false)
  const [editingCell, setEditingCell] = useState<InlineEditState | null>(null)
  const [editValue, setEditValue] = useState('')

  // Queries
  const { data: posts = [], isLoading: loadingPosts } = useQuery(analyticsPostsQueryOptions(clientId))
  const { data: summaries = [] } = useQuery(analyticsSummariesQueryOptions(clientId))

  // Mutations
  const generateInsight = useMutation(generateInsightMutation)
  const updateMetric = useMutation(updateMetricMutation)

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!periodStart || !periodEnd) return
    setGenerating(true)
    try {
      await generateInsight.mutateAsync({
        clientId,
        periodStart,
        periodEnd,
        campaignTag: selCampaign || undefined,
      })
      invalidateAnalytics()
      toast.success('Insight berhasil digenerate')
    } catch (err: any) {
      toast.error(err.message || 'Gagal generate insight')
    } finally {
      setGenerating(false)
    }
  }

  const handleUpdateMetric = async (postId: string, field: MetricField, value: number) => {
    try {
      // Optimistic update
      queryClient.setQueryData<PostMetric[]>(
        analyticsPostsQueryOptions(clientId).queryKey,
        (old) =>
          old?.map((p) => {
            if (p.id === postId && Array.isArray(p.post_metrics)) {
              return {
                ...p,
                post_metrics: p.post_metrics.map((m: any) => ({
                  ...m,
                  [field]: value
                }))
              }
            }
            return p
          }) ?? old
      )

      await updateMetric.mutateAsync({ postId, field, value })
    } catch (err: any) {
      toast.error(err.message || 'Gagal update metrik')
      queryClient.invalidateQueries({ queryKey: analyticsPostsQueryOptions(clientId).queryKey })
    }
  }

  const commitEdit = () => {
    if (!editingCell) return
    const value = parseInt(editValue, 10)
    if (isNaN(value) || value < 0) {
      toast.warning('Masukkan angka positif')
      return
    }
    handleUpdateMetric(editingCell.postId, editingCell.field, value)
    setEditingCell(null)
    setEditValue('')
  }

  if (loadingPosts) return <div className="py-20 text-center text-muted-foreground text-sm">Memuat data analitik...</div>

  // Aggregate sentiment totals from posts if available
  let totalProc = 0, posCnt = 0, neuCnt = 0, negCnt = 0, confSum = 0
  posts.forEach(p => {
    if (Array.isArray(p.post_metrics)) {
      p.post_metrics.forEach((m: any) => {
        if (m.sentiment_summary) {
          totalProc += m.sentiment_summary.total_processed || 0
          posCnt += m.sentiment_summary.positive_count || 0
          neuCnt += m.sentiment_summary.neutral_count || 0
          negCnt += m.sentiment_summary.negative_count || 0
          confSum += m.sentiment_summary.avg_confidence || 0
        }
      })
    }
  })

  return (
    <div className="space-y-8">
      {/* Main Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Icons.kanban className="size-5 text-primary" />
            Detail Performa Konten
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left">Konten</th>
                  <th className="p-3 text-center">Reach</th>
                  <th className="p-3 text-center">Likes</th>
                  <th className="p-3 text-center">Comments</th>
                </tr>
              </thead>
              <tbody>
                {posts.map(post => (
                  <tr key={post.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-medium">{post.title}</td>
                    {(['reach', 'likes', 'comments'] as const).map(field => {
                      const metrics = Array.isArray(post.post_metrics) ? post.post_metrics[0] : (post.post_metrics as any)
                      const val = metrics?.[field] ?? 0
                      const isEditing = editingCell?.postId === post.id && editingCell?.field === field
                      
                      return (
                        <td key={field} className="p-3 text-center cursor-pointer hover:bg-primary/5" onClick={() => {
                          setEditingCell({ postId: post.id, field })
                          setEditValue(String(val))
                        }}>
                          {isEditing ? (
                            <Input 
                              autoFocus
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onBlur={commitEdit}
                              onKeyDown={e => e.key === 'Enter' && commitEdit()}
                              className="h-8 w-20 mx-auto text-center"
                            />
                          ) : val.toLocaleString()}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* AI Insight Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Icons.sparkles className="size-5 text-amber-500" />
              AI Performance Analysis
            </CardTitle>
            <Button onClick={handleGenerate} disabled={generating} size="sm">
              {generating ? <Icons.spinner className="mr-2 size-4 animate-spin" /> : <Icons.refresh className="mr-2 size-4" />}
              Generate Insight Baru
            </Button>
          </CardHeader>
          <CardContent>
            {summaries.length > 0 ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{summaries[0].ai_insight}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-center py-10 text-muted-foreground">Belum ada insight. Klik generate untuk memulai.</p>
            )}
          </CardContent>
        </Card>
        
        <SentimentOverviewCard
          positiveCount={posCnt}
          neutralCount={neuCnt}
          negativeCount={negCnt}
          totalProcessed={totalProc}
          avgConfidence={totalProc > 0 ? confSum / posts.length : 0}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ROIAnalyticalForecastCard clientId={clientId} />
        <CompetitorBenchmarkCard clientId={clientId} />
      </div>
    </div>
  )
}
