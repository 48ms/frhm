'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { CompetitorBenchmarkCard } from '@/components/analytics/competitor-benchmark-card'
import { SeasonalCalendarBadge } from '@/components/analytics/seasonal-calendar-badge'
import { ROIAnalyticalForecastCard } from '@/components/analytics/roi-forecast-card'
import { SentimentOverviewCard } from '@/components/analytics/sentiment-overview-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PlatformIcon } from '@/components/calendar/calendar-view'
import ReactMarkdown from 'react-markdown'
import { Sparkles } from '@/registry/icons/sparkles'
import { ChartLine } from '@/registry/icons/chart-line'
import { Heart } from '@/registry/icons/heart'
import { MessageCircle } from '@/registry/icons/message-circle'
import { Save, X, Download, Upload, FileText, Share2, Bookmark, MousePointerClick } from 'lucide-react'
import { motion } from 'motion/react'

type PostMetric = {
  id: string
  title: string
  platform: string
  scheduled_at: string
  campaign_tag?: string
  content_type?: string
  creative_format?: string
  post_metrics?: {
    reach: number
    likes: number
    comments: number
    shares: number
    saves: number
    clicks: number
    wa_inquiries: number
    dm_inquiries: number
    theme_tag: string | null
    sentiment_summary?: {
      total_processed: number
      positive_count: number
      neutral_count: number
      negative_count: number
      avg_confidence: number
    } | null
  }[] | Record<string, unknown>
}

type MetricField = 'reach' | 'likes' | 'comments' | 'shares' | 'saves' | 'clicks' | 'views' | 'wa_inquiries' | 'dm_inquiries'

export function AnalyticsBoard({ clientId }: { clientId: string }) {
  const [posts, setPosts] = useState<PostMetric[]>([])
  const [summaries, setSummaries] = useState<{id: string, period_start: string, period_end: string, ai_insight: string, total_reach: number, campaign_tag?: string, operator_notes?: string}[]>([])
  const [campaigns, setCampaigns] = useState<{id: string, name: string}[]>([])
  const [loading, setLoading] = useState(true)
  
  // Inline editing state
  const [editingCell, setEditingCell] = useState<{ postId: string; field: MetricField } | null>(null)
  const [editValue, setEditValue] = useState('')
  
  // Import dialog state
  const [importOpen, setImportOpen] = useState(false)
  const [importMethod, setImportMethod] = useState<'csv' | 'paste'>('csv')
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [pasteText, setPasteText] = useState('')
  const [importPreview, setImportPreview] = useState<{ post_id: string; platform: string; views?: number; reach?: number; likes?: number; comments?: number; shares?: number; saves?: number; clicks?: number }[] | null>(null)
  const [importing, setImporting] = useState(false)
  
  // Export state
  const [exporting, setExporting] = useState<'pdf' | 'md' | null>(null)
  
  // Generator form
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [selCampaign, setSelCampaign] = useState('')
  const [generating, setGenerating] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [pRes, sRes, cRes] = await Promise.all([
        fetch(`/api/admin/clients/${clientId}/analytics/metrics`),
        fetch(`/api/admin/clients/${clientId}/analytics/summaries`),
        fetch(`/api/admin/clients/${clientId}/campaigns`)
      ])
      
      if (pRes.ok) setPosts((await pRes.json()).posts)
      if (sRes.ok) setSummaries((await sRes.json()).summaries)
      if (cRes.ok) setCampaigns((await cRes.json()).campaigns)
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    if (clientId) fetchData()
  }, [clientId, fetchData])

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!periodStart || !periodEnd) return
    
    setGenerating(true)
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/analytics/generate-insight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period_start: periodStart,
          period_end: periodEnd,
          campaign_tag: selCampaign || null
        })
      })
      if (res.ok) {
        fetchData()
      } else {
        const err = await res.json()
        alert(err.error || 'Gagal generate insight')
      }
    } finally {
      setGenerating(false)
    }
  }

  const handleUpdateMetric = async (postId: string, field: MetricField, value: number) => {
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/analytics/metrics`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, field, value })
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Gagal update metrik')
        fetchData() // revert on error
      }
    } catch {
      alert('Gagal update metrik')
      fetchData()
    }
  }

  const startEdit = (postId: string, field: MetricField, currentValue: number) => {
    setEditingCell({ postId, field })
    setEditValue(String(currentValue))
  }

  const commitEdit = () => {
    if (!editingCell) return
    const value = parseInt(editValue, 10)
    if (isNaN(value) || value < 0) {
      alert('Masukkan angka non-negatif')
      return
    }
    handleUpdateMetric(editingCell.postId, editingCell.field, value)
    setEditingCell(null)
    setEditValue('')
  }

  const cancelEdit = () => {
    setEditingCell(null)
    setEditValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitEdit()
    } else if (e.key === 'Escape') {
      cancelEdit()
    }
  }

  const handleExport = async (format: 'pdf' | 'md') => {
    setExporting(format)
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/analytics/export/${format === 'pdf' ? 'pdf' : 'markdown'}`)
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || `Gagal export ${format.toUpperCase()}`)
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const today = new Date().toISOString().split('T')[0]
      a.download = `laporan-${clientId}-${today}.${format === 'pdf' ? 'pdf' : 'md'}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert(`Gagal export ${format.toUpperCase()}: ` + (e instanceof Error ? e.message : String(e)))
    } finally {
      setExporting(null)
    }
  }

  if (loading) return <div className="py-8 text-center text-sm text-muted-foreground">Memuat analitik...</div>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Metrik Postingan */}
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
              <CardTitle className="text-base flex items-center gap-2">
                <ChartLine className="size-5 text-primary" />
                Performa Postingan Published
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-muted-foreground border-b">
                    <tr>
                      <th className="pb-2 font-medium">Postingan</th>
                      <th className="pb-2 font-medium">Tanggal</th>
                      <th className="pb-2 font-medium">Reach</th>
                      <th className="pb-2 font-medium">Likes</th>
                      <th className="pb-2 font-medium">Komen</th>
                      <th className="pb-2 font-medium">Shares</th>
                      <th className="pb-2 font-medium">Saves</th>
                      <th className="pb-2 font-medium">Clicks</th>
                      <th className="pb-2 font-medium">WA</th>
                      <th className="pb-2 font-medium">DM</th>
                      <th className="pb-2 font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {posts.length === 0 ? (
                      <tr><td colSpan={8} className="py-4 text-center text-muted-foreground">Belum ada data postingan published</td></tr>
                    ) : posts.map(p => {
                      const m = (Array.isArray(p.post_metrics) ? p.post_metrics[0] : p.post_metrics) as { reach: number, likes: number, comments: number, shares: number, saves: number, clicks: number, wa_inquiries: number, dm_inquiries: number, theme_tag: string | null } | undefined
                      const isEditing = (editingCell?.postId === p.id)
                      return (
                        <motion.tr layout key={p.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 pr-2">
                            <div className="flex items-center gap-2 max-w-[200px]">
                              <PlatformIcon platform={p.platform} className="size-3.5 shrink-0" />
                              <span className="truncate font-medium">{p.title}</span>
                            </div>
                            {p.campaign_tag && <Badge variant="secondary" className="mt-1 text-[9px] px-1.5 leading-none">{p.campaign_tag}</Badge>}
                          </td>
                          <td className="py-3 pr-2 whitespace-nowrap">
                            {new Date(p.scheduled_at).toLocaleDateString('id-ID')}
                          </td>
                          <td className="py-3 pr-2 font-medium">
                            {isEditing && editingCell?.field === 'reach' ? (
                              <Input
                                type="number"
                                min="0"
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onBlur={commitEdit}
                                onKeyDown={handleKeyDown}
                                autoFocus
                                className="w-20 h-7 text-xs px-1.5"
                              />                            ) : (
                              m?.reach || 0
                            )}
                          </td>
                          <td className="py-3 pr-2 font-medium">
                            {isEditing && editingCell?.field === 'likes' ? (
                              <Input
                                type="number"
                                min="0"
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onBlur={commitEdit}
                                onKeyDown={handleKeyDown}
                                autoFocus
                                className="w-20 h-7 text-xs px-1.5"
                              />                            ) : (
                              m?.likes || 0
                            )}
                          </td>
                          <td className="py-3 pr-2 font-medium">
                            {isEditing && editingCell?.field === 'comments' ? (
                              <Input
                                type="number"
                                min="0"
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onBlur={commitEdit}
                                onKeyDown={handleKeyDown}
                                autoFocus
                                className="w-20 h-7 text-xs px-1.5"
                              />                            ) : (
                              <span className="flex items-center gap-1"><MessageCircle className="size-3 text-muted-foreground" /> {m?.comments || 0}</span>
                            )}
                          </td>
                          <td className="py-3 pr-2 font-medium">
                            {isEditing && editingCell?.field === 'shares' ? (
                              <Input
                                type="number"
                                min="0"
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onBlur={commitEdit}
                                onKeyDown={handleKeyDown}
                                autoFocus
                                className="w-20 h-7 text-xs px-1.5"
                              />                            ) : (
                              m?.shares || 0
                            )}
                          </td>
                          <td className="py-3 pr-2 font-medium">
                            {isEditing && editingCell?.field === 'saves' ? (
                              <Input
                                type="number"
                                min="0"
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onBlur={commitEdit}
                                onKeyDown={handleKeyDown}
                                autoFocus
                                className="w-20 h-7 text-xs px-1.5"
                              />                            ) : (
                              m?.saves || 0
                            )}
                          </td>
                          <td className="py-3 pr-2 font-medium">
                            {isEditing && editingCell?.field === 'clicks' ? (
                              <Input
                                type="number"
                                min="0"
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onBlur={commitEdit}
                                onKeyDown={handleKeyDown}
                                autoFocus
                                className="w-20 h-7 text-xs px-1.5"
                              />                            ) : (
                              m?.clicks || 0
                            )}
                          </td>
                          <td className="py-3 pr-2 font-medium text-emerald-600 dark:text-emerald-400">
                            {isEditing && editingCell?.field === 'wa_inquiries' ? (
                              <Input
                                type="number"
                                min="0"
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onBlur={commitEdit}
                                onKeyDown={handleKeyDown}
                                autoFocus
                                className="w-20 h-7 text-xs px-1.5"
                              />                            ) : (
                              m?.wa_inquiries || 0
                            )}
                          </td>
                          <td className="py-3 pr-2 font-medium text-indigo-600 dark:text-indigo-400">
                            {isEditing && editingCell?.field === 'dm_inquiries' ? (
                              <Input
                                type="number"
                                min="0"
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                onBlur={commitEdit}
                                onKeyDown={handleKeyDown}
                                autoFocus
                                className="w-20 h-7 text-xs px-1.5"
                              />                            ) : (
                              m?.dm_inquiries || 0
                            )}
                          </td>
                          <td className="py-3">
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <Button size="sm" variant="default" className="h-7 text-[10px] px-2" onClick={commitEdit}>
                                  <Save className="size-3" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 text-[10px] px-2" onClick={cancelEdit}>
                                  <X className="size-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <Button size="sm" variant="outline" className="h-7 text-[10px] px-2" onClick={() => startEdit(p.id, 'reach', m?.reach || 0)} title="Edit Reach">
                                  R
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 text-[10px] px-2" onClick={() => startEdit(p.id, 'likes', m?.likes || 0)} title="Edit Likes">
                                  <Heart className="size-3 text-red-500" />
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 text-[10px] px-2" onClick={() => startEdit(p.id, 'comments', m?.comments || 0)} title="Edit Comments">
                                  <MessageCircle className="size-3" />
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 text-[10px] px-2" onClick={() => startEdit(p.id, 'shares', m?.shares || 0)} title="Edit Shares">
                                  <Share2 className="size-3" />
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 text-[10px] px-2" onClick={() => startEdit(p.id, 'saves', m?.saves || 0)} title="Edit Saves">
                                  <Bookmark className="size-3" />
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 text-[10px] px-2" onClick={() => startEdit(p.id, 'clicks', m?.clicks || 0)} title="Edit Clicks">
                                  <MousePointerClick className="size-3" />
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 text-[10px] px-2 text-emerald-600 border-emerald-200" onClick={() => startEdit(p.id, 'wa_inquiries', m?.wa_inquiries || 0)} title="Edit WA Inquiry">
                                  WA
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 text-[10px] px-2 text-indigo-600 border-indigo-200" onClick={() => startEdit(p.id, 'dm_inquiries', m?.dm_inquiries || 0)} title="Edit DM Inquiry">
                                  DM
                                </Button>
                              </div>
                            )}
                          </td>
                        </motion.tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Toolbar: Import / Export */}
        <div className="flex flex-wrap items-center gap-3 py-3 border-y">
          <Button variant="outline" size="sm" onClick={() => { setImportMethod('csv'); setImportOpen(true); }} disabled={importing}>
            <Upload className="size-3.5 mr-1.5" /> Import Metrik
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('pdf')} disabled={Boolean(exporting)}>
            <FileText className="size-3.5 mr-1.5" /> Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('md')} disabled={Boolean(exporting)}>
            <Download className="size-3.5 mr-1.5" /> Export Markdown
          </Button>
          <SeasonalCalendarBadge className="ml-auto" />
        </div>

        {/* Import Dialog */}
        {importOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl bg-background rounded-xl border shadow-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Import Metrik</h3>
                <Button variant="ghost" size="icon" onClick={() => { setImportOpen(false); setImportPreview(null); setCsvFile(null); setPasteText(''); }}>
                  <X className="size-5" />
                </Button>
              </div>
              <div className="flex gap-4">
                <Button variant={importMethod === 'csv' ? 'default' : 'outline'} onClick={() => setImportMethod('csv')} className="flex-1">
                  Upload CSV
                </Button>
                <Button variant={importMethod === 'paste' ? 'default' : 'outline'} onClick={() => setImportMethod('paste')} className="flex-1">
                  Paste dari Spreadsheet
                </Button>
              </div>
              {importMethod === 'csv' ? (
                <div className="space-y-2">
                  <Label className="text-xs">Pilih file CSV (kolom: post_id, platform, views, reach, likes, comments, shares, saves, clicks)</Label>
                  <Input type="file" accept=".csv" onChange={e => setCsvFile(e.target.files?.[0] || null)} disabled={importing} />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-xs">Paste data tab-delimited dari Google Sheets/Excel (header: post_id, platform, views, reach, likes, comments, shares, saves, clicks)</Label>
                  <textarea
                    value={pasteText}
                    onChange={e => setPasteText(e.target.value)}
                    rows={8}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono"
                    placeholder="post_id	platform	views	reach	likes	comments	shares	saves	clicks
uuid-1	instagram	1000	5000	200	50	10	5	20
uuid-2	tiktok	500	3000	150	30	8	3	15"
                    disabled={importing}
                  />
                </div>
              )}
              {importPreview && (
                <div className="space-y-2 border rounded-lg p-3 max-h-60 overflow-auto">
                  <p className="text-xs font-medium">{importPreview.length} baris valid, siap import</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[10px]">
                      <thead className="text-muted-foreground"><tr><th className="text-left pb-1">post_id</th><th className="text-left pb-1">platform</th><th className="text-left pb-1">views</th><th className="text-left pb-1">reach</th><th className="text-left pb-1">likes</th><th className="text-left pb-1">comments</th><th className="text-left pb-1">shares</th><th className="text-left pb-1">saves</th><th className="text-left pb-1">clicks</th></tr></thead>
                      <tbody>
                        {importPreview.slice(0, 10).map((r, i) => (
                          <tr key={i} className="border-t"><td className="font-mono truncate max-w-[120px]">{r.post_id}</td><td>{r.platform}</td><td>{r.views ?? 0}</td><td>{r.reach ?? 0}</td><td>{r.likes ?? 0}</td><td>{r.comments ?? 0}</td><td>{r.shares ?? 0}</td><td>{r.saves ?? 0}</td><td>{r.clicks ?? 0}</td></tr>
                        ))}
                        {importPreview.length > 10 && <tr><td colSpan={9} className="text-center text-muted-foreground py-1">... dan {importPreview.length - 10} baris lagi</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => { setImportOpen(false); setImportPreview(null); setCsvFile(null); setPasteText(''); }} disabled={importing}>
                  Batal
                </Button>
                <Button onClick={async () => {
                  setImporting(true)
                  try {
                    let rows: typeof importPreview = []
                    if (importMethod === 'csv' && csvFile) {
                      const Papa = (await import('papaparse')).default
                      const text = await csvFile.text()
                      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true, transformHeader: (h: string) => h.trim().toLowerCase() })
                      rows = (parsed.data as Array<Record<string, string>>).map((r) => ({
                        post_id: r.post_id,
                        platform: r.platform,
                        views: parseInt(r.views || '0', 10),
                        reach: parseInt(r.reach || '0', 10),
                        likes: parseInt(r.likes || '0', 10),
                        comments: parseInt(r.comments || '0', 10),
                        shares: parseInt(r.shares || '0', 10),
                        saves: parseInt(r.saves || '0', 10),
                        clicks: parseInt(r.clicks || '0', 10),
                        wa_inquiries: parseInt(r.wa_inquiries || r.wa || '0', 10),
                        dm_inquiries: parseInt(r.dm_inquiries || r.dm || '0', 10)
                      })).filter(r => r.post_id && r.platform)
                    } else if (importMethod === 'paste' && pasteText) {
                      const lines = pasteText.trim().split('\n')
                      const headers = lines[0].split('\t').map((h: string) => h.trim().toLowerCase())
                      rows = lines.slice(1).map((l: string) => {
                        const vals = l.split('\t')
                        const obj: Record<string, string> = {}
                        headers.forEach((h, i) => { obj[h] = vals[i]?.trim() || '' })
                        return {
                          post_id: obj.post_id,
                          platform: obj.platform,
                          views: parseInt(obj.views || '0', 10),
                          reach: parseInt(obj.reach || '0', 10),
                          likes: parseInt(obj.likes || '0', 10),
                          comments: parseInt(obj.comments || '0', 10),
                          shares: parseInt(obj.shares || '0', 10),
                          saves: parseInt(obj.saves || '0', 10),
                          clicks: parseInt(obj.clicks || '0', 10),
                          wa_inquiries: parseInt(obj.wa_inquiries || obj.wa || '0', 10),
                          dm_inquiries: parseInt(obj.dm_inquiries || obj.dm || '0', 10)
                        }
                      }).filter(r => r.post_id && r.platform)
                    }
                    setImportPreview(rows)
                    if (rows.length === 0) {
                      alert('Tidak ada baris valid')
                      setImporting(false)
                      return
                    }
                    const res = await fetch(`/api/admin/clients/${clientId}/analytics/metrics/bulk`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(rows)
                    })
                    const data = await res.json()
                    if (res.ok) {
                      alert(`Import selesai: ${data.updated} updated, ${data.skipped} skipped`)
                      fetchData()
                      setImportOpen(false)
                      setImportPreview(null)
                      setCsvFile(null)
                      setPasteText('')
                    } else {
                      alert(data.error || 'Import gagal')
                    }
                  } catch (e) {
                    alert('Gagal import: ' + (e instanceof Error ? e.message : String(e)))
                  } finally {
                    setImporting(false)
                  }
                }} disabled={importing || !importPreview}>
                  {importing ? 'Mengimport...' : 'Import Sekarang'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Export Loading Overlay */}
        {exporting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-background rounded-xl border p-6 text-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto" />
              <p className="text-sm">Menyiapkan {exporting === 'pdf' ? 'PDF' : 'Markdown'}...</p>
            </div>
          </div>
        )}

        {/* AI Insight Generator */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3 border-b border-border/50 bg-primary/5">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="size-5 text-primary" />
                Generate AI Insight
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerate} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Dari</Label>
                    <Input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} required className="h-11 sm:h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Sampai</Label>
                    <Input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} required className="h-11 sm:h-8 text-xs" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Filter Kampanye</Label>
                  <select value={selCampaign} onChange={e => setSelCampaign(e.target.value)} className="flex h-11 sm:h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm">
                    <option value="">Semua Kampanye</option>
                    {campaigns.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <Button type="submit" disabled={generating} className="w-full h-11 sm:h-8 text-xs mt-2 relative group overflow-hidden">
                  <div className="absolute inset-0 w-full h-full bg-white/20 group-hover:translate-x-full transition-transform duration-500 ease-out -translate-x-full skew-x-12" />
                  {generating ? 'Menganalisis Data...' : (
                    <span className="flex items-center gap-1.5"><Sparkles className="size-3.5" /> Generate Insight</span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Daftar Insight */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold">Riwayat AI Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summaries.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1, ease: 'easeOut' }}
            >
              <Card className="border-primary/20 bg-primary/5 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-primary/10 pb-2">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold">
                        {new Date(s.period_start).toLocaleDateString('id-ID', { month:'short', day:'numeric' })} - {new Date(s.period_end).toLocaleDateString('id-ID', { month:'short', day:'numeric'})}
                      </p>
                      {s.campaign_tag && <Badge className="text-[9px] px-1.5 leading-none">{s.campaign_tag}</Badge>}
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold flex items-center justify-end gap-1"><ChartLine className="size-3" /> Total Reach</p>
                      <p className="text-sm font-bold text-primary">{s.total_reach.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-xs prose prose-sm dark:prose-invert max-w-none prose-p:leading-snug prose-li:my-0.5">
                    <ReactMarkdown>{s.ai_insight}</ReactMarkdown>
                  </div>
                  {/* Operator Notes */}
                  <div className="border-t border-primary/10 pt-3">
                    <Label className="text-xs font-medium">Catatan Operator (termasuk di export)</Label>
                    <textarea
                      value={s.operator_notes || ''}
                      onChange={async (e) => {
                        const newNotes = e.target.value
                        // Optimistic update
                        setSummaries(prev => prev.map(sum => sum.id === s.id ? { ...sum, operator_notes: newNotes } : sum))
                        // Persist to server
                        try {
                          await fetch(`/api/admin/clients/${clientId}/analytics/summaries/${s.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ operator_notes: newNotes })
                          })
                        } catch {
                          // Revert on error
                          fetchData()
                        }
                      }}
                      rows={3}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs resize-none"
                      placeholder="Tambahkan catatan untuk laporan..."
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {summaries.length === 0 && (
            <div className="col-span-2 text-center text-xs text-muted-foreground py-8 border border-dashed rounded-lg">
              Belum ada insight AI yang digenerate.
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-6">
              {(() => {
                let pos = 0, neu = 0, neg = 0, total = 0, confSum = 0
                posts.forEach(p => {
                  const m = Array.isArray(p.post_metrics) ? p.post_metrics[0] : p.post_metrics
                  const s = m?.sentiment_summary as {
                    total_processed: number
                    positive_count: number
                    neutral_count: number
                    negative_count: number
                    avg_confidence: number
                  } | null | undefined
                  if (s && s.total_processed > 0) {
                    pos += s.positive_count
                    neu += s.neutral_count
                    neg += s.negative_count
                    total += s.total_processed
                    confSum += s.avg_confidence * s.total_processed
                  }
                })
                if (total === 0) return null
                return (
                  <SentimentOverviewCard
                    positiveCount={pos}
                    neutralCount={neu}
                    negativeCount={neg}
                    totalProcessed={total}
                    avgConfidence={confSum / total}
                  />
                )
              })()}
        <ROIAnalyticalForecastCard clientId={clientId} />
        <CompetitorBenchmarkCard clientId={clientId} />
      </div>
    </div>
  )
}
