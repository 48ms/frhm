/**
 * Normalizes AI errors (rate limits, timeouts, quotas) into user-friendly Indonesian messages.
 */
export function formatAiErrorMessage(
  err: unknown,
  defaultMessage = "Terjadi kesalahan saat memproses permintaan AI"
): string {
  const msg = err instanceof Error ? err.message : err ? String(err) : ""
  const lower = msg.toLowerCase()
  if (lower.includes("429") || lower.includes("rate limit") || lower.includes("quota")) {
    return "Batas kuota request AI tercapai (Rate Limit 429). Silakan tunggu beberapa saat atau gunakan template preset manual."
  }
  if (lower.includes("abort") || lower.includes("timeout") || lower.includes("timed out") || lower.includes("econnreset")) {
    return "Koneksi AI mengalami batas waktu (timeout). Silakan periksa jaringan dan coba beberapa saat lagi."
  }
  return msg || defaultMessage
}
