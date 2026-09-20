## 1. Trend Radar & RSS Parser

- [x] 1.1 Buat modul parser Google Trends RSS `lib/trends/radar.ts` untuk mengambil tren harian Indonesia (`geo=ID`), memfilter kata kunci F&B/Lifestyle, dan memverifikasi output data berupa array tren terstruktur.
- [x] 1.2 Buat endpoint API `/api/trends/radar` untuk melayani pembacaan tren harian dengan sistem caching in-memory/JSON agar hemat bandwidth.

## 2. The Three Gates Validator & Multi-Hook Generator

- [x] 2.1 Buat modul validasi `lib/trends/validator.ts` yang mengevaluasi tren terhadap `brand-profile.md` klien (Fit, Safety, Timing score 0-100) dan menentukan status keputusan (Approved / Rejected).
- [x] 2.2 Buat modul generator konten `lib/trends/generator.ts` yang menghasilkan 3 opsi hook (Contrarian, Story, Direct Value) beserta naskah konten lengkap yang mematuhi `voice.md`.
- [x] 2.3 Buat endpoint API `/api/trends/generate` yang mengorkestrasikan validasi The Three Gates, pembuatan konten, penyimpanan ke tabel `deliverables`, dan pengiriman notifikasi Telegram.

## 3. UI Components & Client Workspace Integration

- [x] 3.1 Buat komponen UI `components/trends/trend-radar-board.tsx` yang menampilkan kartu tren hari ini dengan skor kelayakan dan tombol 1-klik "Jadikan Konten".
- [x] 3.2 Buat komponen UI `components/trends/trend-jack-bar.tsx` untuk input cepat judul/link tren dari FYP.
- [x] 3.3 Integrasikan kedua komponen tren ke dalam halaman Workspace Klien (`app/app/admin/clients/[id]/workspace.tsx`).

## 4. Verification & Testing

- [x] 4.1 Jalankan `npx tsc --noEmit` untuk memastikan semua modul dan komponen bebas error tipe.
- [x] 4.2 Lakukan verifikasi visual, aksesibilitas, dan anti-slop rules pada antarmuka tren baru.
