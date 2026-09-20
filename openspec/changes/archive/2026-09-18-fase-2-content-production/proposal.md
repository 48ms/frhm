# Proposal

## Why

Sistem yang ada saat ini sudah memiliki pondasi UI/UX dan navigasi yang baik, namun belum memiliki fitur khusus untuk menangani kerumitan produksi konten dan operasional agensi. Masalah utama yang sering muncul adalah keruwetan dalam *tracking* konten, manajemen jadwal, dan pemantauan vendor/KOL. Fase 2 ini diperlukan untuk membuat Frhm menjadi pusat operasional (CRM & Production) yang komprehensif, sehingga semua kebutuhan agensi marketing dari ide konten hingga kolaborasi KOL dapat dikelola dalam satu sistem tanpa harus berpindah-pindah aplikasi eksternal.

## What Changes

- Menambahkan *Today's Action Center* untuk memberikan visibilitas spesifik "Tugas Saya Hari Ini" berdasarkan *role*.
- Membuat kalender konten berlapis (*Omni-Channel Calendar*) yang dapat mem-filter jadwal berdasarkan Campaign, Instagram, atau TikTok.
- Membangun *Production State-Machine* (Kanban Board khusus dapur produksi internal) dari fase Ide -> Script -> Shoot -> Edit, termasuk fitur "Fast-Track" untuk konten *urgent*.
- Mengimplementasikan fitur *KOL & Vendor CRM* untuk manajemen kontak *rate card*, spesialisasi (niche), dan riwayat kolaborasi.
- Membuat *Brand Asset Hub* per klien untuk menyimpan semua aset brand (Logo, Palet Warna, Font, dan *Raw Footage*).

## Capabilities

### New Capabilities
- `content-production/action-center`: Menampilkan tugas-tugas personal harian yang disesuaikan dengan *role* pengguna (editor, copywriter, dll).
- `content-production/omni-calendar`: Menampilkan kalender publikasi dan produksi yang mendukung filter multi-layer (Campaign, Platform).
- `content-production/state-machine`: Sistem manajemen Kanban yang melacak fase produksi sebuah konten dengan dukungan status *urgent*.
- `crm/kol-vendor`: Sistem buku alamat pintar dan CRM khusus untuk mendata vendor, *rate card*, dan KOL.
- `client/brand-asset-hub`: Modul penyimpanan file dan aset branding (logo, warna, dokumen) pada halaman profil klien.

### Modified Capabilities
- Tidak ada requirement yang diubah dari kapabilitas yang sudah ada; fase ini murni menambahkan fitur baru.

## Impact

- **Database:** Diperlukan penyesuaian skema tabel pada Supabase (pembuatan tabel `tasks`, `kols`, `brand_assets`, dan `content_items`).
- **Komponen UI:** Membutuhkan pembuatan komponen kalender yang dinamis (kemungkinan menggunakan `react-big-calendar` atau komponen shadcn bawaan jika di-extend) dan *Kanban board* (menggunakan library dnd).
- **Storage:** Kebutuhan *bucket storage* di Supabase untuk menyimpan aset klien (logo, file mentah).
- **Rute:** Penambahan rute baru di bawah `/admin/production`, `/admin/crm/kol`, dan *tab* tambahan di detail klien.
