import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Icons } from '@/components/icons'

export const dynamic = 'force-dynamic'

export default async function KOLProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: kol } = await supabase
    .from('kols')
    .select('*')
    .eq('id', id)
    .single()

  if (!kol) notFound()

  // NOTE: there is no FK linking kols -> content_items, so we cannot honestly
  // show "this KOL's" work. We show the client's content activity as context
  // and label it accordingly (see the card title below).
  const { data: history } = await supabase
    .from('content_items')
    .select('id, title, stage, target_date, platform, is_urgent')
    .eq('client_id', kol.client_id)
    .order('target_date', { ascending: false })
    .limit(10)

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/crm"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <Icons.arrowLeft className="size-3.5" /> Kembali ke Direktori
        </Link>
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Icons.profile className="size-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{kol.name}</h1>
            <p className="text-muted-foreground">{kol.niche || 'General Niche'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Informasi Profil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Icons.phone className="size-4 text-muted-foreground" />
              <span className="text-sm">{kol.contact_info || 'Belum ada kontak'}</span>
            </div>
            <div className="flex items-center gap-3">
              <Icons.tag className="size-4 text-muted-foreground" />
              <span className="text-sm">{kol.platforms?.join(', ') || 'Belum ada platform'}</span>
            </div>
            <div className="flex items-center gap-3">
              <Icons.banknote className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">Rp {kol.rate_card?.toLocaleString('id-ID') || 'N/A'}</span>
            </div>
            
            {kol.notes && (
              <div className="pt-4 border-t mt-4">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{kol.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Aktivitas Konten Klien</CardTitle>
            <CardDescription>
              Konten terbaru milik klien ini sebagai konteks kerja sama. (Belum ada relasi langsung KOL ke item konten.)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {history && history.length > 0 ? (
              <div className="space-y-4">
                {history.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <Icons.calendar className="size-3" />
                        {item.target_date ? new Date(item.target_date).toLocaleDateString('id-ID') : 'TBD'}
                      </div>
                    </div>
                    <Badge variant={item.stage === 'Published' ? 'default' : 'secondary'}>
                      {item.stage}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Icons.calendar className="size-8 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Belum ada riwayat kolaborasi dengan talent ini.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
