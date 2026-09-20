# Proposal: Operator Client Report (Analytics & Reporting)

## Why

Frhm sudah multi-client (Taraju, Pawon Sengon) dan operator (Bima) butuh **laporan bulanan yang justify fee agency** ke owner. Tapi kondisi sekarang:

1. **Halaman `/admin/analytics` mati total** — query tabel `campaigns` dan `content_metrics` yang tidak pernah dibuat di migration. Render kosong "Belum ada data campaign" tanpa error.
2. **Input metrik via `prompt()` dialog** — primitive, tidak scalable, rawan typo, tidak audit-able.
3. **Tidak ada export laporan** — operator copy-paste manual ke WhatsApp/Notion, ambil 2-3 jam per bulan.
4. **Drift naming tersembunyi** — `campaigns` vs `content_campaigns`, `sent` vs `Review`, `content_metrics` vs `post_metrics` membuat halaman analytics diam-diam gagal dan bakal bikin bug lain.

Ini bukan fitur baru — ini **memperbaiki yang sudah diklaim "100% covered" tapi broken di lapangan**.

## What Changes

- **Inline metrics editor** di `AnalyticsBoard` — klik cell → edit number → auto-save (ganti `prompt()`).
- **CSV / Google Sheet paste import** untuk `post_metrics` (reach, likes, comments, shares, saves, clicks) — native SIGNAL metrics, no fabrication.
- **Structured AI Insight generator** — prompt template: "Bandungkan campaign X vs Y, sebutkan 3 actionable finding untuk owner" → output ke `analytics_summaries`.
- **Export Client Report** — PDF + Markdown "Laporan Bulanan [Client] [Bulan]" siap kirim.
- **Drift fix migration** — rename/align tabel & kolom: `content_campaigns` canonical, `post_metrics` canonical, status vocabulary konsisten (`sent` = "Terkirim ke Client", `Review` dihapus dari UI).
- **Per-client briefing widget** di admin dashboard — ringkasan performa mingguan per brand (extend existing "Jadwal Tayang Hari Ini" card).

**BREAKING**: Migration menambahkan kolom/indeks baru, memperbaiki nama tabel di kode yang merujuk tabel lama (analytics page, API routes). Perlu regenerasi `database.types.ts`.

## Capabilities

### New Capabilities
- `analytics/client-report`: Client-facing monthly report generation (metrics input, AI insight, PDF/MD export, scheduled briefing widget). Covers the "justify fee" loop for agency operator.

### Modified Capabilities
- `content/trend-engine`: Requirement "Auto Deliverable Creation with Telegram Notification" → extend scenario: deliverable creation juga menambahkan `campaign_tag` default dari trend source, supaya analytics punya konteks campaign sejak awal.
- `notifications/telegram`: Requirement "Scheduled Content Publishing Status Alert" → extend: tambah notifikasi "Publish gagal + metrik 0" agar operator tahu slot hangus & metrik kosong.

## Impact

**Code:**
- `app/components/analytics/analytics-board.tsx` — major rewrite: inline editor, import dialog, export buttons, structured AI prompt.
- `app/app/admin/analytics/page.tsx` — rewrite: ganti query ke `content_campaigns` + `post_metrics`, tampilkan per-campaign performance real.
- `app/app/admin/dashboard/page.tsx` — tambah briefing widget per client.
- `app/api/admin/clients/[id]/analytics/*` — harden validation, support CSV import, struktur AI prompt.
- `app/lib/supabase/database.types.ts` — **regenerate** after migration.
- Migration baru: `028_analytics_drift_fix.sql` + `029_client_report_export.sql` (atau digabung).

**Data:**
- `content_campaigns` (canonical), `post_metrics` (canonical), `analytics_summaries` (existing).
- `scheduled_posts.campaign_tag` → FK/referensi ke `content_campaigns.name`.
- `deliverables` → tambah `campaign_tag` nullable (untuk traceability trend→campaign).

**Dependencies:**
- WoopSocial bridge unchanged.
- Telegram service unchanged (existing notification types cover new alerts).
- Skill repo `analytics-and-reporting` (METER framework) jadi referensi UX, bukan kode.

**Risk:**
- Migration pada tabel production — butuh backup + test di staging dulu.
- Regenerasi types TypeScript — pastikan semua import `database.types.ts` kompilasi bersih.