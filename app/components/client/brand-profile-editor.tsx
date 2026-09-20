'use client'

import React, { useState, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PencilIcon, LoaderIcon } from 'lucide-react'
import {
  BrandProfileData,
  parseBrandProfileMarkdown,
  serializeBrandProfile,
  createEmptyBrandProfile,
} from '@/lib/onboarding/brand-profile-parser'

interface BrandProfileEditorProps {
  clientId: string
  clientName?: string
  /** Raw markdown of brand-profile.md, so the editor starts from what the repo actually wrote. */
  initialMarkdown?: string
  /** Called after a successful save so the parent can refresh the server-rendered files. */
  onSaved?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

/**
 * Inline editor for brand-profile.md.
 *
 * The AI writes a first draft during quick onboarding; this lets an admin fine-tune it
 * (pillar allocation, voice, guardrails, channels) without hand-editing markdown. It parses
 * the existing file, edits it in a form, and writes it back through the same
 * PUT /api/admin/clients/[id]/files endpoint every other artifact uses.
 */
export function BrandProfileEditorDialog({ clientId, clientName, initialMarkdown, onSaved, open, onOpenChange }: BrandProfileEditorProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const setDialogActive = onOpenChange !== undefined ? onOpenChange : setInternalOpen;
  
  const [saving, setSaving] = useState(false)
  const [brandData, setBrandData] = useState<BrandProfileData>(() =>
    createEmptyBrandProfile(clientName ?? 'Client')
  )

  // Re-parse the file each time the dialog opens, so it always reflects the latest saved copy.
  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (next) {
        setBrandData(
          initialMarkdown && initialMarkdown.trim().length > 0
            ? parseBrandProfileMarkdown(initialMarkdown)
            : createEmptyBrandProfile(clientName ?? 'Client')
        )
      }
      setDialogActive(next)
    },
    [initialMarkdown, clientName, setDialogActive]
  )

  const update = useCallback((updater: (prev: BrandProfileData) => BrandProfileData) => {
    setBrandData(updater)
  }, [])

  const totalPct = brandData.pillars.reduce((sum, p) => sum + (p.percentage || 0), 0)
  const totalValid = totalPct === 100

  const onSubmit = useCallback(async () => {
    if (!totalValid) return
    setSaving(true)
    try {
      const markdown = serializeBrandProfile(brandData)
      const res = await fetch(`/api/admin/clients/${clientId}/files`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: 'brand-profile.md', content: markdown }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Gagal menyimpan')
      }
      handleOpenChange(false)
      // Notify parent to refresh server data
      if (onSaved) onSaved()
    } catch (e) {
      // Surface the failure without a toast dependency; the dialog stays open so work isn't lost.
      alert(e instanceof Error ? e.message : 'Gagal menyimpan brand profile')
    } finally {
      setSaving(false)
    }
  }, [brandData, clientId, totalValid, handleOpenChange, onSaved])

  return (
    <>
      <Button variant="outline" size="sm" className="h-11 sm:h-8" onClick={() => handleOpenChange(true)}>
        <PencilIcon className="size-3.5" /> Edit Brand Profile
      </Button>

      <Dialog open={open ?? internalOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Brand Profile</DialogTitle>
            <DialogDescription>
              Sesuaikan pilar konten, voice, dan guardrails. Perubahan disimpan ke{' '}
              <code>brand-profile.md</code> dan langsung dipakai tahap berikutnya.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="identity" className="w-full">
            <TabsList className="flex h-auto w-full flex-wrap gap-1">
              <TabsTrigger value="identity">Identitas</TabsTrigger>
              <TabsTrigger value="audience">Audience</TabsTrigger>
              <TabsTrigger value="voice">Voice</TabsTrigger>
              <TabsTrigger value="pillars">Pilar Konten</TabsTrigger>
              <TabsTrigger value="channels">Channels</TabsTrigger>
              <TabsTrigger value="assets">Brand Assets</TabsTrigger>
            </TabsList>

            <TabsContent value="identity" className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label>Nama brand</Label>
                <Input
                  value={brandData.clientName}
                  onChange={(e) => update((prev) => ({ ...prev, clientName: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Siapa kami (who we are)</Label>
                <Textarea
                  rows={4}
                  value={brandData.whoWeAre}
                  onChange={(e) => update((prev) => ({ ...prev, whoWeAre: e.target.value }))}
                />
              </div>
            </TabsContent>

            <TabsContent value="audience" className="mt-4 space-y-1.5">
              <Label>Persona audience</Label>
              <Textarea
                rows={8}
                value={brandData.audiencePersona}
                onChange={(e) => update((prev) => ({ ...prev, audiencePersona: e.target.value }))}
              />
            </TabsContent>

            <TabsContent value="voice" className="mt-4 space-y-3">
              <div className="space-y-1.5">
                <Label>Tone (pisahkan dengan koma)</Label>
                <Input
                  value={brandData.voice.tone.join(', ')}
                  onChange={(e) =>
                    update((prev) => ({
                      ...prev,
                      voice: {
                        ...prev.voice,
                        tone: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                      },
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Do&apos;s (satu per baris)</Label>
                <Textarea
                  rows={4}
                  value={brandData.voice.dos.join('\n')}
                  onChange={(e) =>
                    update((prev) => ({
                      ...prev,
                      voice: {
                        ...prev.voice,
                        dos: e.target.value.split('\n').map((d) => d.replace(/^[-*]\s*/, '').trim()).filter(Boolean),
                      },
                    }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Don&apos;ts / guardrails (satu per baris)</Label>
                <Textarea
                  rows={4}
                  value={brandData.voice.donts.join('\n')}
                  onChange={(e) =>
                    update((prev) => ({
                      ...prev,
                      voice: {
                        ...prev.voice,
                        donts: e.target.value.split('\n').map((d) => d.replace(/^[-*]\s*/, '').trim()).filter(Boolean),
                      },
                    }))
                  }
                />
              </div>
            </TabsContent>

            <TabsContent value="pillars" className="mt-4 space-y-4">
              {brandData.pillars.map((pillar, i) => (
                <div key={i} className="space-y-2 rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <Label>Pilar {i + 1}</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8"
                      onClick={() =>
                        update((prev) => ({
                          ...prev,
                          pillars: prev.pillars.filter((_, idx) => idx !== i),
                        }))
                      }
                    >
                      Hapus
                    </Button>
                  </div>
                  <Input
                    placeholder="Nama pilar"
                    value={pillar.name}
                    onChange={(e) =>
                      update((prev) => {
                        const pillars = [...prev.pillars]
                        pillars[i] = { ...pillars[i], name: e.target.value }
                        return { ...prev, pillars }
                      })
                    }
                  />
                  <Input
                    placeholder="Deskripsi singkat"
                    value={pillar.description}
                    onChange={(e) =>
                      update((prev) => {
                        const pillars = [...prev.pillars]
                        pillars[i] = { ...pillars[i], description: e.target.value }
                        return { ...prev, pillars }
                      })
                    }
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      className="w-24"
                      value={pillar.percentage}
                      onChange={(e) =>
                        update((prev) => {
                          const pillars = [...prev.pillars]
                          pillars[i] = {
                            ...pillars[i],
                            percentage: Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0)),
                          }
                          return { ...prev, pillars }
                        })
                      }
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() =>
                  update((prev) => ({
                    ...prev,
                    pillars: [...prev.pillars, { name: '', description: '', percentage: 0 }],
                  }))
                }
              >
                Tambah pilar
              </Button>
              <div className="rounded-md border p-3">
                <p className="text-sm">
                  Total alokasi:{' '}
                  <span className={totalValid ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                    {totalPct}%
                  </span>{' '}
                  {totalValid ? '(valid)' : '(harus tepat 100%)'}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="channels" className="mt-4 space-y-1.5">
              <Label>Platform (satu per baris)</Label>
              <Textarea
                rows={6}
                placeholder={'Instagram\nTikTok\nLinkedIn'}
                value={brandData.channels.join('\n')}
                onChange={(e) =>
                  update((prev) => ({
                    ...prev,
                    channels: e.target.value.split('\n').map((c) => c.trim()).filter(Boolean),
                  }))
                }
              />
            </TabsContent>

            <TabsContent value="assets" className="mt-4 space-y-1.5">
              <Label>Brand assets (satu per baris)</Label>
              <Textarea
                rows={6}
                placeholder={'Logo variations\nColor palette\nTypography'}
                value={brandData.brandAssets.join('\n')}
                onChange={(e) =>
                  update((prev) => ({
                    ...prev,
                    brandAssets: e.target.value.split('\n').map((a) => a.trim()).filter(Boolean),
                  }))
                }
              />
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2">
            <Button variant="outline" className="h-11 sm:h-9" onClick={() => handleOpenChange(false)} disabled={saving}>
              Batal
            </Button>
            <Button
              className="h-11 sm:h-9"
              onClick={onSubmit}
              disabled={!totalValid || saving}
              title={totalValid ? undefined : 'Total alokasi pilar harus tepat 100%'}
            >
              {saving ? <LoaderIcon className="size-4 animate-spin" /> : null}
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
