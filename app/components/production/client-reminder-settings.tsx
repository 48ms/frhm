'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Icons } from '@/components/icons'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'

export function ClientReminderSettings({ clientId, embedded = false }: { clientId: string; embedded?: boolean }) {
  const supabase = createClient()
  const [enabled, setEnabled] = useState(false)
  const [hour, setHour] = useState(9)
  const [channel, setChannel] = useState<'telegram' | 'email' | 'both'>('telegram')
  const [saving, setSaving] = useState(false)

  // Fetch existing settings
  const { data, isLoading } = useQuery({
    queryKey: ['reminder-settings', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reminder_settings')
        .select('*')
        .eq('client_id', clientId)
        .maybeSingle()
      if (error) throw error
      return data ?? null
    },
  })

  // Initialize state from fetched data
  useEffect(() => {
    if (data) {
      setEnabled(data.enabled)
      setHour(data.reminder_hour ?? 9)
      setChannel((data.reminder_channel as 'telegram' | 'email' | 'both') || 'telegram')
    }
  }, [data])

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('reminder_settings')
        .upsert({
          client_id: clientId,
          enabled,
          reminder_hour: hour,
          reminder_channel: channel,
        })
      if (error) throw error
      toast.success('Pengaturan pengingat tersimpan')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const content = (
    <div className={embedded ? 'space-y-4' : undefined}>
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="reminder-enable" className="font-medium">Aktifkan pengingat</Label>
          <p className="text-xs text-muted-foreground">
            Kirim notifikasi H-1 sebelum jadwal tayang.
          </p>
        </div>
        <Button
          id="reminder-enable"
          variant={enabled ? 'default' : 'outline'}
          onClick={() => setEnabled(!enabled)}
          type="button"
        >
          {enabled ? 'Aktif' : 'Nonaktif'}
        </Button>
      </div>

        {/* Time selection */}
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Label htmlFor="reminder-hour" className="mb-1 block">Waktu pengingat (WIB)</Label>
            <Input
              id="reminder-hour"
              type="number"
              min={0}
              max={23}
              value={hour}
              onChange={(e) => setHour(Number(e.target.value))}
              disabled={!enabled}
              className="w-24"
            />
          </div>
          <div className="text-xs text-muted-foreground py-3">
            Pengingat akan dikirim setiap hari pada pukul {hour}:00 WIB.
          </div>
        </div>

        {/* Channel */}
        {enabled && (
          <div>
            <Label className="mb-1 block">Saluran</Label>
            <div className="flex items-center gap-2">
              {['telegram', 'email', 'both'].map((c) => (
                <Button
                  key={c}
                  type="button"
                  variant={channel === c ? 'default' : 'outline'}
                  onClick={() => setChannel(c as typeof channel)}
                  size="sm"
                  disabled={!enabled}
                >
                  {c === 'telegram' ? 'Telegram' : c === 'email' ? 'Email' : 'Keduanya'}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Last sent info */}
        {data?.last_sent_at && (
          <div className="text-xs text-muted-foreground">
            Pengingat terakhir dikirim:{' '}
            {new Date(data.last_sent_at).toLocaleString('id-ID')}
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={!enabled || saving}>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
    </div>
  )

  if (embedded) return content

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Icons.bell className="size-4" />
          Pengingat Jadwal
        </CardTitle>
        <CardDescription>
          Atur jadwal notifikasi pengingat untuk postingan yang akan tayang.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {content}
      </CardContent>
    </Card>
  )
}
