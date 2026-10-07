# Analytics Schema & Dashboard Data

## Arsitektur Data
- **Factual Analytics**: Tabel `post_metrics` dan `analytics_summaries` menyimpan data riil hasil sinkronisasi API Ayrshare.
- **Dashboard UI**: Komponen dashboard (KPI, Chart, Hero) saat ini mengonsumsi tabel fiktif `dashboard_profiles`.
- **Status Migration**: Tabel `dashboard_profiles` belum dibuat (TBD). Dashboard saat ini menampilkan data fallback (rekaan) yang didefinisikan di `dashboard-data.ts`.

## Sinkronisasi Cron
- `app/api/cron/sync-analytics/route.ts` bertugas menulis ke `dashboard_profiles`.
- Karena tabel belum ada, cron ini gagal total (log terstruktur ke `logger.error`).

## Rencana Perbaikan (Migration 053)
Dibuat migrasi `053_dashboard_profiles.sql` (schema: id, client_id, greeting, velocity, peak_label, peak_value, charts [JSONB], insights [JSONB], metrics [JSONB]).
RLS: `Admin` (FULL), `Client` (SELECT only).
Index: `client_id` (B-tree).
