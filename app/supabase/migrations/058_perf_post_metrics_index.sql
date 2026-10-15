-- 058_perf_post_metrics_index.sql
--
-- PERF GAP (audit performa v2, 2026-10-16):
-- Tabel `post_metrics` (dibuat di 023_analytics.sql) TIDAK memiliki index
-- pada kolom `client_id` maupun `recorded_at`, padahal:
--
--   1. Setiap query analytics memfilter `.eq("client_id", clientId)` dan
--      mengurutkan `.order("recorded_at", { ascending: false })` — lihat
--      getPostMetricsByClient() di features/analytics/api/service.ts:56.
--   2. View `metrics_by_client` (043_aggregation_views.sql) meng-GROUP BY
--      pm.client_id dan memakai max(pm.recorded_at) pada tabel ini.
--
-- Tanpa index, PostgreSQL melakukan SEQUENTIAL SCAN pada seluruh tabel untuk
-- setiap query. `post_metrics` adalah tabel time-series yang bertambah satu
-- baris per post per sinkronisasi harian, sehingga biaya scan tumbuh linear
-- terhadap umur klien — ini bottleneck yang memburuk seiring waktu.
--
-- Index komposit ini melayani dua pola sekaligus:
--   * filter + sort  → WHERE client_id = ? ORDER BY recorded_at DESC  (index scan O(log n))
--   * agregasi       → GROUP BY client_id, max(recorded_at)           (index-only scan)
--
-- Konvensi mengikuti 040_ai_usage_logs.sql (idx_ai_usage_client_created)
-- dan 056_perf_content_productions_index.sql.
--
-- Idempotent: aman dijalankan berulang.

CREATE INDEX IF NOT EXISTS idx_post_metrics_client_recorded
  ON public.post_metrics (client_id, recorded_at DESC);

-- Index tambahan untuk kueri lintas-klien (mis. laporan admin) yang mengurutkan
-- seluruh tabel berdasarkan waktu tanpa filter client_id.
CREATE INDEX IF NOT EXISTS idx_post_metrics_recorded
  ON public.post_metrics (recorded_at DESC);
