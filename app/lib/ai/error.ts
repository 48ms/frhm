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
  if (
    lower.includes("401") ||
    lower.includes("unauthorized") ||
    lower.includes("api key required") ||
    lower.includes("invalid api key") ||
    lower.includes("incorrect api key") ||
    lower.includes("api key not valid") ||
    lower.includes("invalid_api_key")
  ) {
    return "Kunci API provider ditolak (401). Buka Pengaturan → AI Provider, lalu perbarui kunci — kemungkinan kunci sudah dirotasi atau dicabut."
  }
  if (lower.includes("403") || lower.includes("forbidden") || lower.includes("permission denied")) {
    return "Akses ke provider AI ditolak (403). Periksa izin kunci API dan apakah model tersebut tersedia untuk akun Anda."
  }
  if (
    lower.includes("404") ||
    lower.includes("not found") ||
    lower.includes("model_not_found") ||
    lower.includes("no such model")
  ) {
    return "Model atau endpoint AI tidak ditemukan (404). Periksa Model Identifier dan Base URL di Pengaturan → AI Provider."
  }
  if (lower.includes("abort") || lower.includes("timeout") || lower.includes("timed out") || lower.includes("econnreset")) {
    return "Koneksi AI mengalami batas waktu (timeout). Silakan periksa jaringan dan coba beberapa saat lagi."
  }
  return msg || defaultMessage
}
