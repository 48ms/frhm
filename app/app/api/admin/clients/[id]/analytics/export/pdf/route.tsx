import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Document, Page, Text, View, StyleSheet, Font, pdf } from '@react-pdf/renderer'
import type { Style } from '@react-pdf/stylesheet'
import path from 'path'

export const dynamic = 'force-dynamic'

// @react-pdf/renderer runs server-side where '/fonts/...' resolves to drive-root.
// Resolve via process.cwd() to <project>/public/fonts which is the real location.
const fontsDir = path.resolve(process.cwd(), 'public/fonts')
Font.register({
  family: 'Geist',
  fonts: [
    { src: path.join(fontsDir, 'Geist-Regular.ttf'), fontWeight: 400 },
    { src: path.join(fontsDir, 'Geist-SemiBold.ttf'), fontWeight: 600 },
    { src: path.join(fontsDir, 'Geist-Bold.ttf'), fontWeight: 700 },
  ],
})

interface TableRowProps {
  children: React.ReactNode
  header?: boolean
}

interface TableCellProps {
  children: React.ReactNode
  header?: boolean
  width?: string | number
  style?: Style
}

function TableRow({ children, header = false }: TableRowProps) {
  return (
    <View style={header ? [styles.tableRow, styles.tableHeader] : styles.tableRow}>
      {children}
    </View>
  )
}

function TableCell({ children, header = false, width, style }: TableCellProps) {
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <View style={[{ width }, header ? styles.tableCellHeader : styles.tableCell, style] as any}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Geist',
    fontSize: 10,
    lineHeight: 1.5,
    color: '#1D1D1F',
  },
  cover: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  },
  logo: {
    fontSize: 28,
    fontWeight: 700,
    color: '#0071E3',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 700,
    color: '#1D1D1F',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#86868B',
    marginBottom: 32,
  },
  clientName: {
    fontSize: 20,
    fontWeight: 600,
    color: '#1D1D1F',
    marginBottom: 8,
  },
  period: {
    fontSize: 14,
    color: '#86868B',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#1D1D1F',
    marginTop: 24,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#D2D2D7',
    paddingBottom: 4,
  },
  insightText: {
    fontSize: 10,
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
    marginBottom: 16,
  },
  table: {
    width: '100%',
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: '#D2D2D7',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F7',
    borderBottomWidth: 1,
    borderBottomColor: '#D2D2D7',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  tableCell: {
    padding: 6,
    fontSize: 8,
  },
  tableCellHeader: {
    padding: 6,
    fontSize: 8,
    fontWeight: 700,
    color: '#1D1D1F',
  },
  notes: {
    fontSize: 10,
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#D2D2D7',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#86868B',
  },
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: client } = await supabase.from('clients').select('name').eq('id', clientId).single()

  const { data: summaries } = await supabase
    .from('analytics_summaries')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1)

  const latestSummary = summaries?.[0]

  let postsData: Record<string, unknown>[] = []
  if (latestSummary) {
    const { data: posts } = await supabase
      .from('scheduled_posts')
      .select(`
        id, title, platform, scheduled_at, campaign_tag, content_type, creative_format,
        post_metrics ( views, reach, likes, comments, shares, saves, clicks, wa_inquiries, dm_inquiries )
      `)
      .eq('client_id', clientId)
      .eq('status', 'published')
      .gte('scheduled_at', latestSummary.period_start)
      .lte('scheduled_at', latestSummary.period_end)
      .order('scheduled_at', { ascending: true })

    postsData = posts || []
  }

  const filteredPosts = latestSummary?.campaign_tag
    ? postsData.filter(p => p.campaign_tag === latestSummary.campaign_tag)
    : postsData

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let totalReach = 0, totalEngagement = 0, totalWa = 0, totalDm = 0

  // Fetch Competitors
  const { data: competitorRows } = await supabase
    .from('competitor_benchmarks')
    .select('brand_name, platform, avg_reach, avg_er, weekly_posts')
    .eq('client_id', clientId)

  // Fetch Seasonal Periods
  const { data: seasonalRows } = latestSummary
    ? await supabase
        .from('seasonal_periods')
        .select('name, start_date, end_date, impact_multiplier')
        .gte('end_date', latestSummary.period_start)
        .lte('start_date', latestSummary.period_end)
    : { data: [] }

  // Fetch Predictions
  const { data: predictionRows } = await supabase
    .from('analytics_predictions')
    .select('target_month, forecasted_reach, forecasted_er, forecasted_wa_inquiries, forecasted_dm_inquiries, estimated_roi_multiplier, confidence_score')
    .eq('client_id', clientId)
    .order('target_month', { ascending: false })
    .limit(1)
  type PostWithMetrics = {
    id: string
    title: string
    platform: string
    campaign_tag?: string | null
    content_type?: string | null
    creative_format?: string | null
    metrics: { reach: number; likes: number; comments: number; shares: number; saves: number; clicks: number; wa_inquiries: number; dm_inquiries: number }
  }
  const postsWithMetrics = (filteredPosts.map(p => {
    const post = p as unknown as { post_metrics?: Array<{ reach: number; likes: number; comments: number; shares: number; saves: number; clicks: number; wa_inquiries: number; dm_inquiries: number }> }
    const m = post.post_metrics?.[0]
    if (!m) return null
    const reach = m.reach || 0
    const engagement = (m.likes || 0) + (m.comments || 0) + (m.shares || 0) + (m.saves || 0)
    totalReach += reach
    totalEngagement += engagement
    totalWa += m.wa_inquiries || 0
    totalDm += m.dm_inquiries || 0
    return { ...p, metrics: m }
  }).filter(Boolean)) as unknown as PostWithMetrics[]

  const campaignStats = new Map<string, { posts: number; reach: number; engagement: number }>()
  for (const p of postsWithMetrics) {
    const tag = p.campaign_tag || 'Tanpa Kampanye'
    const stat = campaignStats.get(tag) || { posts: 0, reach: 0, engagement: 0 }
    stat.posts++
    stat.reach += p.metrics.reach || 0
    stat.engagement += (p.metrics.likes || 0) + (p.metrics.comments || 0) + (p.metrics.shares || 0) + (p.metrics.saves || 0)
    campaignStats.set(tag, stat)
  }

  const sortedByER = [...postsWithMetrics].sort((a, b) => {
    const erA = a.metrics.reach > 0 ? ((a.metrics.likes + a.metrics.comments + a.metrics.shares + a.metrics.saves) / a.metrics.reach) * 100 : 0
    const erB = b.metrics.reach > 0 ? ((b.metrics.likes + b.metrics.comments + b.metrics.shares + b.metrics.saves) / b.metrics.reach) * 100 : 0
    return erB - erA
  })
  const top3 = sortedByER.slice(0, 3)
  const bottom3 = sortedByER.slice(-3).reverse()

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.cover}>
          <Text style={styles.logo}>Frhm</Text>
          <Text style={styles.title}>Laporan Bulanan</Text>
          <Text style={styles.subtitle}>Analitik Performa Media Sosial</Text>
          <Text style={styles.clientName}>{client?.name || 'Client'}</Text>
          <Text style={styles.period}>
            {latestSummary
              ? `${new Date(latestSummary.period_start).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} – ${new Date(latestSummary.period_end).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
              : 'Belum ada data'}
          </Text>
        </View>
        <View style={styles.footer}>
          <Text>Frhm — Digital Marketing Platform</Text>
          <Text>Generated: {new Date().toLocaleDateString('id-ID')}</Text>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        {latestSummary && (
          <>
            <Text style={styles.sectionTitle}>Ringkasan Eksekutif (AI Insight)</Text>
            <Text style={styles.insightText}>{latestSummary.ai_insight}</Text>
          </>
        )}

        <Text style={styles.sectionTitle}>Attribution Funnel</Text>
        <View style={styles.table}>
          <TableRow header>
            <TableCell header width="35%">Kanal</TableCell>
            <TableCell header width="65%" style={{ textAlign: 'right' as const }}>Inquiry</TableCell>
          </TableRow>
          <TableRow>
            <TableCell width="35%">WhatsApp</TableCell>
            <TableCell width="65%" style={{ textAlign: 'right' as const }}>{totalWa}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell width="35%">Direct Message</TableCell>
            <TableCell width="65%" style={{ textAlign: 'right' as const }}>{totalDm}</TableCell>
          </TableRow>
        </View>

        {competitorRows && competitorRows.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Benchmark Kompetitor</Text>
            <View style={styles.table}>
              <TableRow header>
                <TableCell header width="30%">Brand</TableCell>
                <TableCell header width="20%">Platform</TableCell>
                <TableCell header width="20%" style={{ textAlign: 'right' as const }}>Reach</TableCell>
                <TableCell header width="15%" style={{ textAlign: 'right' as const }}>ER</TableCell>
                <TableCell header width="15%" style={{ textAlign: 'right' as const }}>Post/Wk</TableCell>
              </TableRow>
              {competitorRows.map(c => (
                <TableRow key={c.brand_name}>
                  <TableCell width="30%">{c.brand_name}</TableCell>
                  <TableCell width="20%">{c.platform}</TableCell>
                  <TableCell width="20%" style={{ textAlign: 'right' as const }}>{c.avg_reach.toLocaleString()}</TableCell>
                  <TableCell width="15%" style={{ textAlign: 'right' as const }}>{c.avg_er}%</TableCell>
                  <TableCell width="15%" style={{ textAlign: 'right' as const }}>{c.weekly_posts}</TableCell>
                </TableRow>
              ))}
            </View>
          </>
        )}

        {seasonalRows && seasonalRows.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Faktor Musiman</Text>
            <View style={styles.table}>
              <TableRow header>
                <TableCell header width="50%">Musim</TableCell>
                <TableCell header width="50%" style={{ textAlign: 'right' as const }}>Impact Multiplier</TableCell>
              </TableRow>
              {seasonalRows.map(s => (
                <TableRow key={s.name}>
                  <TableCell width="50%">{s.name}</TableCell>
                  <TableCell width="50%" style={{ textAlign: 'right' as const }}>{s.impact_multiplier}x</TableCell>
                </TableRow>
              ))}
            </View>
          </>
        )}

        {predictionRows && predictionRows.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Proyeksi Performa & Forecasting ROI</Text>
            <View style={styles.table}>
              <TableRow header>
                <TableCell header width="30%">Target Metrik</TableCell>
                <TableCell header width="70%" style={{ textAlign: 'right' as const }}>Proyeksi / Forecast</TableCell>
              </TableRow>
              <TableRow>
                <TableCell width="30%">Target Reach</TableCell>
                <TableCell width="70%" style={{ textAlign: 'right' as const }}>{predictionRows[0].forecasted_reach.toLocaleString()}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell width="30%">Target ER</TableCell>
                <TableCell width="70%" style={{ textAlign: 'right' as const }}>{predictionRows[0].forecasted_er}%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell width="30%">Inquiry Forecast</TableCell>
                <TableCell width="70%" style={{ textAlign: 'right' as const }}>WA: +{predictionRows[0].forecasted_wa_inquiries} | DM: +{predictionRows[0].forecasted_dm_inquiries}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell width="30%">Estimasi ROI Multiplier</TableCell>
                <TableCell width="70%" style={{ textAlign: 'right' as const }}>{predictionRows[0].estimated_roi_multiplier}x (Confidence {Math.round(predictionRows[0].confidence_score * 100)}%)</TableCell>
              </TableRow>
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>Performa per Kampanye</Text>
        <View style={styles.table}>
          <TableRow header>
            <TableCell header width="35%">Kampanye</TableCell>
            <TableCell header width="15%" style={{ textAlign: 'center' as const }}>Post</TableCell>
            <TableCell header width="25%" style={{ textAlign: 'right' as const }}>Reach</TableCell>
            <TableCell header width="25%" style={{ textAlign: 'right' as const }}>Engagement Rate</TableCell>
          </TableRow>
          {Array.from(campaignStats.entries()).map(([tag, s]) => (
            <TableRow key={tag}>
              <TableCell width="35%">{tag}</TableCell>
              <TableCell width="15%" style={{ textAlign: 'center' as const }}>{s.posts}</TableCell>
              <TableCell width="25%" style={{ textAlign: 'right' as const }}>{s.reach.toLocaleString()}</TableCell>
              <TableCell width="25%" style={{ textAlign: 'right' as const }}>{s.reach > 0 ? ((s.engagement / s.reach) * 100).toFixed(1) + '%' : '0%'}</TableCell>
            </TableRow>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Top 3 Postingan (by Engagement Rate)</Text>
        <View style={styles.table}>
          <TableRow header>
            <TableCell header width="40%">Judul</TableCell>
            <TableCell header width="15%">Platform</TableCell>
            <TableCell header width="15%" style={{ textAlign: 'right' as const }}>Reach</TableCell>
            <TableCell header width="15%" style={{ textAlign: 'right' as const }}>Eng. Rate</TableCell>
            <TableCell header width="15%" style={{ textAlign: 'right' as const }}>Kampanye</TableCell>
          </TableRow>
          {top3.map(p => {
            const er = p.metrics.reach > 0 ? ((p.metrics.likes + p.metrics.comments + p.metrics.shares + p.metrics.saves) / p.metrics.reach * 100).toFixed(1) : '0'
            return (
              <TableRow key={p.id}>
                <TableCell width="40%">{p.title}</TableCell>
                <TableCell width="15%">{p.platform}</TableCell>
                <TableCell width="15%" style={{ textAlign: 'right' as const }}>{p.metrics.reach.toLocaleString()}</TableCell>
                <TableCell width="15%" style={{ textAlign: 'right' as const }}>{er}%</TableCell>
                <TableCell width="15%">{p.campaign_tag || '-'}</TableCell>
              </TableRow>
            )
          })}
        </View>

        <Text style={styles.sectionTitle}>Bottom 3 Postingan (by Engagement Rate)</Text>
        <View style={styles.table}>
          <TableRow header>
            <TableCell header width="40%">Judul</TableCell>
            <TableCell header width="15%">Platform</TableCell>
            <TableCell header width="15%" style={{ textAlign: 'right' as const }}>Reach</TableCell>
            <TableCell header width="15%" style={{ textAlign: 'right' as const }}>Eng. Rate</TableCell>
            <TableCell header width="15%" style={{ textAlign: 'right' as const }}>Kampanye</TableCell>
          </TableRow>
          {bottom3.map(p => {
            const er = p.metrics.reach > 0 ? ((p.metrics.likes + p.metrics.comments + p.metrics.shares + p.metrics.saves) / p.metrics.reach * 100).toFixed(1) : '0'
            return (
              <TableRow key={p.id}>
                <TableCell width="40%">{p.title}</TableCell>
                <TableCell width="15%">{p.platform}</TableCell>
                <TableCell width="15%" style={{ textAlign: 'right' as const }}>{p.metrics.reach.toLocaleString()}</TableCell>
                <TableCell width="15%" style={{ textAlign: 'right' as const }}>{er}%</TableCell>
                <TableCell width="15%">{p.campaign_tag || '-'}</TableCell>
              </TableRow>
            )
          })}
        </View>

        {latestSummary?.operator_notes && (
          <>
            <Text style={styles.sectionTitle}>Catatan Operator</Text>
            <Text style={styles.notes}>{latestSummary.operator_notes}</Text>
          </>
        )}
        <View style={styles.footer}>
          <Text>Frhm — Digital Marketing Platform</Text>
          <Text>Page 2 of 2</Text>
        </View>
      </Page>
    </Document>
  )

  try {
    const pdfBlob = await pdf(doc).toBlob()
    const buffer = await pdfBlob.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="laporan-${clientId}-${new Date().toISOString().split('T')[0]}.pdf"`,
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? err.stack : ''
    console.error('[PDF EXPORT ERROR]', msg, stack)
    return NextResponse.json({ error: 'PDF generation failed: ' + msg }, { status: 500 })
  }
}
