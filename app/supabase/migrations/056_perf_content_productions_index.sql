-- 056_perf_content_productions_index.sql
--
-- PERF GAP (audit dashboard 2026-10-11):
-- Tabel `content_productions` (dibuat di 022_content_production.sql) TIDAK
-- memiliki index pada kolom `client_id`, padahal:
--   1. Dashboard mem-prefetch `contentProductionQueries.listByClient(clientId)`
--      pada SETIAP page-load (lihat dashboard-prefetcher.tsx).
--   2. Service selalu memfilter `.eq("client_id", clientId)`.
--
-- Tanpa index, PostgreSQL melakukan sequential scan pada seluruh tabel untuk
-- setiap query dashboard — ini memburuk linear seiring bertambahnya data
-- (multi-tenant). Index ini mengubahnya menjadi index scan O(log n).
--
-- Idempotent: aman dijalankan berulang.

CREATE INDEX IF NOT EXISTS idx_content_productions_client_id
  ON public.content_productions (client_id);

-- Composite untuk urutan default service (order by due_date asc) — lihat
-- getContentProductions() di features/content-production/api/service.ts.
CREATE INDEX IF NOT EXISTS idx_content_productions_client_due
  ON public.content_productions (client_id, due_date ASC);
