# Proposal

## Why

Pengelolaan media sosial untuk klien (seperti Taraju dan Pawon Sengon) saat ini berjalan secara *silo*, menyebabkan kebocoran alur kerja, kurangnya keselarasan strategis, dan tersebarnya aset. Kita perlu mentransformasi Frhm menjadi platform kelas agensi (*Enterprise-Grade*) yang mendigitalkan praktik terbaik dari spesialis media sosial. Fase 1 ini berfokus pada penyelesaian kekacauan di dapur produksi internal dengan mengunci strategi konten, merevolusi pengelolaan aset (Parent-Child), dan menstandarisasi *creative brief*.

## What Changes

- **Pillar & Funnel Enforcement**: Memaksa pemilihan *Content Pillar* (Edukasi, Promo, dll.) dan tahapan *Funnel* saat pembuatan ide konten baru.
- **Parent-Child Asset System**: Mengubah pola "1 Kartu = 1 Postingan" menjadi "1 Hero Asset = Multi-Platform Child Assets".
- **Structured Briefing Forms**: Mengganti kotak teks kosong dengan form *input* terstruktur (Visual Hook, Body, CTA) sesuai rekomendasi *best practices*.

## Capabilities

### New Capabilities
- `social/content-planning`: Kemampuan sistem untuk menetapkan, membatasi, dan melacak distribusi *Content Pillars* dan *Funnel Stages* pada setiap kampanye.
- `social/asset-engine`: Kemampuan sistem untuk memecah (*repurpose*) satu *Hero Asset* video/gambar menjadi beberapa *Child Tasks* untuk lintas platform secara terhubung.
- `social/structured-brief`: Kemampuan sistem untuk menerapkan dan memvalidasi struktur draf konten spesifik (termasuk peringatan platform seperti LinkedIn *link penalties*).

### Modified Capabilities
- (Tidak ada)

## Impact

- **UI Components**: Penambahan halaman form pembuatan konten baru, dashboard alokasi pilar, dan tampilan Kanban *Parent-Child*.
- **Database**: Skema baru di Supabase untuk `campaigns`, `content_assets` (Hero), dan `platform_posts` (Child).
- **Workflow**: Tim tidak bisa lagi membuat konten tanpa pilar strategis atau hook visual yang jelas.
