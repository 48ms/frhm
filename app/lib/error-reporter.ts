/**
 * Error reporter: sends formatted error details to Telegram + audit_log.
 *
 * Used by:
 * - `app/api/errors/report/route.ts` (client-side error boundaries call this)
 * - API routes that catch errors (direct call)
 *
 * Always awaits logAudit for forensic trail.
 * Telegram delivery is fire-and-forget but non-blocking when chatId exists.
 */

import { sendTelegramMessage } from '@/lib/telegram/service'
import { logger } from '@/lib/logger'
import { logAudit } from '@/lib/audit/log'

interface ErrorReport {
  /** Error message */
  message: string
  /** Error name (TypeError, RangeError, etc.) */
  name?: string
  /** Full stack trace */
  stack?: string
  /** Next.js error digest (for deduplication in production) */
  digest?: string
  /** URL where the error occurred */
  url?: string
  /** Component or route that caught the error */
  component?: string
  /** Additional context */
  context?: Record<string, unknown>
}

/** In-memory dedup window: same digest reported within this window is skipped. */
const reportedDigests = new Map<string, number>()
const DEDUP_WINDOW_MS = 60_000 // 1 minute

function shouldReport(digest: string | undefined): boolean {
  if (!digest) return true // no digest = always report
  const now = Date.now()
  const last = reportedDigests.get(digest)
  if (last && now - last < DEDUP_WINDOW_MS) return false
  reportedDigests.set(digest, now)
  if (reportedDigests.size > 1000) {
    for (const [key, ts] of reportedDigests) {
      if (now - ts > DEDUP_WINDOW_MS * 2) reportedDigests.delete(key)
    }
  }
  return true
}

/** Escape HTML special chars for Telegram HTML parse mode. */
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function formatTelegramMessage(report: ErrorReport): string {
  const lines = [
    '🚨 <b>ERROR REPORT</b>',
    '━━━━━━━━━━━━━━━━━',
  ]

  if (report.url) {
    lines.push(`📍 <b>URL:</b> <code>${esc(report.url)}</code>`)
  }
  if (report.component) {
    lines.push(`🔧 <b>Component:</b> <code>${esc(report.component)}</code>`)
  }
  lines.push(`🕐 <b>Time:</b> ${new Date().toISOString()}`)
  lines.push(`📝 <b>${esc(report.name || 'Error')}:</b>`)
  lines.push(`<pre>${esc(report.message.slice(0, 500))}</pre>`)

  if (report.digest) {
    lines.push(`🔗 <b>Digest:</b> <code>${esc(report.digest)}</code>`)
  }

  if (report.stack) {
    const stackLines = report.stack.split('\n')
    const frames = stackLines.slice(1, 4)
    lines.push('📋 <b>Stack:</b>')
    lines.push(`<pre>${esc(frames.join('\n'))}</pre>`)
    if (stackLines.length > 4) {
      lines.push(`<i>... ${stackLines.length - 4} more frames</i>`)
    }
  }

  if (report.context && Object.keys(report.context).length > 0) {
    lines.push('📎 <b>Context:</b>')
    lines.push(`<pre>${esc(JSON.stringify(report.context, null, 2).slice(0, 500))}</pre>`)
  }

  const out = lines.join('\n')
  return out.length > 4000 ? out.slice(0, 3990) + '\n…(truncated)' : out
}

/**
 * Report an error to audit_log + Telegram.
 * - audit_log: ALWAYS written (awaited, forensic trail)
 * - Telegram: delivered if chatId configured
 */
export async function reportError(report: ErrorReport): Promise<void> {
  // 1. Dedup check (same digest = skip to avoid duplicates)
  if (!shouldReport(report.digest)) return

  // 2. Structured log (always works)
  const errObj = new Error(report.message)
  errObj.name = report.name || 'Error'
  if (report.stack) errObj.stack = report.stack
  logger.error(`[error-reporter] ${report.message}`, {
    route: report.url,
    userId: typeof report.context?.userId === 'string' ? report.context.userId : undefined,
    error: errObj,
  })

  // 3. Forensic audit trail — always await (audit must land before response)
  await logAudit({
    actorId: typeof report.context?.userId === 'string' ? report.context.userId : null,
    actorRole: 'system',
    actorName: 'Error Reporter',
    action: 'system.error',
    entityType: 'error',
    entityId: null,
    summary: `[${report.component || 'unknown'}] ${report.message}`.slice(0, 500),
    metadata: {
      digest: report.digest,
      name: report.name,
      url: report.url,
      stack: report.stack?.split('\n').slice(0, 5).join('\n'),
      context: report.context,
    },
  })

  // 4. Telegram notification (fire-and-forget, never blocks response)
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (!chatId) return

  try {
    await sendTelegramMessage({
      chatId,
      text: formatTelegramMessage(report),
      parseMode: 'HTML',
      eventType: 'error_report',
      recipientType: 'admin',
    })
  } catch (err) {
    logger.error('[error-reporter] Telegram notification failed', { error: err })
  }
}