# Proposal

## Why

Setelah fondasi navigasi dan struktur halaman berhasil diamankan pada Revamp UI Fase 1, Fase 2 berfokus pada **interaksi mikro dan visualisasi data**. Komponen inti seperti Kalender Produksi, Tabel Analitik, dan Trend Engine saat ini sudah berfungsi secara backend (Fase 3B di PROGRESS.md), namun secara antarmuka masih kaku. Menerapkan standar `animate-ui` dan `framer-motion` ke area ini akan memberikan nuansa "Enterprise" yang taktil dan hidup.

## What Changes

- **Kalender Interaktif (`/admin/calendar`)**: Menerapkan kapabilitas *drag-and-drop* yang mulus (berbasis *spring physics*) agar Admin dapat memindahkan jadwal tayang dengan mudah.
- **Polesan Tabel Analitik**: Meng-upgrade `analytics-board.tsx` agar menggunakan komponen Grid/Tabel interaktif dengan *hover states* presisi.
- **Halaman Trend Engine**: Merombak antarmuka pencarian tren menjadi *masonry layout* bergaya premium agar inspirasi konten lebih mudah dipindai secara visual.

## Capabilities

### New Capabilities
- `management/interactive-calendar`: Pengaturan ulang jadwal produksi melalui antarmuka *drag-and-drop*.

### Modified Capabilities
- (None)

## Impact

- **UI Components**: Perombakan signifikan pada rute kalender, komponen `analytics-board.tsx`, dan halaman Trend Engine. Penambahan pustaka `framer-motion` untuk *drag-and-drop* jika belum digunakan secara ekstensif.
- **Backend**: Nol dampak. Struktur data Supabase dan cron job `/api/cron/publish` tetap dipertahankan persis seperti aslinya.
