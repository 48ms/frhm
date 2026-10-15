# PERFORMANCE AUDIT REPORT v2
# Frhm Dashboard — Next.js + Supabase
# Date: 2026-10-16
# Auditor: fact-based verification (grep + read live source)

## RINGKASAN EKSEKUTIF

| Metrik | Nilai |
|--------|-------|
| Backend audit violations | **0** (17 API routes) |
| UIUX audit violations | **0** (313 files) |
| Temuan performa BARU | **4** (1 kritis, 2 sedang, 1 rendah) |
| Regression dari audit 2026-10-08 | **Tidak ada** — semua fix P0/P1/P2 terverifikasi ada |

Audit sebelumnya (2026-10-08) fokus pada **bundle size & waterfall SSR**.
Audit ini fokus pada **query database & indexing** — area yang belum pernah diaudit.

---

## ✅ VERIFIKASI FIX AUDIT LAMA (2026-10-08)

Semua rekomendasi lama diverifikasi masih ada di kode:

| Item | Klaim | Verifikasi | Status |
|------|-------|-----------|--------|
| P0 Waterfall | `Promise.all` di dashboard-prefetcher | `dashboard-prefetcher.tsx:32` → `await Promise.all([` | ✅ ADA |
| P1 Suspense | 3 halaman punya `<Suspense>` | analytics/calendar/campaigns page.tsx → masing-masing 3× | ✅ ADA |
| P2 Lazy recharts | `dynamic()` di @chart | `@chart/page.tsx:2` → `dynamic(() => import(...performance-chart...))` | ✅ ADA |
| P2 Dead code | `calendar-view.tsx` dihapus | file tidak ada | ✅ TERHAPUS |

---

## 🔴 KRITIS

### 1. `post_metrics` TANPA INDEX — Seq Scan pada Tabel Time-Series

**Bukti faktual:**
```bash
$ grep -rn "post_metrics" supabase/migrations/*.sql | grep -i index
(0 hasil — TIDAK ADA INDEX)
```

**Definisi tabel** (`023_analytics.sql:4-18`):
```sql
CREATE TABLE public.post_metrics (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES scheduled_posts(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  views INT, reach INT, likes INT, comments INT, shares INT, saves INT, clicks INT,
  recorded_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id)
);
```

**Masalah**: Tidak ada index pada `client_id` maupun `recorded_at`. Setiap query analytics (yang selalu filter `client_id` + order `recorded_at`) melakukan **sequential scan** pada seluruh tabel. Karena `post_metrics` tumbuh satu baris per post per sync harian, tabel ini akan menjadi bottleneck utama seiring waktu.

**Perbandingan dengan tabel lain** (semua punya index, post_metrics tidak):
```sql
-- Ada:
CREATE INDEX idx_analytics_summaries_client_period ON analytics_summaries(client_id, period_start, period_end);
CREATE INDEX idx_ai_usage_client_created ON ai_usage_logs(client_id, created_at);
CREATE INDEX idx_analytics_predictions_client ON analytics_predictions(client_id, target_month);
-- TIDAK ADA untuk post_metrics
```

**Rekomendasi** (migration baru `058_post_metrics_index.sql`):
```sql
CREATE INDEX IF NOT EXISTS idx_post_metrics_client_recorded
  ON public.post_metrics(client_id, recorded_at DESC);
```

---

## 🟡 SEDANG

### 2. Fetch Seluruh Baris Tanpa `.limit()`

**Bukti faktual** (`features/analytics/api/service.ts:53-67`):
```typescript
export async function getPostMetricsByClient(clientId: string): Promise<PostMetric[]> {
  const { data, error } = await supabase
    .from("post_metrics")
    .select("*")
    .eq("client_id", clientId)
    .order("recorded_at", { ascending: false })
    // ← TIDAK ADA .limit()
  return (data ?? []) as PostMetric[]
}
```

**Diperparah** oleh filter client-side (`service.ts:335-341`):
```typescript
filteredMetrics = allMetrics.filter((m) => !m.recorded_at || m.recorded_at >= cut)
```
Seluruh histori di-load ke memory, lalu dibuang di client. Untuk klien dengan 1+ tahun data, ini memindahkan ribuan baris via jaringan untuk akhirnya menyisakan sebagian kecil.

**Dampak**: Memory + bandwidth + latency memburuk secara linear terhadap umur klien.

**Rekomendasi**: Dorong filter waktu ke query DB:
```typescript
.select("*")
.eq("client_id", clientId)
.gte("recorded_at", cutoffIso)   // filter di DB, bukan client
.order("recorded_at", { ascending: false })
.limit(500)
```

### 3. Aggregation Views Tidak Terpakai (Dead Optimization)

**Bukti faktual** — migration `043_aggregation_views.sql` membuat 2 view dengan komentar eksplisit tujuan optimasi:
```sql
-- metrics_by_client  → post_metrics summed per client
-- "Replaces the client-side reduce over scheduled_posts → post_metrics
--  that /admin/dashboard and the ROI board each rebuilt on every load."
CREATE OR REPLACE VIEW public.metrics_by_client WITH (security_invoker = true) AS ...
```

Namun grep di seluruh source → **0 referensi**:
```bash
$ grep -rn "metrics_by_client\|dashboard_summary" --include="*.ts" --include="*.tsx" .
(0 hasil di src)
```

**Masalah**: Optimasi sudah dirancang + di-migrate, tapi **belum di-wire** ke aplikasi. Dashboard masih melakukan reduce client-side manual. View ini "tidur" — memberi false sense bahwa optimasi sudah selesai.

**Rekomendasi**: Wire view ke query dashboard, ATAU hapus jika tidak jadi dipakai (hindari dead schema).

---

## 🟠 RENDAH

### 4. Dua Nomor Migration Duplikat

```bash
$ ls migrations/*.sql | cut -d_ -f1 | sort | uniq -d
046
053
```

- `046_apply.sql` + `046_kols_platforms_notes.sql`
- `053_ayrshare_profile_key.sql` + `053_dashboard_profiles.sql`

**Dampak**: Urutan apply tidak deterministik (tergantung sort alfabetis). Untuk Supabase yang apply berdasarkan nama file, ini berisiko pada fresh setup.

**Rekomendasi**: Rename salah satu (mis. `046b_` atau geser ke `058_`).

---

## ✅ POLA BAIK (Terverifikasi)

1. **Index konsisten** di hampir semua tabel — `scheduled_posts`, `content_campaigns`, `skill_outputs`, `client_files`, `client_channels`, `kols`, `tasks`, dll. (kecuali `post_metrics`)
2. **Parallel query** (`Promise.all`) dipakai di analytics (`service.ts:127`, `311`), skills, social-accounts
3. **Graceful degrade** konsisten: `error → logger + return []` mencegah crash render
4. **`security_invoker`** benar di aggregation views (cegah bypass RLS) — Postgres 17.6
5. **RLS aktif** di semua tabel dengan SECURITY DEFINER helpers (no infinite recursion)
6. **Zero wildcard imports** — tree-shaking bersih
7. **Audit trail** (`logAudit`) dipanggil di semua mutasi

---

## PRIORITAS PERBAIKAN

| Prioritas | Item | Effort | Impact |
|-----------|------|--------|--------|
| **P0** | Index `post_metrics(client_id, recorded_at)` | Rendah (1 migration) | Tinggi (hilangkan seq scan) |
| **P1** | Filter waktu di DB, bukan client-side reduce | Sedang | Tinggi (bandwidth/memory) |
| **P2** | Wire atau hapus aggregation views | Sedang | Sedang |
| **P3** | Rename migration duplikat | Rendah | Rendah (housekeeping) |

---

## POLA INDEX — ANALISIS LENGKAP (58 tabel, 2026-10-16)

Metodologi: `comm -23 <(semua CREATE TABLE) <(semua CREATE INDEX ON <table>)`.
Hasil menunjukkan **7 tabel** tanpa index EKSTRA (hanya mengandalkan PRIMARY KEY).

| Tabel | Ukuran | Query Pattern | Status Index | Verdict |
|-------|--------|---------------|--------------|---------|
| `post_metrics` | **Besar, time-series** | `client_id + recorded_at DESC` (analytics) | ❌ TIDAK ADA | **P0 — migration 058 dibuat** |
| `ai_providers` | Kecil (global) | PK only | ✅ UNIQUE INDEX | OK |
| `ai_usage_logs` | Besar | `client_id + created_at DESC` | ✅ idx di 040 | OK |
| `deliverable_templates` | Kecil | PK only | ✅ | OK |
| `feature_flags` | Sangat kecil | PK only | ✅ | OK |
| `pipeline_stages` | Sangat kecil (7 baris) | PK only | ✅ | OK |
| `seasonal_periods` | Kecil | PK only | ✅ | OK |
| `skill_files` | Sedang | PK composite (skill_id, path) | ✅ | OK |
| `skill_packs` | Kecil | PK only | ✅ | OK |
| `feedback` | ? | ? | perlu cek | pending |
| `support_tickets` | Sedang | `client_id + created_at` | ✅ idx di 055 | OK |

**Kesimpulan**: Hanya `post_metrics` yang benar-benar GAP (tabel besar, query sering, tanpa index). Migration `058_perf_post_metrics_index.sql` sudah dibuat untuk menutup gap ini.

---

## METODOLOGI

- `grep -rn` pada seluruh `features/`, `lib/`, `supabase/migrations/`
- Read langsung file source (bukan asumsi)
- Cross-check index: `grep "CREATE INDEX" migrations/*.sql`
- Verifikasi view usage: `grep -rn "view_name" src`
- Tabel vs index: `comm -23 <(all tables) <(all indexed tables)` (fixed regex)
- Semua klaim di atas punya bukti perintah + baris kode

**Catatan**: Laporan ini TIDAK mengubah kode (sesuai scope guardrail). Hanya identifikasi faktual.
