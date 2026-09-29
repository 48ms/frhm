import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { notifyClientReminder } from '@/lib/telegram/service'
import { isFeatureEnabled } from '@/lib/feature-flags'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * Hourly CRON job that finds clients expecting a reminder at the current hour,
 * checks if they have any scheduled posts tomorrow, and sends a notification.
 */
export async function POST(request: Request) {
  // Verify auth header
  const secret = process.env.CRON_SECRET || 'test_cron_secret'
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized CRON trigger' }, { status: 401 })
  }

  // Kill-switch: if reminders are disabled globally, do nothing
  const remindersEnabled = await isFeatureEnabled('reminder_enabled')
  if (!remindersEnabled) {
    logger.info('Reminders disabled by feature flag - skipping cron run')
    return NextResponse.json({ message: 'Reminders are disabled', processed: 0 })
  }

  const supabase = createSupabaseServiceClient()

  // Current hour in Jakarta time (matches what the client picks in the UI).
  const currentHour = Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Jakarta',
      hour: 'numeric',
      hour12: false,
    }).format(new Date())
  )

  // 1. Find all clients whose settings are enabled and reminder_hour matches current hour
  const { data: clientsToNotify, error: clientsErr } = await supabase
    .from('reminder_settings')
    .select(`
      client_id,
      reminder_channel,
      clients (
        id,
        name,
        telegram_chat_id,
        telegram_notifications_enabled
      )
    `)
    .eq('enabled', true)
    .eq('reminder_hour', currentHour)

  if (clientsErr) {
    logger.error('Failed to fetch reminder settings', { error: clientsErr })
    return NextResponse.json({ error: clientsErr.message }, { status: 500 })
  }

  if (!clientsToNotify || clientsToNotify.length === 0) {
    return NextResponse.json({ message: 'No clients configured for this hour', processed: 0 })
  }

  // Calculate "tomorrow" range (approx 24h from now)
  const tomorrowStart = new Date()
  tomorrowStart.setUTCHours(0, 0, 0, 0)
  tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1)
  
  const tomorrowEnd = new Date(tomorrowStart)
  tomorrowEnd.setUTCHours(23, 59, 59, 999)

  let sentCount = 0

  // 2. For each client, check if they have posts tomorrow
  for (const setting of clientsToNotify) {
    const client = setting.clients as unknown as { 
      id: string; name: string; telegram_chat_id: string | null; telegram_notifications_enabled: boolean 
    }
    
    if (!client) continue

    // Only Telegram supported for now
    if (setting.reminder_channel !== 'telegram' && setting.reminder_channel !== 'both') continue
    if (!client.telegram_notifications_enabled || !client.telegram_chat_id) continue

    const { data: upcomingPosts } = await supabase
      .from('scheduled_posts')
      .select('id, title, platform, scheduled_at, campaign_tag')
      .eq('client_id', client.id)
      .eq('status', 'scheduled')
      .gte('scheduled_at', tomorrowStart.toISOString())
      .lte('scheduled_at', tomorrowEnd.toISOString())

    if (upcomingPosts && upcomingPosts.length > 0) {
      // Grouping them into one message if there are multiple is ideal, 
      // but for simplicity we'll send the primary one or loop
      for (const post of upcomingPosts) {
        try {
          await notifyClientReminder({
            clientChatId: client.telegram_chat_id,
            clientId: client.id,
            clientName: client.name,
            title: post.title,
            platform: post.platform,
            scheduledAt: post.scheduled_at,
            campaignTag: post.campaign_tag ?? undefined
          }, {
            onBlocked: async (type, id) => {
              if (id) {
                await supabase.from('clients').update({ telegram_notifications_enabled: false }).eq('id', id)
              }
            }
          })
          sentCount++
        } catch (err) {
          logger.error('Failed to send reminder', { error: err, client_id: client.id })
        }
      }

      // Mark as sent
      await supabase
        .from('reminder_settings')
        .update({ last_sent_at: new Date().toISOString() })
        .eq('client_id', client.id)

      // Audit trail
      await supabase.from('audit_log').insert({
        actor_role: 'system',
        actor_name: 'Cron Scheduler',
        action: 'cron.reminders.sent',
        entity_type: 'client',
        entity_id: client.id,
        client_id: client.id,
        summary: `Sistem mengirim ${upcomingPosts.length} pengingat jadwal tayang ke ${client.name}`,
        metadata: { posts: upcomingPosts.length, hour: currentHour },
      })
    }
  }

  return NextResponse.json({
    message: 'Reminders processed',
    clientsChecked: clientsToNotify.length,
    remindersSent: sentCount
  })
}
