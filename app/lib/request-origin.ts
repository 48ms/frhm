/**
 * Safely resolves the public origin of an incoming HTTP request.
 * Prevents internal loopback host (e.g. localhost:3000 behind reverse proxy)
 * from leaking into browser redirect Location headers.
 */
export function getRequestOrigin(request: Request): string {
  const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host')
  const forwardedProto =
    request.headers.get('x-forwarded-proto') ||
    (forwardedHost && !forwardedHost.includes('localhost') && !forwardedHost.includes('127.0.0.1')
      ? 'https'
      : 'http')

  if (forwardedHost && !forwardedHost.startsWith('localhost') && !forwardedHost.startsWith('127.0.0.1')) {
    return `${forwardedProto}://${forwardedHost}`
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl && !appUrl.includes('localhost') && !appUrl.includes('127.0.0.1')) {
    return appUrl.replace(/\/+$/, '')
  }

  try {
    const parsed = new URL(request.url)
    return parsed.origin
  } catch {
    return 'http://localhost:3000'
  }
}
