/**
 * Core application logger.
 * In production/Vercel Edge, structured JSON logs are critical for Datadog/Axiom/Vercel Logs integration.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

interface LogContext {
  [key: string]: unknown
  error?: Error | unknown
  requestId?: string
  userId?: string
  route?: string
}

// Ensure error objects serialize properly to JSON
function serializeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return {
      message: err.message,
      name: err.name,
      stack: err.stack,
    }
  }
  return { message: String(err) }
}

class Logger {
  private level: number

  private levels: Record<LogLevel, number> = {
    debug: 10,
    info: 20,
    warn: 30,
    error: 40,
    fatal: 50,
  }

  constructor() {
    const envLevel = (process.env.LOG_LEVEL || 'info').toLowerCase()
    this.level = this.levels[envLevel as LogLevel] || 20
  }

  private write(level: LogLevel, msg: string, context?: LogContext) {
    if (this.levels[level] < this.level) return

    const entry: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      level,
      msg,
      ...context,
    }

    if (context?.error) {
      entry.error = serializeError(context.error)
    }

    // In local development, format it nicely. In production, write raw JSON.
    if (process.env.NODE_ENV === 'development') {
      const { timestamp, level, msg, error, ...ctx } = entry
      const ctxStr = Object.keys(ctx).length ? `\n    ${JSON.stringify(ctx)}` : ''
      const errStr = error ? `\n    ${(error as Error).stack || (error as Error).message}` : ''
      
      const out = `[${timestamp}] ${(level as string).toUpperCase()}: ${msg}${ctxStr}${errStr}`
      if (level === 'error' || level === 'fatal') console.error(out)
      else if (level === 'warn') console.warn(out)
      else if (level === 'debug') console.debug(out)
      else console.log(out)
    } else {
      // Vercel/Datadog expects JSON strings
      const out = JSON.stringify(entry)
      if (level === 'error' || level === 'fatal') console.error(out)
      else if (level === 'warn') console.warn(out)
      else if (level === 'debug') console.debug(out)
      else console.log(out)
    }
  }

  debug(msg: string, context?: LogContext) { this.write('debug', msg, context) }
  info(msg: string, context?: LogContext) { this.write('info', msg, context) }
  warn(msg: string, context?: LogContext) { this.write('warn', msg, context) }
  error(msg: string, context?: LogContext) { this.write('error', msg, context) }
  fatal(msg: string, context?: LogContext) { this.write('fatal', msg, context) }
}

export const logger = new Logger()
