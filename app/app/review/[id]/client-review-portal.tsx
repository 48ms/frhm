'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useDeliverableDetail, useSubmitDeliverableReview } from '@/features/deliverables/api/queries';
import type { DeliverableDetailResponse } from '@/features/deliverables/api/types';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ExportPdfDialog } from '@/components/deliverable/export-pdf-dialog';

interface ClientReviewPortalProps {
  deliverableId: string;
  initialData: DeliverableDetailResponse;
}

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  brief: { label: 'Creative Brief', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
  copy: { label: 'Copywriting / Post Plan', color: 'bg-brand-accent00/10 text-brand-accent00 dark:text-brand-accent00 border-border/4000/20' },
  report: { label: 'Report / Analysis', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
  strategy: { label: 'Marketing Strategy', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  audit: { label: 'Account Audit', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
};

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; badgeClass: string; icon: any }> = {
  draft: { label: 'Draft Internal', variant: 'secondary', badgeClass: 'bg-muted text-muted-foreground border-border', icon: Icons.clock },
  sent: { label: 'Menunggu Review Anda', variant: 'outline', badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30', icon: Icons.clock },
  approved: { label: 'Disetujui (Approved)', variant: 'default', badgeClass: 'bg-brand-accent00/10 text-brand-accent00 dark:text-brand-accent00 border-border/4000/30', icon: Icons.circleCheck },
  revision_requested: { label: 'Revisi Diminta', variant: 'destructive', badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30', icon: Icons.warning },
};

const RATING_LABELS: Record<number, string> = {
  1: 'Perlu Banyak Revisi',
  2: 'Kurang Sesuai Arahan',
  3: 'Cukup Baik / Lumayan',
  4: 'Bagus & Sangat Menarik',
  5: 'Sempurna / Siap Tayang!',
};

export function ClientReviewPortal({ deliverableId, initialData }: ClientReviewPortalProps) {
  const { data: detailData } = useDeliverableDetail(deliverableId);
  const data = detailData ?? initialData;
  const { deliverable, client, comments, feedback } = data;

  const submitReviewMutation = useSubmitDeliverableReview();

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [reviewerName, setReviewerName] = useState(client?.name ?? '');
  const [exportPdfOpen, setExportPdfOpen] = useState(false);

  const typeMeta = TYPE_CONFIG[deliverable.type] ?? {
    label: deliverable.type.toUpperCase(),
    color: 'bg-muted text-muted-foreground border-border',
  };

  const statusMeta = STATUS_CONFIG[deliverable.status] ?? STATUS_CONFIG.sent;
  const StatusIcon = statusMeta.icon;

  const handleSubmitReview = async (newStatus: 'approved' | 'revision_requested') => {
    if (newStatus === 'revision_requested' && !feedbackNote.trim()) {
      toast.error('Mohon cantumkan catatan revisi agar tim kami dapat segera memperbaikinya.');
      return;
    }

    await submitReviewMutation.mutateAsync({
      deliverableId: deliverable.id,
      status: newStatus,
      rating: rating > 0 ? rating : undefined,
      feedbackNote: feedbackNote.trim() || undefined,
      clientAuthorName: reviewerName.trim() || client?.name || 'Klien',
    });

    if (newStatus === 'approved') {
      setFeedbackNote('');
    }
  };

  const formattedDate = deliverable.created_at
    ? new Date(deliverable.created_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  const activeRating = hoverRating ?? rating;

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-xs">
              F
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm tracking-tight">Frhm</span>
                <span className="text-xs text-muted-foreground">Client Review Portal</span>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                {client?.name ? `Khusus Brand: ${client.name}` : 'Dokumen Pemasaran'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setExportPdfOpen(true)}
              className="h-8 gap-1.5 text-xs font-medium border-border/60 hover:bg-accent cursor-pointer"
            >
              <Icons.fileTypePdf className="size-3.5 text-red-500" />
              <span>Ekspor PDF</span>
            </Button>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${statusMeta.badgeClass}`}
            >
              <StatusIcon className="size-3.5" />
              {statusMeta.label}
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Banner Identitas Dokumen */}
        <div className="rounded-2xl border border-border/40 bg-card p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium border ${typeMeta.color}`}>
                {typeMeta.label}
              </span>
              <span className="text-xs text-muted-foreground">Dibuat pada {formattedDate}</span>
            </div>
            {deliverable.external_link && (
              <a
                href={deliverable.external_link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
              >
                <Icons.externalLink className="size-3.5" />
                Buka Aset Eksternal (Figma/Drive)
              </a>
            )}
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {deliverable.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Dokumen ini disiapkan oleh tim marketing Frhm untuk ditinjau dan disetujui oleh manajemen{' '}
              <strong className="text-foreground">{client?.name || 'Klien'}</strong>.
            </p>
          </div>

          {deliverable.status === 'approved' && (
            <div className="p-4 rounded-xl border border-border/4000/30 bg-brand-accent00/10 flex items-start gap-3 text-brand-accent00 dark:text-brand-accent00">
              <Icons.circleCheck className="size-5 shrink-0 text-brand-accent00 dark:text-brand-accent00 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold">Dokumen Ini Telah Disetujui (Approved)</p>
                <p className="text-xs opacity-90 mt-0.5">
                  Terima kasih! Tim Frhm telah menerima persetujuan Anda dan konten ini siap diproses ke tahap
                  produksi/publikasi sesuai jadwal.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Isi Dokumen (Markdown Reader) */}
        <article className="rounded-2xl border border-border/40 bg-card p-6 sm:p-10 shadow-xs prose dark:prose-invert max-w-none">
          <div className="pb-4 mb-6 border-b border-border/40 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Konten Deliverable
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(deliverable.content_md || '');
                toast.success('Konten berhasil disalin ke clipboard');
              }}
              className="text-xs h-7 text-muted-foreground hover:text-foreground"
            >
              <Icons.copy className="size-3 mr-1" />
              Salin Teks
            </Button>
          </div>

          {deliverable.content_md ? (
            <div className="space-y-4 text-foreground/90 leading-relaxed text-sm-plus">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-bold text-foreground mt-6 mb-3 pb-2 border-b border-border/30">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-semibold text-foreground mt-5 mb-2">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">{children}</h3>
                  ),
                  p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 mb-4">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 mb-4">{children}</ol>,
                  li: ({ children }) => <li className="pl-1">{children}</li>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-primary/50 pl-4 py-1 italic my-4 text-muted-foreground bg-muted/30 rounded-r-lg">
                      {children}
                    </blockquote>
                  ),
                  code: ({ children }) => (
                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-muted/80 p-4 rounded-xl overflow-x-auto text-xs font-mono border border-border/40">
                      {children}
                    </pre>
                  ),
                }}
              >
                {deliverable.content_md}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <Icons.document className="size-10 mx-auto stroke-1 opacity-40 mb-2" />
              <p className="text-sm">Dokumen ini belum memiliki konten teks.</p>
            </div>
          )}
        </article>

        {/* Panel Review & Keputusan Klien */}
        <div className="rounded-2xl border border-border/40 bg-card p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-border/40 pb-4">
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Icons.badgeCheck className="size-5 text-primary" />
              Formulir Keputusan & Ulasan Klien
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Pilih tindakan di bawah ini untuk memberi konfirmasi kepada tim Frhm secara mandiri.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input Nama Peninjau & Rating Bintang */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Nama Peninjau / PIC Klien
                </label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="Contoh: Pak Adit / Bunda"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus: focus:ring-2 focus:ring-primary/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Tingkat Kepuasan & Kesesuaian Arahan
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="p-1 rounded-md hover:bg-muted transition-colors focus: focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      aria-label={`Beri nilai ${star} bintang`}
                    >
                      <Icons.star
                        className={`size-6 transition-all ${
                          star <= activeRating
                            ? 'text-amber-500 fill-amber-500 scale-105'
                            : 'text-muted-foreground/30 hover:text-muted-foreground/50'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-medium text-muted-foreground ml-2">
                    {RATING_LABELS[activeRating] ?? ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Catatan Feedback / Revisi */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-foreground">
                Catatan / Instruksi Tambahan{' '}
                <span className="text-muted-foreground font-normal">(Wajib jika meminta revisi)</span>
              </label>
              <textarea
                rows={4}
                value={feedbackNote}
                onChange={(e) => setFeedbackNote(e.target.value)}
                placeholder="Tuliskan masukan spesifik Anda di sini (misal: 'Tolong tone bagian caption dibuat lebih santai' atau 'Sudah oke, silakan jadwalkan')..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus: focus:ring-2 focus:ring-primary/20 transition-all resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-border/40 flex flex-wrap items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              isLoading={submitReviewMutation.isPending}
              onClick={() => handleSubmitReview('revision_requested')}
              className="text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10 h-10 px-4"
            >
              <Icons.warning className="size-4 mr-2" />
              Minta Revisi
            </Button>

            <Button
              type="button"
              variant="default"
              isLoading={submitReviewMutation.isPending}
              onClick={() => handleSubmitReview('approved')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium h-10 px-5 shadow-sm"
            >
              <Icons.check className="size-4 mr-2" />
              Setujui Dokumen (Approve)
            </Button>
          </div>
        </div>

        {/* Riwayat Diskusi / Feedback Terdahulu */}
        {comments && comments.length > 0 && (
          <div className="rounded-2xl border border-border/40 bg-card p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Icons.chat className="size-4 text-primary" />
              Riwayat Feedback & Catatan Sebelumnya ({comments.length})
            </h3>
            <div className="space-y-3">
              {comments.map((comm) => (
                <div
                  key={comm.id}
                  className="p-3.5 rounded-xl border border-border/40 bg-muted/30 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">
                      {comm.author_name}{' '}
                      <span className="font-normal text-muted-foreground">
                        ({comm.author_role === 'client' ? 'Klien' : 'Tim Frhm'})
                      </span>
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(comm.created_at).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap">{comm.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center py-6 text-xs text-muted-foreground space-y-1">
          <p>© {new Date().getFullYear()} Frhm — Digital Marketing Platform.</p>
          <p>Layanan kolaborasi resmi antara Klien dan Frhm.</p>
        </footer>
      </main>

      {/* Export PDF Modal */}
      <ExportPdfDialog
        open={exportPdfOpen}
        onOpenChange={setExportPdfOpen}
        deliverable={deliverable}
        clientName={client?.name || 'Klien'}
      />
    </div>
  );
}
