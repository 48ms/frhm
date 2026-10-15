'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/animate-ui/components/radix/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { useScheduleApprovedDeliverable } from '@/features/deliverables/api/queries';
import type { Deliverable } from '@/features/deliverables/api/types';
import { toast } from 'sonner';

interface ScheduleDeliverableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliverable: Deliverable | null;
  clientId: string;
}

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: Icons.instagram, color: 'text-pink-500 border-pink-500/30' },
  { id: 'tiktok', label: 'TikTok', icon: Icons.tiktok, color: 'text-cyan-500 border-cyan-500/30' },
  { id: 'twitter', label: 'Twitter / X', icon: Icons.twitter, color: 'text-sky-500 border-sky-500/30' },
  { id: 'facebook', label: 'Facebook', icon: Icons.facebook, color: 'text-blue-600 border-blue-600/30' },
  { id: 'linkedin', label: 'LinkedIn', icon: Icons.linkedin, color: 'text-blue-500 border-blue-500/30' },
  { id: 'youtube', label: 'YouTube Shorts', icon: Icons.youtube, color: 'text-red-500 border-red-500/30' },
];

function getTomorrowAt(hours: number, minutes: number = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hours, minutes, 0, 0);
  // Format to YYYY-MM-DDTHH:mm for datetime-local input
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getDayAfterTomorrowAt(hours: number, minutes: number = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  d.setHours(hours, minutes, 0, 0);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ScheduleDeliverableDialog({
  open,
  onOpenChange,
  deliverable,
  clientId,
}: ScheduleDeliverableDialogProps) {
  const scheduleMutation = useScheduleApprovedDeliverable();

  const [platform, setPlatform] = useState('instagram');
  const [scheduledAt, setScheduledAt] = useState(() => getTomorrowAt(10, 0));
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [campaignTag, setCampaignTag] = useState('');

  // Sync state whenever deliverable changes
  useEffect(() => {
    if (deliverable) {
      setTitle(deliverable.title || '');
      setContent(deliverable.content_md || '');
      setMediaUrl(deliverable.external_link || '');
      setCampaignTag(deliverable.type ? `#${deliverable.type}` : '#marketing-campaign');
      setScheduledAt(getTomorrowAt(10, 0));
    }
  }, [deliverable]);

  if (!deliverable) return null;

  const handlePresetClick = (presetIso: string) => {
    setScheduledAt(presetIso);
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Judul postingan tidak boleh kosong');
      return;
    }
    if (!scheduledAt) {
      toast.error('Jadwal tanggal dan waktu tayang wajib dipilih');
      return;
    }

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      toast.error('Format tanggal/waktu tayang tidak valid');
      return;
    }

    await scheduleMutation.mutateAsync({
      deliverableId: deliverable.id,
      clientId,
      platform,
      scheduledAt: scheduledDate.toISOString(),
      customTitle: title.trim(),
      customContent: content.trim(),
      mediaUrl: mediaUrl.trim() || undefined,
      campaignTag: campaignTag.trim() || undefined,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[92vw] max-h-[90vh] flex flex-col p-6 rounded-3xl bg-card/95 backdrop-blur-2xl border-border/50 overflow-hidden shadow-2xl">
        <DialogHeader className="border-b border-border/40 pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-brand-accent00/10 text-brand-accent00 dark:text-brand-accent00 flex items-center justify-center">
                <Icons.calendar className="size-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Jadwalkan Postingan ke Kalender
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Otomatisasi konten dari deliverable yang disetujui menuju kalender tayang WoopSocial.
                </DialogDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-xs border-border/4000/30 text-brand-accent00 bg-brand-accent00/10">
              <Icons.check className="size-3 mr-1" /> Siap Terbit
            </Badge>
          </div>
        </DialogHeader>

        <form onSubmit={handleScheduleSubmit} className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
          {/* Deliverable Info Strip */}
          <div className="p-3 rounded-xl border border-border/40 bg-muted/30 flex items-center justify-between text-xs">
            <div className="truncate mr-3">
              <span className="text-muted-foreground font-mono mr-1">Sumber:</span>
              <strong className="text-foreground">{deliverable.title}</strong>
            </div>
            <span className="capitalize px-2 py-0.5 rounded-md bg-background border border-border/50 text-[11px] font-medium text-muted-foreground">
              {deliverable.type}
            </span>
          </div>

          {/* Platform Selector */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-2">
              Pilih Kanal / Saluran Media Sosial
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PLATFORMS.map((p) => {
                const IconComp = p.icon;
                const isSelected = platform === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlatform(p.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all text-left ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'bg-background hover:bg-muted text-foreground border-border/60'
                    }`}
                  >
                    <IconComp className={`size-4 shrink-0 ${isSelected ? 'text-primary-foreground' : p.color}`} />
                    <span className="truncate">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Waktu Tayang & Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-foreground">
                Jadwal Tanggal & Jam Tayang
              </label>
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Icons.sparkles className="size-3 text-amber-500" />
                Rekomendasi Waktu Terbaik (Golden Hours)
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handlePresetClick(getTomorrowAt(10, 0))}
                className="px-2.5 py-1 text-xs rounded-lg border border-border/50 bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                Besok 10:00 (Pagi)
              </button>
              <button
                type="button"
                onClick={() => handlePresetClick(getTomorrowAt(12, 30))}
                className="px-2.5 py-1 text-xs rounded-lg border border-border/50 bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                Besok 12:30 (Siang)
              </button>
              <button
                type="button"
                onClick={() => handlePresetClick(getTomorrowAt(19, 0))}
                className="px-2.5 py-1 text-xs rounded-lg border border-border/50 bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                Besok 19:00 (Prime Time)
              </button>
              <button
                type="button"
                onClick={() => handlePresetClick(getDayAfterTomorrowAt(10, 0))}
                className="px-2.5 py-1 text-xs rounded-lg border border-border/50 bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                Lusa 10:00
              </button>
            </div>

            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus: focus:ring-2 focus:ring-primary/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              required
            />
          </div>

          {/* Judul & Caption */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Judul Postingan
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Judul postingan di kalender..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus: focus:ring-2 focus:ring-primary/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Caption / Teks Postingan
              </label>
              <textarea
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Caption atau narasi postingan..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus: focus:ring-2 focus:ring-primary/20 transition-all resize-none font-sans focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              />
            </div>
          </div>

          {/* Media URL & Campaign Tag */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                URL Lampiran Media (Opsional)
              </label>
              <input
                type="url"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://... (link gambar/video)"
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus: focus:ring-2 focus:ring-primary/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Campaign / Project Tag
              </label>
              <input
                type="text"
                value={campaignTag}
                onChange={(e) => setCampaignTag(e.target.value)}
                placeholder="#growth-campaign"
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus: focus:ring-2 focus:ring-primary/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-border/40 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              isLoading={scheduleMutation.isPending}
              className="h-8 text-xs bg-brand-accent00 hover:bg-brand-accent00 text-brand-accent0 dark:text-brand-accent50 font-medium gap-1.5 shadow-xs"
            >
              <Icons.calendar className="size-3.5" />
              Jadwalkan Sekarang
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
