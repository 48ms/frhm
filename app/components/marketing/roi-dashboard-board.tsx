'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { Icons } from '@/components/icons'
import { Skeleton } from '@/components/ui/skeleton'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import type { RealtimeChannel } from '@/lib/supabase/client'

export function ROIDashboardBoard({ clientId }: { clientId: string }) {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    totalAdSpend: 0,
    totalExpenses: 0,
    totalReach: 0,
    totalClicks: 0,
    totalConversions: 0,
    expenseData: [] as { name: string; value: number }[],
  })
  
  const supabase = createClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        // 1. Fetch Expenses
        const { data: expenses } = await supabase
          .from('expenses')
          .select('amount, category')
          .eq('client_id', clientId)

        // 2. Fetch Ad Spend Logs
        const { data: adSpends } = await supabase
          .from('ad_spend_logs')
          .select('spend, clicks')
          .eq('client_id', clientId)

        // Calculate Totals
        let totalExpenses = 0
        const expenseByCategory: Record<string, number> = {
          ads: 0, kol: 0, event: 0, other: 0
        }

        if (expenses) {
          expenses.forEach(e => {
            totalExpenses += Number(e.amount)
            const cat = e.category || 'other'
            expenseByCategory[cat] = (expenseByCategory[cat] || 0) + Number(e.amount)
          })
        }

        let totalAdSpend = 0
        let totalAdClicks = 0
        if (adSpends) {
          adSpends.forEach(a => {
            totalAdSpend += Number(a.spend)
            totalAdClicks += Number(a.clicks)
          })
        }
        
        totalExpenses += totalAdSpend

        // 3. Fetch Campaigns for this client
        const { data: campaigns } = await supabase
          .from('campaigns')
          .select('id')
          .eq('client_id', clientId)

        let totalReach = 0
        let totalClicks = totalAdClicks
        let totalConversions = 0

        if (campaigns && campaigns.length > 0) {
          const campaignIds = campaigns.map(c => c.id)
          const { data: contentMetrics } = await supabase
            .from('content_metrics')
            .select('reach, clicks, conversions')
            .in('campaign_id', campaignIds)

          if (contentMetrics) {
            contentMetrics.forEach(m => {
              totalReach += Number(m.reach || 0)
              totalClicks += Number(m.clicks || 0)
              totalConversions += Number(m.conversions || 0)
            })
          }
        }

        const chartData = [
          { name: 'Ads', value: expenseByCategory.ads + totalAdSpend },
          { name: 'KOL', value: expenseByCategory.kol },
          { name: 'Event', value: expenseByCategory.event },
          { name: 'Other', value: expenseByCategory.other },
        ].filter(d => d.value > 0)

        setMetrics({
          totalAdSpend: expenseByCategory.ads + totalAdSpend,
          totalExpenses,
          totalReach,
          totalClicks,
          totalConversions,
          expenseData: chartData.length > 0 ? chartData : [{ name: 'No Data', value: 0 }]
        })

      } catch (err) {
        console.error('Error fetching ROI data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    channelRef.current = supabase
      .channel('roi-expenses-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'expenses' },
        (payload) => {
          const row = payload.new as Record<string, unknown>
          if (row.client_id === clientId) {
            fetchData()
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ad_spend_logs' },
        (payload) => {
          const row = payload.new as Record<string, unknown>
          if (row.client_id === clientId) {
            fetchData()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channelRef.current!)
    }
  }, [clientId, supabase])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    )
  }

  const cpc = metrics.totalClicks > 0 ? metrics.totalExpenses / metrics.totalClicks : 0
  const cpa = metrics.totalConversions > 0 ? metrics.totalExpenses / metrics.totalConversions : 0

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold tracking-tight">Executive Dashboard & ROI</h3>
        <p className="text-xs text-muted-foreground">
          Pantau Return on Investment dari budget marketing yang dikeluarkan.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-brand-accent/5 border-transparent">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 font-medium text-brand-accent">
              <Icons.banknote className="size-4" />
              Total Pengeluaran
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              Rp {metrics.totalExpenses.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Ads, KOL, Event, dll.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 font-medium">
              <Icons.trendingUp className="size-4 text-muted-foreground" />
              Total Reach
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">
              {metrics.totalReach.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Jangkauan audiens organik & ads</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 font-medium">
              <Icons.mousePointer className="size-4 text-muted-foreground" />
              Total Clicks (CPC)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">
              {metrics.totalClicks.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              CPC: Rp {Math.round(cpc).toLocaleString('id-ID')} / klik
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 font-medium">
              <Icons.activity className="size-4 text-muted-foreground" />
              Conversions (CPA)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-brand-accent drop-shadow-sm">
              {metrics.totalConversions.toLocaleString('id-ID')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              CPA: Rp {Math.round(cpa).toLocaleString('id-ID')} / conv
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Icons.forms className="size-4" /> Distribusi Pengeluaran
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {metrics.totalExpenses === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                Belum ada data pengeluaran.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.expenseData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                  <XAxis type="number" tickFormatter={(value) => `Rp ${value/1000}k`} fontSize={12} />
                  <YAxis dataKey="name" type="category" fontSize={12} />
                  <Tooltip 
                    formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Pengeluaran']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" fill="currentColor" className="fill-brand-accent" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-50/50 dark:bg-zinc-900/20 border-dashed">
          <CardContent className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
            <div className="size-16 rounded-full bg-brand-accent/10 flex items-center justify-center text-brand-accent">
              <Icons.trendingUp className="size-8" />
            </div>
            <div>
              <h4 className="font-semibold text-lg">Trendline ROAS Segera Hadir</h4>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                Korelasi langsung antara pengeluaran harian dan konversi akan ditampilkan di sini sebagai grafik garis (ROAS).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
