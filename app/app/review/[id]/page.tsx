import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { getDeliverableById } from '@/features/deliverables/api/service';
import { deliverableQueries } from '@/features/deliverables/api/queries';
import { ClientReviewPortal } from './client-review-portal';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { id } = await props.params;
  const data = await getDeliverableById(id);

  if (!data) {
    return {
      title: 'Dokumen Tidak Ditemukan',
    };
  }

  return {
    title: `${data.deliverable.title} - Review Materi`,
    description: `Tinjau dan setujui deliverable ${data.deliverable.title} untuk ${data.client?.name ?? 'Klien'}.`,
  };
}

export default async function DeliverableReviewPage(props: PageProps) {
  const { id } = await props.params;
  const data = await getDeliverableById(id);

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-border/40 rounded-2xl p-8 text-center shadow-xs space-y-4">
          <div className="size-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <Icons.alertCircle className="size-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Dokumen Tidak Ditemukan</h1>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              Tautan review ini mungkin telah kadaluarsa, salah, atau dokumen telah dipindahkan oleh tim Frhm.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/">
              <Button variant="outline" size="sm">
                <Icons.arrowLeft className="size-3.5 mr-1.5" />
                Kembali ke Beranda
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(deliverableQueries.detail(id));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense
        fallback={
          <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center animate-pulse">
            <div className="w-12 h-12 rounded-full bg-muted mb-4" />
            <div className="h-6 w-48 bg-muted rounded mb-2" />
            <div className="h-4 w-32 bg-muted/50 rounded" />
          </div>
        }
      >
        <ClientReviewPortal deliverableId={id} initialData={data} />
      </Suspense>
    </HydrationBoundary>
  );
}
