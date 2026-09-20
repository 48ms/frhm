## Why

Klien dan pemilik brand (seperti Taraju dan Pawon Sengon) selalu menginginkan ide konten yang terbukti berpotensi viral dan relevan dengan tren media sosial terkini. Namun, proses ideasi manual memakan banyak waktu dan sering kali terjebak pada tren yang tidak aman atau tidak sesuai dengan karakter brand.

Autonomous Trend Engine mengotomatiskan penemuan tren real-time (melalui radar Google Trends Indonesia dan inspirasi tren TikTok), menyaring kelayakannya menggunakan kerangka validasi The Three Gates (Fit, Safety, Timing), menghasilkan 3 variasi hook psikologis (Contrarian, Story, Direct Value), dan menyimpannya langsung sebagai deliverable yang siap direview dengan notifikasi Telegram instan.

## What Changes

- **Live Trend Radar Service**: Layanan pengambil tren real-time dari Google Trends RSS wilayah Indonesia (`geo=ID`) dan kurasi topik viral industri F&B, kopi, dan gaya hidup.
- **Manual FYP Trend-Jack Input**: Bar input instan pada workspace klien bagi admin untuk menempelkan link atau nama tren dari media sosial guna langsung direkayasa balik (*reverse-engineered*) menjadi konten brand.
- **The Three Gates Validator**: Modul penghitung skor kelayakan ide (Fit Score, Safety Score, Timing Score) dengan batas minimal skor untuk mencegah blunder reputasi.
- **Multi-Hook Variant Generator**: Setiap konten yang di-generate otomatis dilengkapi dengan 3 variasi hook pembuka di 3 detik pertama (Contrarian / Penasaran, Story / Behind The Scenes, Direct Value / Solusi) agar klien memiliki pilihan terbaik.
- **Auto-Deliverable & Telegram Notification Hand-off**: Begitu pipeline tren selesai, sistem otomatis membuat deliverable berstatus `sent` dan mengirimkan link review langsung ke Telegram bot Frhm (@frhm28_bot).

## Capabilities

### New Capabilities
- `content/trend-engine`: Mesin deteksi tren harian otomatis, input trend-jacking cepat, evaluasi The Three Gates, generator 3 variasi hook, dan konversi otomatis menjadi materi deliverable siap review.

### Modified Capabilities
*(None)*

## Impact

- **Database**: Penambahan tabel `trend_radar_items` untuk menyimpan cache topik tren yang dipindai, serta penambahan kolom `hooks` (JSONB) pada tabel `deliverables` untuk menyimpan 3 opsi hook.
- **API Routes**: Penambahan route `/api/trends/radar` untuk memindai tren harian dan `/api/trends/generate` untuk mengeksekusi pipeline pembuatan konten tren.
- **UI Components**: Penambahan widget Radar Tren dan input Trend-Jack instan pada halaman workspace klien (`app/app/admin/clients/[id]/workspace.tsx`).
- **Dependencies**: Menggunakan XML parser ringan (misal `fast-xml-parser`) untuk membaca Google Trends RSS.
