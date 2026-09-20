# Design Spec: Taraju Client Dashboard MVP

**Companion untuk**: spec.md, plan.md
**Created**: 2026-09-13

## 1. Prinsip Desain

Dua tampilan ini punya "kepribadian" yang beda karena penggunanya beda:

- **Sisi Admin**: fungsional, padat informasi, dioptimalkan buat kecepatan kerja (banyak item, banyak aksi)
- **Sisi Client**: sederhana, lega, hampir gak ada elemen yang butuh penjelasan — Pak Adit harus bisa paham cukup dengan sekali lihat

Keduanya tetap pakai satu sistem desain yang sama (warna, tipografi), cuma densitas layout-nya beda.

## 2. Arah Visual

- **Font**: satu keluarga font — **Geist** (dari Vercel, karakter visualnya deket dengan San Francisco/Apple, gratis & legal dipakai di web). Dipakai dengan grade berbeda: `Geist` weight Semibold/Bold ukuran besar untuk heading, `Geist` weight Regular untuk body — ini pendekatan asli ala Apple (satu typeface, beda optical size/weight), bukan sekadar 1 warna default di semua tempat
- **Warna**: latar netral abu sangat muda (`#F5F5F7`, bukan putih polos `#FFFFFF`) khas Apple, teks nyaris hitam (`#1D1D1F`) bukan pure black, satu warna aksen biru (`#0071E3`) untuk tombol/aksi utama, plus warna status (hijau approved, kuning revision) mengikuti saturasi yang sama biar konsisten
- **Tombol**: rounded corner besar (`rounded-xl`/`rounded-2xl`, bukan kotak tajam), shadow lembut (bukan flat), micro-interaction saat ditekan — sedikit mengecil (`scale-95`) lalu balik, bukan cuma ganti warna
- Status (draft/terkirim/approved/revision_requested) dibedakan pakai warna + label, bukan warna doang (buat aksesibilitas — gak semua orang bisa bedain warna)
- Hirarki visual jelas lewat whitespace dan ukuran, bukan garis pembatas di mana-mana

## 3. Layout per Halaman

### Admin — `/admin/dashboard`
- Tabel/list deliverable dengan kolom: judul, tipe, status (badge warna), tanggal update
- Filter di atas — status pakai **segmented control / pill** (4 opsi, lihat 8.3), tipe pakai dropdown (3 opsi: brief/content/report bisa juga pills)
- Tombol "Deliverable Baru" jelas terlihat, biasanya kanan atas
- Klik satu baris → masuk ke detail

### Admin — `/admin/deliverables/new` & `/admin/deliverables/[id]`
- Form sederhana: tipe pakai segmented/pill control (3 opsi: brief/content/report — sesuai 8.3), input judul, textarea isi (markdown-friendly), input link eksternal opsional
- Di halaman detail (bukan new): tombol status di atas, thread komentar di bawah form
- Tombol "Kirim ke Client" jadi call-to-action utama saat status masih draft

### Client — `/client/dashboard`
- Bukan tabel — pakai **card list**, lebih ramah buat non-teknis
- Tiap card: judul, tipe (ikon sederhana), badge status besar dan jelas
- Urutan default: yang butuh tindakan (status "terkirim") di paling atas

### Client — `/client/deliverables/[id]`
- Isi deliverable ditampilkan lega, mudah dibaca (bukan padat kayak sisi admin)
- Dua tombol besar berdampingan: **"Disetujui"** (hijau) dan **"Minta Revisi"** (kuning/oranye) — ukuran cukup besar buat di-tap di HP
- Kolom komentar di bawah, dengan placeholder yang ngajak ngomong natural: *"Ada masukan atau pertanyaan?"* bukan "Tulis komentar Anda di sini"

## 4. Komponen Reusable

- `StatusBadge` — satu komponen dipakai di admin & client, warna+label konsisten, rounded-full (pill shape, khas Apple), dibangun dari Badge primitif Animate UI dengan transisi halus saat status berubah
- `DeliverableCard` — versi ringkas buat list, rounded-2xl, shadow lembut, sedikit terangkat (elevate) + fade-in saat di-hover/muncul, pakai Card + motion primitive Animate UI
- `CommentThread` — bubble chat sederhana ala iMessage, bedakan visual pesan admin vs client (align kiri/kanan, warna bubble beda), bubble baru muncul dengan animasi slide-in halus
- `ApproveRevisionButtons` — dua tombol besar rounded-full, cuma dipakai di sisi client, dengan micro-interaction scale saat ditekan (Button primitif Animate UI, di-restyle pakai warna hijau/kuning yang udah ditentuin)

## 5. Mobile

Client kemungkinan besar akses dari HP, jadi mobile bukan "versi kecil dari desktop" — didesain mobile-first duluan buat sisi client:
- Card full-width, tombol besar, jarak antar elemen cukup buat jari
- Sisi admin boleh lebih desktop-oriented (karena lo kemungkinan besar kerja dari laptop), tapi tetap harus tetap kepake di HP kalau darurat

## 6. Teknis

- Tailwind CSS sebagai styling utama (sesuai plan.md)
- **Animate UI** untuk komponen beranimasi (dibangun di atas Tailwind + Motion, basis shadcn/Radix) — dipakai buat komponen yang butuh micro-interaction: tombol, badge, card, transisi antar status. Sifatnya copy-paste ke codebase (bukan npm install biasa), jadi bisa langsung di-restyle pakai token warna & font (`Geist`) yang udah ditentuin di atas, bukan tampilan default mereka
- Animate UI juga nyediain versi animasi dari ikon Lucide — sinkron sama keputusan icon set di bagian 7
- Kontras warna & ukuran teks ikutin standar aksesibilitas dasar (WCAG AA minimal untuk teks status/tombol)
- Semantic HTML tetap dipakai (bukan div bertumpuk) biar gampang di-maintain dan screen-reader-friendly

## 7. Yang Belum Diputuskan

- Font (Geist) dan palet warna dasar (netral abu + aksen biru) sudah diputuskan di atas — tinggal dieksekusi
- Icon set: **Lucide**, dipakai lewat versi animasi dari Animate UI (icon yang bergerak halus saat status berubah — misal centang checkmark saat approve) — sudah otomatis konsisten sama estetika SF Symbols ala Apple
- Dark mode: belum diputuskan apakah MVP perlu — bisa nyusul di fase polish (Phase 7 di tasks.md) kalau dibutuhkan

## 8. UX Rules (Wajib Dipakai)

Aturan-aturan ini diambil dari best practice UI/UX (referensi: @ux_snacks, @uxcoffeetime, login form guidelines) dan WAJIB diterapkan di seluruh dashboard — sisi admin maupun client.

### 8.1 Form & Input

- **Label persisten, bukan placeholder doang** — Setiap input field WAJIB punya label yang selalu terlihat di atas field. Placeholder hanya boleh dipakai sebagai contoh/format bantuan (mis. `hello@contoh.com`), TIDAK boleh jadi satu-satunya penanda field. Alasan: placeholder hilang saat user mulai ngetik → user lupa field itu untuk apa (accessibility + clarity).
- **Error message inline & spesifik** — Kalau input tidak valid, tampilkan pesan error TEPAT di bawah field yang bermasalah (bukan di atas form), dengan warna merah konsisten + icon. Pesan harus kasih solusi konkret: `"Masukkan email dalam format nama@contoh.com"` — BUKAN `"Format email salah"`. Error harus muncul saat user selesai ngetik (on blur), bukan di tengah ngetik.
- **Numeric/short input → langsung ketik, bukan dropdown** — Kalau nilainya pendek dan familiar (tanggal, jumlah, angka), pakai text input atau slider, BUKAN dropdown. Dropdown cuma wajib buat pilihan panjang (>5) atau nilai yang memang harus dipilih dari daftar.
- **Password (kalau dipakai) → toggle visibility** — Icon mata di dalam field, kanan. Default hidden, bisa show. (Google OAuth berarti form password jarang dipakai, tapi kalau ada admin reset flow, terapkan ini.)

### 8.2 Tombol (Buttons)

- **Label action-oriented, bukan generic** — Tombol bilang apa yang TERJADI, bukan istilah sistem: `"Kirim ke Client"`, `"Simpan Draft"`, `"Disetujui"`, `"Minta Revisi"` — BUKAN `"Submit"`, `"OK"`, `"Yes"`. User harus paham hasil tanpa mikir.
  - Khususnya: dialog konfirmasi → tombol bilang aksi spesifik (`"Simpan Perubahan"`) bukan `"Ya"`.
- **Primary CTA menonjol** — Tombol utama (Kirim, Approve, Simpan) WAJIB filled + high contrast terhadap background (biru `#0071E3` atau hijau/kuning sesuai status), minimal 44px tinggi (mobile). Tombol sekunder (Batal, Hapus) outline/ghost yang jelas TIDAK bersaing dengan primary.
- **Hirarki visual** — Satu halaman = SATU primary action yang jelas. Yang lain secondary. Jangan dua tombol besar sama gaya.

### 8.3 Pemilihan Kontrol (Dropdown vs Lainnya)

- **≤5 opsi → radio/segmented control, BUKAN dropdown** — Status deliverable (draft/sent/approved/revision_requested) itu 4 opsi → WAJIB pakai segmented control/radio di sisi admin, bukan dropdown. Dropdown menyembunyikan opsi, butuh 2 klik, dan user harus mengingat pilihannya (recognition over recall).
- **Binary selection → toggle/checkbox** — Pilihan ya/tidak (mis. "Tampilkan ke client?") pakai toggle switch, bukan dropdown "Yes/No".
- **Long list (>5) → autosuggest/search** — Kalau list panjang (klien, tipe konten), pakai input dengan search/autocomplete, bukan scroll dropdown.

### 8.4 Feedback & Status

- **Status selalu terlihat** — Badge status deliverable (draft/terkirim/disetujui/minta revisi) WAJIB selalu tampil dengan color + label (format aksesibilitas), di card/list AND detail. Ini "visibility of system status" (Nielsen heuristic 1).
- **Loading state jelas** — Kalau ada proses async (kirim, simpan), kasih pesan spesifik: `"Mengirim ke client..."` + spinner, estimasi kalau bisa. BUKAN spinner doang atau `"Mohon tunggu..."`.
- **Progress (kalau multi-step)** — Form multi-step (kalau dibuat) WAJIB progress bar yang jelas step mana sekarang.

### 8.5 Mobile (Client-First, sesuai bagian 5)

- **Touch target min 44px** — Semua tombol & field input min 44px tinggi di mobile (Fitts's Law). Desktop boleh lebih kecil (36px) tapi konsisten.
- **Spacing konsisten 16px** antar field — Jangan rapat-rapat berhimpitan, biar lega dan ga salah ketuk.

### 8.6 Modal & Konfirmasi

- **Modal cuma untuk aksi penting yang musti selesai dulu** — Konfirmasi hapus / aksi destruktif pakai modal. Tombol di modal pakai label aksi spesifik (lihat 8.2).
- **Jangan reset form saat pindah flow** — Kalau user pindah dari satu flow ke flow lain (mis. login → register), data yang sudah diketik TIDAK hilang.
