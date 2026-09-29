'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { AdSpendFormModal } from './ad-spend-form-modal'
import type { RealtimeChannel } from '@/lib/supabase/client'

type AdSpendLog = {
  id: string
  client_id: string
  campaign_name: string
  spend: number
  clicks: number
  log_date: string
}

export function AdsTrackerBoard({ clientId }: { clientId: string }) {
  const [logs, setLogs] = useState<AdSpendLog[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  const handleSuccess = (newLog: AdSpendLog) => {
    setLogs([...logs, newLog].sort((a, b) => new Date(a.log_date).getTime() - new Date(b.log_date).getTime()))
  }

  useEffect(() => {
    async function fetchLogs() {
      const { data, error } = await supabase
        .from('ad_spend_logs')
        .select('*')
        .eq('client_id', clientId)
        .order('log_date', { ascending: true })

      if (data && !error) setLogs(data)
      setLoading(false)
    }
    fetchLogs()

    channelRef.current = supabase
      .channel('ad-spend-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ad_spend_logs' },
        (payload) => {
          const log = payload.new as AdSpendLog
          if (log.client_id === clientId) {
            handleSuccess(log)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channelRef.current!)
    }
  }, [clientId, supabase])

  // Form submit handler has been moved to AdSpendFormModal

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Log Ad Spend Manual</CardTitle>
            <CardDescription>Catat pengeluaran dan klik iklan harian</CardDescription>
          </div>
          <AdSpendFormModal clientId={clientId} onSuccess={handleSuccess}>
            <Button size="sm" className="h-9">
              <Icons.add className="size-4 mr-2" /> Log Manual
            </Button>
          </AdSpendFormModal>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground py-4">
            Total log tercatat: {logs.length}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trendline Performa Iklan</CardTitle>
          <CardDescription>Grafik pengeluaran vs klik seiring waktu</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Loading chart...</div>
          ) : logs.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">Belum ada data.</div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={logs} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="log_date" tickFormatter={(tick) => new Date(tick).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })} />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="spend" name="Spend (IDR)" stroke="#2563eb" activeDot={{ r: 8 }} />
                  <Line yAxisId="right" type="monotone" dataKey="clicks" name="Clicks" stroke="#16a34a" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
